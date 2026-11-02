#!/usr/bin/env python3
"""
recortar_croma.py — Recorta imágenes hechas con Gemini (Nano Banana) sobre FONDO CROMA
(verde #00FF00, magenta #FF00FF o azul #0000FF) y deja PNG transparentes pulidos.

Es la pieza que une /Generar_Imagen con /Quitar_Fondo_Mejorar_Calidad para el caso SPRITE:
el fondo croma es saturado y NO está en el sujeto, así que se puede quitar en TODA la imagen
(también los huecos encerrados entre hojas, letras o dedos), cosa que el flood-fill desde el
borde de remove_bg.py no hace. Para fondos blancos/crema o casos raros, usa remove_bg.py.

Uso:
  python3 recortar_croma.py ENTRADA SALIDA.png [opciones]

Opciones:
  --webp N        Además guarda SALIDA.webp con el lado mayor = N px (para apps/web).
  --separar       La imagen es una HOJA con varios íconos: guarda cada uno aparte
                  (SALIDA_01.png, SALIDA_02.png…) en orden de lectura.
  --solo-borde    Quita solo el fondo conectado al borde (si el sujeto tiene partes
                  del mismo color que el fondo y deben quedarse).
  --t0 / --t1     Distancia de color al fondo: < t0 = transparente, > t1 = opaco,
                  entre ambos = borde suave. Def. 60 / 140.
  --margen N      Píxeles transparentes alrededor del sujeto al recortar (def. 8).
  --sin-recorte   No recortar al contenido (mantener el lienzo).
  --motas F       umbral de motas sueltas (def. 0.0002 del área). Con TEXTO usa 0.00002:
                  los puntos de la i y las tildes son piezas sueltas y se borrarían.
  --con-marca     NO borrar el objeto pequeño de la esquina inferior derecha
                  (por defecto se borra: es la marca ✦ que pone Gemini).

Imprime al final:  LISTO|salida|WxH|pesoKB|croma=#RRGGBB|resto=X%
y deja SALIDA.chk.png (el resultado sobre claro / oscuro / violeta) para mirarlo con Read.
"""
import argparse, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

CHK = [(245, 245, 245), (20, 17, 26), (109, 40, 217)]  # claro, oscuro, violeta


def color_fondo(rgb):
    h, w, _ = rgb.shape
    b = max(4, min(h, w) // 100)
    borde = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3),
                            rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    key = np.median(borde, axis=0)
    dispersion = np.sqrt(((borde - key) ** 2).sum(1)).mean()
    return key, dispersion


def recortar(rgb, key, t0, t1, solo_borde, quitar_marca=True, motas=0.0002):
    dist = np.sqrt(((rgb - key) ** 2).sum(2))
    alpha = np.clip((dist - t0) / (t1 - t0), 0, 1)
    if solo_borde:
        fondo = dist < t1
        lab, _ = ndimage.label(fondo)
        borde_ids = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
        conectado = np.isin(lab, borde_ids[borde_ids > 0])
        alpha = np.where(conectado, alpha, 1.0)

    # Despill: quita el tinte del fondo que la IA deja en el contorno.
    gris = rgb.mean(2, keepdims=True)
    kdir = key - key.mean()
    kdir = kdir / (np.linalg.norm(kdir) + 1e-6)
    tinte = ((rgb - gris) * kdir).sum(2, keepdims=True)
    cerca = ndimage.binary_dilation(alpha < 0.98, iterations=3)[..., None]
    rgb = np.where(cerca & (tinte > 0), rgb - tinte * kdir, rgb)
    rgb = np.clip(rgb, 0, 255)

    # Motas sueltas (restos de ruido del fondo).
    lab, n = ndimage.label(alpha > 0.5)
    if n > 1:
        tam = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1))
        chicas = np.isin(lab, np.where(tam < alpha.size * motas)[0] + 1)
        alpha[chicas] = 0
    alpha[alpha < 0.03] = 0
    if quitar_marca:
        # Marca ✦ de Gemini: un objeto pequeño metido entero en la esquina inferior derecha.
        h, w = alpha.shape
        lab, n = ndimage.label(alpha > 0.05)
        for i, c in enumerate(ndimage.find_objects(lab), 1):
            alto, ancho = c[0].stop - c[0].start, c[1].stop - c[1].start
            if c[0].start > h * 0.82 and c[1].start > w * 0.82 and max(alto, ancho) < min(h, w) * 0.12:
                alpha[lab == i] = 0
    return rgb, alpha


def recortar_caja(img, margen):
    caja = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not caja:
        return img
    x0, y0, x1, y1 = caja
    w, h = img.size
    return img.crop((max(0, x0 - margen), max(0, y0 - margen),
                     min(w, x1 + margen), min(h, y1 + margen)))


