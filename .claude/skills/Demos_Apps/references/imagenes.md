# Guía — Imágenes de la demo (con /Generar_Imagen, incrustadas en base64)

La app debe verse **muy bonita**. Tú generas las imágenes con el motor de **`/Generar_Imagen`**
(`generar.ps1`, Pollinations+Flux, WebP liviano) y las **incrustas en base64** dentro del HTML para que
todo viaje en un solo archivo por WhatsApp. Las imágenes deben tener **coherencia visual con el menú**.

---

## Qué imágenes generar (y cuáles NO)
| Imagen | ¿Se genera? | Cantidad |
|---|---|---|
| **Logo** | ❌ NO — lo envía el usuario al inicio. Si no hay, se usa logo tipográfico (inicial en fuente display). | — |

> **Logo sin marco.** Incrústalo tal cual lo manda el usuario, **preservando su transparencia** (no lo
> pongas sobre una caja/recuadro de color). La plantilla ya lo muestra **grande, completo (`contain`) y con
> relieve** (drop-shadow), sin marco. Si viene en PNG con fondo, conviértelo a WebP **manteniendo el alpha**
> (`cwebp -q 90`); no lo aplanes sobre negro ni blanco.

| **Héroe / banner** | ✅ Sí (1) — bienvenida antojable, nítida (no borrosa). | 1 |
| **Cabecera de sección** | ✅ Sí — 1 por sección, que se entienda qué es. | 1 por sección |
| **Producto destacado** | ✅ Solo los `destacado:true` (los mejores), no todos (por peso). | pocos |
| **Resto de productos** | ❌ Usan emoji temático elegante. | — |

**Tope total ~15–25 imágenes.** Si hay muchas secciones, prioriza héroe + cabeceras y baja los destacados.
Así no saturas el generador (Pollinations es por cola, lento) ni inflas el archivo.

## Estilo (coherencia con el menú)
Mira el menú primero y decide el estilo para que la imagen **se integre, no choque**:
- Menú con **fotos reales** → genera **fotografía de producto realista**, estilo "menú premium",
  fondo limpio en tonos de la paleta del local.
- Menú **ilustrado / animado / plano** → genera **ilustración** del mismo estilo.
- Siempre: que los **colores de la imagen peguen con la paleta** (menciona los tonos de marca en el prompt).

## Cómo construir el prompt (en INGLÉS — Flux rinde mejor)
- Traduce la idea al inglés y añade términos de calidad:
  - Comida real: `professional food photography, appetizing, vibrant, shallow depth of field, soft lighting, high detail, sharp focus`
  - Producto/objeto: `professional product photography, soft studio lighting, clean background, high detail`
  - Ilustración: `clean flat vector illustration, vibrant, modern` (o el estilo del menú)
- **Inyecta la paleta**: añade los colores de marca, ej. `warm cream and deep red palette`.
- `no text` casi siempre (Flux escribe mal letras).
- Héroe → orientación **horizontal**; cabeceras y productos → **cuadrada**.

## Generar (en bucle, una por una)
Llama el script de `/Generar_Imagen` por cada imagen, en **WebP** (`-Uso web`, queda liviano para base64):
```powershell
& "C:\Users\Sinfi\.claude\skills\Generar_Imagen\generar.ps1" `
  -Prompt "PROMPT EN INGLES CON PALETA" `
  -Out "C:\ruta\proyecto\_img_demo\hero" `
  -Uso web `
  -Orient horizontal
```
- `-Out` sin extensión; el script crea `hero.webp`. Guárdalas en una carpeta temporal `_img_demo/`.
- Es por cola → puede tardar; el script reintenta solo. Para varias, llámalo una tras otra.

## Incrustar en base64 dentro del HTML
Convierte cada WebP a `data:image/webp;base64,...` y pégalo en su campo de `DATA`
(`DATA.hero`, `seccion.img`, `producto.img`). Ejemplo para obtener el base64:
```powershell
$b = [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\ruta\_img_demo\hero.webp"))
"data:image/webp;base64,$b" | Set-Content -Encoding ascii "C:\ruta\_img_demo\hero.b64.txt"
```
(o en Python: `base64.b64encode(open(path,'rb').read()).decode()`). Inserta la cadena completa
en el `DATA`. WebP a q82 ≈ 50–150 KB c/u → 20 imágenes ≈ 1–3 MB, perfecto para WhatsApp.

## Auto-revisión (OBLIGATORIO — lo pidió el usuario)
Genera automático, **pero revisa cómo se ve integrada**:
1. **Lee cada imagen con Read** apenas se genera: ¿corresponde a lo pedido? ¿composición correcta? Si no,
   regenera cambiando el prompt o el `-Seed`.
2. Tras incrustarlas, **abre la app** (panel de preview / screenshot) y míralа entera: ¿las imágenes
   **combinan** con la paleta y entre sí? ¿alguna desentona, se ve borrosa o fuera de lugar?
3. Si algo no pega: **rehaz la imagen** (ajústala a la app) **o ajusta la app** (paleta/encuadre/overlay)
   para que armonicen. La app y las imágenes deben sentirse una sola pieza.

## Limpieza
Borra la carpeta temporal `_img_demo/` al final (las imágenes ya viven en base64 dentro del HTML).
Conserva solo `App-<Negocio>.html`.
