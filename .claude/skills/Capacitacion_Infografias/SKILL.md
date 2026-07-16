---
name: Capacitacion_Infografias
description: >
  Prepara las infografías de capacitación de los productos de Infinity Eventos
  (app Registro Infiniity) en FLUJO MANUAL (sin créditos de IA). Lee la base de
  datos, toma los productos con descripción y sin prompts, ORGANIZA el texto crudo
  en pasos claros, DECIDE cuántas infografías hacen falta, arma el PROMPT perfecto
  de cada una (con la mascota Jimbo y las reglas aprendidas) y los ESCRIBE dentro
  del producto para que Camilo los vea en la pestaña /capacitacion, los copie,
  genere las imágenes a mano y las suba. Luego, en un segundo modo, toma las fotos
  que Camilo subió ('cruda'), las pasa por /Mejorar_Calidad_Imagen, les estampa el
  logo en la esquina reservada y las deja 'generada' para que Camilo apruebe. Es
  reanudable: cada corrida recalcula pendientes con pendientes.mjs. Úsala cuando el
  usuario diga "/Capacitacion_Infografias", "genera los prompts de capacitación",
  "arma las capacitaciones de los productos", "corre la skill de capacitación",
  "finaliza las fotos de capacitación", o variaciones.
---

# Capacitación → Infografías (flujo MANUAL, sin créditos)

Convierte la **descripción de capacitación** de cada producto en **prompts** que
Camilo genera a mano (ya no gastamos créditos de IA). Tú (el agente) eres los "dos
cerebros": **organizas** el texto y **decides el plan**, luego **armas el prompt**.
El proceso quedó partido en dos modos:

- **MODO A — Cargar prompts:** lees los pendientes, organizas el texto, armas los
  prompts y los ESCRIBES en cada producto. Camilo los ve en `/capacitacion`.
- **MODO B — Finalizar fotos:** Camilo ya subió sus fotos ('cruda'); tú las pasas
  por Mejorar Calidad, les estampas el logo y las dejas 'generada'.

> ⚠️ **Ya NO se generan imágenes con IA** (Higgsfield/Gemini). Nos quedamos sin
> créditos. El flujo viejo por API/navegador quedó en el historial de git; no lo uses.

## Base directory de esta skill
`C:\Users\Sinfi\.claude\skills\Capacitacion_Infografias`
- `assets/logo.png` — logo circular de Infiniity (se estampa en el MODO B).
- `assets/mascota.png`, `assets/mascota-pregunta.png` — referencia visual de Jimbo
  (NO se suben; Jimbo se DESCRIBE con texto en el prompt).
- `assets/lecciones.md` — reglas vivas anti-errores; se inyectan en CADA prompt.
- `assets/estilo-aprobado.md` — constancia del estilo aprobado por Camilo.

## Proyecto y scripts
Repo: `C:\Users\Sinfi\OneDrive\Infiniity Eventos\APP REGISTRO`
Scripts Node en `app/scripts/capacitacion/`, se corren **desde `app/`**. Usan el
**SDK cliente** de Firebase (ya instalado) — las reglas de Firestore están abiertas,
así que NO necesitan firebase-admin ni service-account.
- `node scripts/capacitacion/pendientes.mjs` → JSON con `paraPrompt` y `paraFinalizar`.
- `node scripts/capacitacion/guardar-prompts.mjs <productId> <prompts.json>` → escribe
  los prompts en el producto (estado → 'por_subir').
- `node scripts/capacitacion/finalizar.mjs <productId> <infografiaIdx> <final.webp>` →
  reemplaza la foto 'cruda' por la final procesada y la deja 'generada'. *(MODO B)*

## Modelo de datos (campo `capacitacion` del producto)
```
capacitacion: {
  descripcion: string,
  descartado: boolean,
  prompts: [{ parte, subtitulo, prompt }],   // los armas TÚ; Camilo los copia
  infografias: [{ url, estado, creadaEn, path?, motivoRechazo? }]
}
```
Estados de infografía: `'cruda'` (subida por Camilo, sin procesar) → `'generada'`
(procesada, espera aprobación) → `'aprobada'` | `'rechazada'`.