def guardar(img, ruta, webp):
    img.save(ruta, 'PNG', optimize=True)
    extra = ''
    if webp:
        v = img.copy()
        v.thumbnail((webp, webp), Image.LANCZOS)
        rw = os.path.splitext(ruta)[0] + '.webp'
        v.save(rw, 'WEBP', quality=88, method=6)
        extra = f'|webp={rw}({os.path.getsize(rw)//1024}KB)'
    return extra


def hoja_chequeo(imgs, ruta):
    alto = 360
    filas = []
    for im in imgs:
        e = alto / im.height
        p = im.resize((max(1, int(im.width * e)), alto), Image.LANCZOS)
        fila = Image.new('RGB', (p.width * 3 + 40, alto + 20), (90, 90, 90))
        for i, c in enumerate(CHK):
            f = Image.new('RGBA', p.size, c + (255,))
            f.alpha_composite(p)
            fila.paste(f.convert('RGB'), (10 + i * (p.width + 10), 10))
        filas.append(fila)
    ancho = max(f.width for f in filas)
    hoja = Image.new('RGB', (ancho, sum(f.height for f in filas)), (90, 90, 90))
    y = 0
    for f in filas:
        hoja.paste(f, (0, y)); y += f.height
    if hoja.width > 1600:
        hoja.thumbnail((1600, 1600 * 4))
    hoja.save(ruta)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--webp', type=int, default=0)
    ap.add_argument('--separar', action='store_true')
    ap.add_argument('--solo-borde', action='store_true')
    ap.add_argument('--t0', type=float, default=60)
    ap.add_argument('--t1', type=float, default=140)
    ap.add_argument('--margen', type=int, default=8)
    ap.add_argument('--sin-recorte', action='store_true')
    ap.add_argument('--con-marca', action='store_true')
    ap.add_argument('--motas', type=float, default=0.0002,
                    help='fracción del área bajo la cual una pieza suelta se borra como ruido (bajar si hay texto con puntos de i/tildes)')
    a = ap.parse_args()

    rgb = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32)
    key, disp = color_fondo(rgb)
    hexk = '#%02X%02X%02X' % tuple(int(v) for v in key)
    if key.max() - key.min() < 80:
        print(f'AVISO: el fondo {hexk} no es un color croma saturado; '
              'mejor usa remove_bg.py de /Quitar_Fondo_Mejorar_Calidad.', file=sys.stderr)
    if disp > 25:
        print(f'AVISO: el fondo no es plano (dispersión {disp:.0f}): degradado o sombra. '
              'Revisa el chequeo; si falla, pide a Gemini el fondo plano otra vez.', file=sys.stderr)

    rgb2, alpha = recortar(rgb, key, a.t0, a.t1, a.solo_borde, not a.con_marca, a.motas)
    out = np.dstack([rgb2, alpha[..., None] * 255]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')

    # Resto de fondo que sobrevivió opaco (debería ser ~0%).
    d = np.sqrt(((rgb2 - key) ** 2).sum(2))
    resto = float(((alpha > 0.5) & (d < a.t1)).sum()) / max(1, (alpha > 0.5).sum()) * 100

    base = os.path.splitext(a.out)[0]
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    piezas = []
    if a.separar:
        lab, n = ndimage.label(ndimage.binary_dilation(alpha > 0.1, iterations=12))
        cajas = ndimage.find_objects(lab)
        grandes = [(c, i + 1) for i, c in enumerate(cajas)
                   if (c[0].stop - c[0].start) * (c[1].stop - c[1].start) > alpha.size * 0.002]
        alto_fila = np.median([c[0].stop - c[0].start for c, _ in grandes]) if grandes else 1
        grandes.sort(key=lambda t: (round(t[0][0].start / alto_fila), t[0][1].start))
        for k, (c, idx) in enumerate(grandes, 1):
            m = (lab == idx)
            pieza = np.where(m[..., None], out, 0).astype(np.uint8)
            im = Image.fromarray(pieza, 'RGBA').crop((c[1].start, c[0].start, c[1].stop, c[0].stop))
            im = recortar_caja(im, a.margen)
            ruta = f'{base}_{k:02d}.png'
            extra = guardar(im, ruta, a.webp)
            piezas.append(im)
            print(f'PIEZA|{ruta}|{im.width}x{im.height}|{os.path.getsize(ruta)//1024}KB{extra}')
    else:
        if not a.sin_recorte:
            img = recortar_caja(img, a.margen)
        ruta = base + '.png'
        extra = guardar(img, ruta, a.webp)
        piezas.append(img)
        print(f'PIEZA|{ruta}|{img.width}x{img.height}|{os.path.getsize(ruta)//1024}KB{extra}')

    hoja_chequeo(piezas, base + '.chk.png')
    total = base + ('_01.png' if a.separar else '.png')
    print(f'LISTO|{total}|{len(piezas)} pieza(s)|croma={hexk}|resto={resto:.2f}%|chequeo={base}.chk.png')


if __name__ == '__main__':
    main()

