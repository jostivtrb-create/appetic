---
name: Generar_Imagen
description: Genera CUALQUIER imagen desde una descripción de texto usando IA (Pollinations + Flux) — gratis, sin API key, sin cuenta. La entrega en el formato correcto según el uso: pregunta si es para una APP/SITIO WEB (la devuelve en WebP optimizado y liviano para que no pese en la app) o para OTRO USO (imprimir, editar, redes, presentación) y la devuelve en PNG de alta resolución. Úsala cuando el usuario diga "/Generar_Imagen", "genérame una imagen de…", "créame una imagen…", "necesito una imagen/foto/ilustración de…", "haz una imagen para mi app/web", "imagen con IA", "una foto de producto de…", "un fondo/banner de…", "ilustración de…", o cualquier variación de querer CREAR una imagen nueva desde cero. NO confundir con /Mejorar_Calidad_Imagen (esa mejora una imagen existente) ni con /Quitar_Fondo_Mejorar_Calidad (esa hace stickers). Es GENÉRICA: cualquier tema, cualquier proyecto, fotos o ilustraciones.
---

# Generar Imagen con IA (Pollinations + Flux)

## Propósito
Crear una imagen nueva desde texto, **gratis y sin API key**, y entregarla en el **formato adecuado según dónde se va a usar**:
- **App / sitio web** → **WebP** optimizado y liviano (no infla el peso de la app).
- **Otro uso** (imprimir, editar, redes, presentación) → **PNG** en alta resolución (máxima calidad).

## Herramientas (locales, se instalan solas si faltan)
- **Pollinations** (`image.pollinations.ai`) — IA open-source, gratis, sin cuenta. Modelo **Flux** (buena calidad). Se le pide la imagen por URL y se descarga.
- **cwebp** (Google libwebp, portable) en `C:\Users\Sinfi\.claude\tools\webp\cwebp.exe` — convierte a WebP. El script lo instala si no está.

## ⚠️ Honestidad sobre Pollinations (decirlo si el usuario pregunta)
- Es **gratis** porque es un proyecto comunitario sostenido por patrocinadores y un plan de pago para empresas (tú usas la cola pública gratis).
- **Es lento bajo demanda** (cola): por eso a veces da timeout. El script reintenta automáticamente hasta que baje completa. NO es un cupo, es turno en la cola.
- **No tiene garantía de servicio** (puede estar lento/caído un día). Sirve para generar imágenes una vez; **no lo uses en vivo dentro de la app del cliente**.
- Las imágenes pueden aparecer en su **feed público** → no generes nada sensible/privado.
- Resolución: no hay tope bajo; a más píxeles, más lento.

## Paso 1 — Preguntar al usuario (SIEMPRE, si no lo dijo)
1. **¿Qué imagen quieres?** (la descripción). Si es vaga, pide 1-2 detalles (estilo, colores, fondo).
2. **¿Para qué la vas a usar?** → define el formato:
   - **App / sitio web** → `-Uso web` (WebP liviano)
   - **Otro uso / máxima calidad / imprimir** → `-Uso alta` (PNG grande)
3. **¿Orientación?** cuadrada (default), horizontal o vertical → `-Orient`.

> Si el usuario ya dejó claro el uso en su mensaje ("para la app", "para imprimir"), no vuelvas a preguntar: elige tú.

## Paso 2 — Construir un buen prompt
- **Escribe el prompt en INGLÉS** (Flux rinde mucho mejor). Traduce la idea del usuario.
- Añade términos de calidad según el tipo:
  - Foto/producto: `professional photography, soft lighting, high detail, sharp focus`
  - Comida: `professional food photography, appetizing, vibrant colors, shallow depth of field`
  - Ilustración: `digital illustration, clean, vibrant` (o el estilo que pida)
- Evita texto dentro de la imagen (Flux escribe mal): agrega `no text` si aplica.

## Paso 3 — Generar (script motor con reintentos)
```powershell
& "C:\Users\Sinfi\.claude\skills\Generar_Imagen\generar.ps1" `
  -Prompt "TU PROMPT EN INGLES" `
  -Out "C:\ruta\donde\guardar\nombre" `
  -Uso web `          # web | alta
  -Orient cuadrada    # cuadrada | horizontal | vertical
```
- `-Out` es la ruta SIN extensión (el script pone `.webp` o `.png` según el uso).
- El script imprime una línea final: `LISTO_WEB|ruta|dimensiones|peso` o `LISTO_ALTA|...`.
- Tarda según la cola de Pollinations; si tarda mucho, es normal (reintenta solo).
- Para generar **varias** imágenes, llama el script en un loop (una por una; o lánzalo como proceso aparte con `Start-Process` si son muchas y no quieres bloquear).

## Paso 4 — Verificar y entregar
1. Lee la imagen con **Read** para confirmar que se ve bien y corresponde a lo pedido.
   - Nota: el visor de Windows viejo NO lee WebP, pero **Read sí** y el navegador también. Si Read fallara, conviértela a PNG temporal solo para verla.
2. Informa al usuario: **dimensiones, peso, y que fue gratis y local**.
3. Entrega con **SendUserFile**.
4. Si NO quedó bien (no corresponde, composición rara), regenera cambiando el prompt o el `-Seed`.

## Recomendaciones de calidad/peso (criterio)
- **Web**: el script ya deja lado mayor ≤ 1280px y WebP q82 → típico **50–150 KB**. Perfecto para apps. No subas más resolución "por si acaso": peso de más = app lenta.
- **Alta**: PNG a 1536px+. Si el usuario quiere AÚN más (imprimir grande), encadena **/Mejorar_Calidad_Imagen** (upscale Real-ESRGAN) sobre el PNG resultante.
- **Detalle real vs upscale**: generar grande de una da detalle REAL; el upscale solo reconstruye. Para máxima calidad: generar en alta + upscale.

## Resumen del flujo
Preguntar (qué + para qué + orientación) → prompt en inglés → `generar.ps1` → Read para verificar → SendUserFile + informar peso. Gratis, local, sin Canva.