## Máquina de estados (qué hace cada corrida) — la aplica `pendientes.mjs`
- **Sin descripción** o **`descartado`** → IGNORAR.
- **Descripción, SIN prompts, sin infografía vigente** → **MODO A** (armar prompts).
- **Con prompts, sin fotos** → esperar a que Camilo suba (nada que hacer).
- **Fotos 'cruda'** → **MODO B** (finalizar: calidad + logo).
- **'generada' o 'aprobada'** → esperar/saltar.

---

## Requisitos antes de empezar
1. **Node disponible** y correr los scripts **desde `app/`**. (No hace falta Gemini,
   ni Higgsfield, ni service-account: todo es SDK cliente + reglas abiertas.)
2. Para el **MODO B**: `sharp` instalado en `app/` (para estampar el logo) y la skill
   `/Mejorar_Calidad_Imagen` disponible. Si falta `sharp`, instálalo:
   `cd app && npm i sharp`.

---

## Paso 0 — Leer pendientes
```
cd "C:/Users/Sinfi/OneDrive/Infiniity Eventos/APP REGISTRO/app"
node scripts/capacitacion/pendientes.mjs
```
- `paraPrompt` vacío y `paraFinalizar` vacío → "no hay nada por hacer" y termina.
- Si hay → trabaja MODO A sobre `paraPrompt`, MODO B sobre `paraFinalizar`.

---

## MODO A — Cargar prompts (por cada producto en `paraPrompt`)

### 🧠 Cerebro 1 — Organiza el texto
El campo `descripcion` viene crudo (Camilo lo escribió "como pudo"). Reescríbelo:
- Conviértelo en **pasos claros y cortos**, ordenados.
- Agrupa en secciones útiles: **Qué es**, **Montaje/Uso (pasos)**, **Cuidados /
  Advertencias**, **Errores comunes**, **Datos** (medidas, capacidad…), **Tip**.
- Resume, quita relleno, corrige redacción. Lenguaje simple para capacitar a un
  gestor. **NO inventes datos** que no estén en la descripción.

### 🧠 Cerebro 2 — Decide cuántas infografías
Según el VOLUMEN ya organizado:
- Poco (≤ ~6 puntos) → **1** infografía.
- Medio → **2**. Mucho → **3**. Nunca más de 3 salvo que sea evidente.
Regla de oro: **ninguna infografía saturada de texto.** Si dudas, parte en más.

### 🧠 Aprende de los rechazos
- Al INICIO, **lee `assets/lecciones.md`** e inyecta TODAS sus reglas en CADA prompt
  (bloque "REGLAS APRENDIDAS").
- Si un producto trae `motivosRechazo` (los da `pendientes.mjs`), léelos y corrígelos
  puntualmente en el nuevo prompt. Si el error es GENERAL (podría repetirse en otras),
  **añade una regla nueva** —corta e imperativa— a `assets/lecciones.md`. Así la skill
  mejora sola.

### ✍️ Arma los prompts y guárdalos
Por cada producto: crea un JSON temporal con los N prompts y guárdalo con el script.
```
# tmp/<productId>.json  →  [{ "parte":1, "subtitulo":"…", "prompt":"…" }, …]
cd "C:/Users/Sinfi/OneDrive/Infiniity Eventos/APP REGISTRO/app"
node scripts/capacitacion/guardar-prompts.mjs <productId> tmp/<productId>.json
```
El producto pasa a estado **'por_subir'**: Camilo ya ve los prompts en `/capacitacion`,
los copia, genera cada imagen a mano y la sube.

