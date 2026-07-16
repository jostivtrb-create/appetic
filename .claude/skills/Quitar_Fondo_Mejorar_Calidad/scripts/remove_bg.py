#!/usr/bin/env python
"""
Quita el fondo de una imagen y deja SOLO el sujeto como PNG transparente.
Pensado para stickers/logos/ilustraciones con fondo claro (blanco/crema) que
ademas pueden traer TRAZOS FANTASMA (lineas de cielo, nubes, bocetos tenues)
que un recorte por color exacto deja pasar y se ven horribles sobre oscuro.

Uso:
  python remove_bg.py ENTRADA SALIDA [opciones]

Opciones:
  --threshold 60        Distancia de color al fondo para contarlo como fondo.
  --light-min 200       Un pixel CLARO (min(r,g,b) >= esto) y NEUTRO se trata
                        como fondo aunque no sea identico al color de esquina.
                        Esto es lo que borra los trazos de nube gris-claro.
  --neutral-chroma 45   Solo se considera "claro = fondo" si su cromaticidad
                        (max-min) es <= esto (gris/blanco). Asi NO se comen las
                        zonas claras PERO de color del sujeto (sombrero tostado,
                        cinta crema), que ademas suelen ir encerradas.
  --feather 2.0         Difuminado del borde de la mascara (anti-dentado).
  --despeckle 0.0004    Quita restos sueltos cuya area < fraccion del total
                        (mata fragmentos de trazos/nubes que sobrevivan).
  --erode 1             Encoge la silueta N px para matar el halo claro del borde.
  --no-keep-center      No filtrar al sujeto central (deja TODO lo no-fondo).
                        Usar cuando el logo tiene varios bloques separados
                        (escena + texto en lineas aparte).
  --no-crop             No recortar al contenido.

Como funciona:
  1. Fondo = color promedio de las 4 esquinas.
  2. is_bg(pixel) = (parecido al color de fondo)  O  (CLARO y NEUTRO).
     -> el segundo termino es lo que captura los trazos de nube tenues.
  3. Flood-fill desde TODOS los bordes sobre is_bg -> transparenta el fondo.
     La conectividad protege lo claro PERO encerrado (sombrero, cuello, cinta).
  4. (keep-center opcional) se queda con la mancha que toca el centro.
  5. Despeckle: borra fragmentos sueltos diminutos (restos de trazos).
  6. Erode + feather: borde sin halo y suave (no dentado).
  7. Recorta y guarda.

REGLA DE ORO: verifica SIEMPRE el resultado compuesto sobre fondo CLARO **y
OSCURO** antes de entregar. Los trazos fantasma solo se ven sobre oscuro.
"""
import argparse
from collections import deque
from PIL import Image, ImageFilter


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--threshold", type=float, default=60,
                    help="Distancia de color al fondo (def. 60)")
    ap.add_argument("--light-min", type=int, default=200,
                    help="min(r,g,b) >= esto + neutro => fondo claro (def. 200)")
    ap.add_argument("--neutral-chroma", type=int, default=45,
                    help="Cromaticidad max para tratar 'claro' como fondo (def. 45)")
    ap.add_argument("--feather", type=float, default=2.0,
                    help="Difuminado del borde de la mascara (def. 2.0)")
    ap.add_argument("--despeckle", type=float, default=0.0004,
                    help="Fraccion de area minima para conservar un fragmento (def. 0.0004)")
    ap.add_argument("--erode", type=int, default=1,
                    help="Px a encoger la silueta para matar halo (def. 1)")
    ap.add_argument("--no-keep-center", action="store_true")
    ap.add_argument("--no-crop", action="store_true")
    args = ap.parse_args()

    img = Image.open(args.src).convert("RGBA")
    px = img.load()
    W, H = img.size
    N = W * H

    corners = [px[0, 0], px[W - 1, 0], px[0, H - 1], px[W - 1, H - 1]]
    br = sum(c[0] for c in corners) / 4
    bg = sum(c[1] for c in corners) / 4
    bb = sum(c[2] for c in corners) / 4
    th2 = args.threshold * args.threshold
    lmin = args.light_min
    nchroma = args.neutral_chroma

    def is_bg(c):
        r, g, b = c[0], c[1], c[2]
        # 1) claro y neutro (blanco + gris-claro de los trazos de nube)
        mn = r if r < g else g
        if mn > b:
            mn = b
        if mn >= lmin:
            mx = r if r > g else g
            if mx < b:
                mx = b
            if mx - mn <= nchroma:
                return True
        # 2) parecido al color de fondo de las esquinas
        dr, dg, db = r - br, g - bg, b - bb
        return (dr * dr + dg * dg + db * db) <= th2

    # --- 1) Flood fill del fondo desde los bordes ---
    visited = bytearray(N)
    q = deque()
    for x in range(W):
        for y in (0, H - 1):
            i = y * W + x
            if not visited[i] and is_bg(px[x, y]):
                visited[i] = 1
                q.append((x, y))
    for y in range(H):
        for x in (0, W - 1):
            i = y * W + x
            if not visited[i] and is_bg(px[x, y]):
                visited[i] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H:
                i = ny * W + nx
                if not visited[i] and is_bg(px[nx, ny]):
                    visited[i] = 1
                    q.append((nx, ny))

    # --- 2) Quedarnos solo con el sujeto central (8-conexo) ---
    if not args.no_keep_center:
        keep = bytearray(N)
        cx, cy = W // 2, H // 2
        qq = deque([(cx, cy)])
        keep[cy * W + cx] = 1
        while qq:
            x, y = qq.popleft()
            for nx in (x - 1, x, x + 1):
                for ny in (y - 1, y, y + 1):
                    if 0 <= nx < W and 0 <= ny < H:
                        i = ny * W + nx
                        if not keep[i] and px[nx, ny][3] != 0:
                            keep[i] = 1
                            qq.append((nx, ny))
        for y in range(H):
            row = y * W
            for x in range(W):
                if px[x, y][3] != 0 and not keep[row + x]:
                    r, g, b, _ = px[x, y]
                    px[x, y] = (r, g, b, 0)

    # --- 3) Despeckle: borrar fragmentos sueltos diminutos (restos de trazos) ---
    min_area = max(8, int(args.despeckle * N))
    seen = bytearray(N)
    for sy in range(H):
        base = sy * W
        for sx in range(W):
            if seen[base + sx] or px[sx, sy][3] == 0:
                continue
            comp = []
            dq = deque([(sx, sy)])
            seen[base + sx] = 1
            while dq:
                x, y = dq.popleft()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < W and 0 <= ny < H:
                        i = ny * W + nx
                        if not seen[i] and px[nx, ny][3] != 0:
                            seen[i] = 1
                            dq.append((nx, ny))
            if len(comp) < min_area:
                for x, y in comp:
                    r, g, b, _ = px[x, y]
                    px[x, y] = (r, g, b, 0)

    # --- 4) Erode (matar halo claro) + feather (borde suave) sobre el alfa ---
    alpha = img.getchannel("A")
    if args.erode > 0:
        for _ in range(args.erode):
            alpha = alpha.filter(ImageFilter.MinFilter(3))
    if args.feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(args.feather))
    img.putalpha(alpha)

    # --- 5) Recortar ---
    if not args.no_crop:
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

    img.save(args.out)
    print(f"OK -> {args.out}  ({img.width}x{img.height})  min_area={min_area}")


if __name__ == "__main__":
    main()