### Plantilla de prompt (rellena <...> con el contenido organizado)
```
INFOGRAFÍA de capacitación en ESPAÑOL, vertical (relación 3:4), estilo limpio, plano
y profesional, fondo claro.

DISEÑO OBLIGATORIO DE LA CABECERA: reserva la ESQUINA SUPERIOR IZQUIERDA como un cuadro
perfectamente CUADRADO y completamente VACÍO, SIN texto ni dibujos — ahí se pega el logo
después. El cuadro debe ser CUADRADO en píxeles: lado ≈ 18% del ancho (que en formato 3:4
equivale a ≈ 13% del alto). El encabezado va DESPLAZADO A LA DERECHA de ese cuadro: que
NINGUNA letra toque la esquina superior izquierda.

Encabezado grande (dibújalo tal cual): <nombre del producto>
Línea pequeña bajo el encabezado: <subtítulo de esta parte, p.ej. "Montaje (2 de 3)">
CONTENIDO (escribe EXACTAMENTE este texto, con todas sus tildes y la ñ, MUY legible):
<bloque organizado de ESTA infografía: pasos numerados o viñetas cortas>

PERSONAJE PROTAGONISTA (grande y visible, sin tapar el texto):
<DESCRIPCIÓN CANÓNICA DE JIMBO> En esta infografía, Jimbo está <pose acorde al tema>.

ESTILO:
- Paleta de marca: morado #7c3aed y magenta/rosa #ec4899, fondo claro.
- Tarjetas/secciones con iconos simples por cada punto, jerarquía clara.
- NO dibujes ningún logo, marca ni símbolo (ni infinito ∞): esquina sup-izq VACÍA.
- Incluye TODOS los pasos, en orden y sin saltarte ninguno.
- Texto en español, sin faltas, NADA de texto inventado ni "lorem ipsum".

REGLAS APRENDIDAS (cúmplelas SIEMPRE — pega aquí TODAS las líneas de assets/lecciones.md):
<una regla por línea>
```

### Descripción canónica de Jimbo (úsala SIEMPRE)
> **Jimbo**, la mascota de Infiniity Eventos: un **bufón/arlequín joven, DELGADO y ágil**
> — esbelto, extremidades largas, atlético. **NUNCA gordito ni de cara redonda.** Caricatura
> vectorial moderna, contorno oscuro definido, sombreado suave. Rostro juvenil, sonrisa
> cálida, mejillas rosadas. **Gorro de bufón de tres puntas** morado y magenta con cascabeles
> plateados. **Cuello de arlequín** con cascabeles. **Túnica/jubón morado** ajustado, acentos
> magenta, basta en zigzag, cinturón con hebilla plateada. **Mallas a rayas** morado y magenta,
> piernas delgadas. **Zapatos puntiagudos** con cascabel. Paleta morado→magenta (#6d28d9,
> #7c3aed, #c026d3, #ec4899). **Pose DINÁMICA y distinta en cada infografía** según el tema
> (saltando, señalando un paso, cargando material, celebrando…). En infografías de
> **advertencias/errores**, Jimbo va **pensativo/preocupado**. Es el **PROTAGONISTA**: esbelto,
> grande y visible, **sin tapar el texto**.

---

## MODO B — Finalizar fotos que subió Camilo (por cada `paraFinalizar`)

Para cada foto `'cruda'` (trae `idx` y `url`):
1. **Descárgala:** `curl -s -o tmp/<productId>_<idx>.png "<url>"`.
2. **Mejora calidad:** pásala por **/Mejorar_Calidad_Imagen** indicando que es para
   **app/web** → devuelve un **.webp** liviano.
3. **Estampa el logo** DENTRO del recuadro reservado:
   `node scripts/capacitacion/componer_logo.mjs tmp/<...>.webp tmp/<...>_final.webp`
   El script YA NO usa un punto fijo: **detecta el recuadro** que dibujó la generación
   (por sus bordes) y **centra el logo dentro**, al ~82% del hueco. Imprime un JSON con
   `deteccion` (`recuadro` | `heuristica`), la posición del logo y un `warning`. También
   escribe un **PNG de verificación** `tmp/<...>_final_check.png`.
4. **🔍 VERIFICA EL LOGO CON VISIÓN — PASO OBLIGATORIO (no lo saltes):**
   Abre y MIRA `tmp/<...>_final_check.png` con el visor de imágenes (Read). Confirma las
   4 cosas; solo si TODAS se cumplen puedes finalizar:
   - ☑ El logo está **completo**, sin recortarse por ningún borde.
   - ☑ Queda **centrado dentro del cuadro** reservado (esquina sup-izq), con margen parejo.
   - ☑ **NO toca ni tapa** el encabezado ni ningún texto/dibujo/ícono.
   - ☑ Tamaño **proporcionado** (~15% del ancho): ni diminuto en una esquina, ni gigante.

   Si el JSON trae `warning:true` (no halló recuadro claro o la esquina venía apretada),
   míralo con MÁS cuidado. **Si algo falla, NO finalices**: re-corre `componer_logo.mjs`
   con overrides y vuelve a verificar el nuevo `_check.png`. Repite hasta que quede bien.
   ```
   # tamaño/posición como fracción del ancho (<=1) o en px (>1):
   node scripts/capacitacion/componer_logo.mjs tmp/<...>.webp tmp/<...>_final.webp \
        --size=0.15 --x=0.03 --y=0.03
   ```
   No re-generes el texto (eso lo hizo Camilo a mano): aquí SOLO ajustas el logo.
5. **Sube y registra** (solo tras aprobar el paso 4):
   `node scripts/capacitacion/finalizar.mjs <productId> <idx> tmp/<...>_final.webp`
   → reemplaza la 'cruda' por la final y la deja **'generada'**.

Camilo la revisa y **Aprueba/Rechaza** en `/capacitacion`. Si la rechaza con motivo,
la próxima corrida lo tiene en cuenta (MODO A) para re-armar el prompt.

> ⚠️ **Nunca** corras `finalizar.mjs` sin haber mirado el `_check.png` en el paso 4. Ese
> vistazo es justo lo que evita que a Camilo le lleguen fotos con el logo descuadrado.

### Corregir el logo EN LOTE (fotos ya 'generada' con el logo mal)
Si ya hay muchas infografías 'generada' con el logo descuadrado (p.ej. hechas antes de
este arreglo), no las rehagas una por una: `reprocesar_logos.mjs` las corrige todas.
Para cada 'generada' busca su imagen RAW original en Storage (las que subió Camilo
siguen ahí, sin prefijo `final_`), la empareja por CONTENIDO (para no cambiar de imagen),
re-estampa el logo centrado y deja un `_check.png` por cada una.
```
cd "C:/Users/Sinfi/OneDrive/Infiniity Eventos/APP REGISTRO/app"
node scripts/capacitacion/reprocesar_logos.mjs            # DRY RUN: no escribe nada
# revisa scripts/capacitacion/tmp/reproceso/ (reporte.json + CHECK_*.png; mira los CHECK_*_WARNING.png)
node scripts/capacitacion/reprocesar_logos.mjs --commit   # aplica (sube y actualiza)
# node scripts/capacitacion/reprocesar_logos.mjs --commit --only=<productId>   # uno solo
```
Siempre corre primero el DRY RUN y **mira los `_check.png` con visión** (igual que el
paso 4) antes de `--commit`. Los `CHECK_*_WARNING.png` son los que no detectaron recuadro
claro: revísalos con más cuidado.

---

## Reanudar y límites
- **No hay estado a mano:** vuelve a correr la skill; `pendientes.mjs` recalcula.
- **Sin límite de créditos** (ya no hay IA): el tope natural es cuántos productos
  organizas por tanda. Trabaja en tandas cómodas.
- **Limpieza:** al terminar, puedes borrar `app/scripts/capacitacion/tmp/`.
