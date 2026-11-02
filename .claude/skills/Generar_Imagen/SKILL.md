---
name: Generar_Imagen
description: Experta en PROMPTS de imagen para Gemini (Nano Banana). NO genera la imagen — escribe el prompt perfecto para que el usuario lo pegue en Gemini, y cuando trae la imagen la deja lista para usar. Si lo que hace falta es un ÍCONO, SPRITE, STICKER, mascota, objeto suelto o cualquier PNG para recortar, el prompt pide un FONDO CROMA plano (verde/magenta/azul) y al volver la imagen se recorta con su script (o /Quitar_Fondo_Mejorar_Calidad) hasta dejar PNG transparentes pulidos, y WebP si van a una app. También escribe prompts de fotos de producto, banners, fondos, infografías y piezas con TEXTO (Nano Banana escribe bien), y de EDICIÓN de una foto existente. Úsala SIEMPRE que haya que crear una imagen para lo que sea — también por iniciativa propia, cuando un proyecto necesite íconos o imágenes — y cuando el usuario diga "/Generar_Imagen", "dame el prompt para…", "genérame una imagen de…", "necesito íconos/sprites/PNG de…", "una imagen para la app", "un banner/fondo/ilustración/foto de producto", "un prompt para Gemini/Nano Banana", o "ya la generé, procésala". NO confundir con /Mejorar_Calidad_Imagen (sube resolución a una imagen existente).
---

# Generar Imagen — prompts para Gemini (Nano Banana)

## La idea
El usuario genera las imágenes **él mismo en Gemini con Nano Banana** porque es lo que mejor le
resulta, incluso con texto. **Esta skill no genera nada**: lo suyo es escribir **prompts que salgan
bien al primer intento** y luego **procesar lo que el usuario trae** hasta dejarlo listo para usar.

```
qué hace falta → prompt(s) → el usuario genera en Gemini → trae la imagen → recorte/optimización → al proyecto
```

**Úsala por iniciativa propia.** Si estás construyendo algo y hace falta una imagen o un ícono, no
pongas un placeholder genérico ni un emoji en silencio: ofrece los prompts con esta skill.

---

## Paso 1 — Entender qué hace falta (solo lo que falte)
Pregunta en pirámide, de lo grande a lo fino, y **solo lo que no se pueda deducir** del mensaje o del
proyecto (lee el código, la paleta y las imágenes que ya existen antes de preguntar).

Decide primero **el tipo**, porque cambia el prompt y el proceso posterior:

| Tipo | Ejemplos | Fondo | Después |
|---|---|---|---|
| **A. Recortable** | ícono, sprite, sticker, mascota, producto suelto, objeto para un juego | **croma plano** | `recortar_croma.py` → PNG (+ WebP) |
| **B. Imagen completa** | foto de producto con escena, banner, fondo, portada, wallpaper | parte de la imagen | WebP/PNG al tamaño de uso |
| **C. Con texto** | infografía, póster, flyer, menú, tarjeta, logo con nombre | según diseño | revisar la ortografía, luego como B |
| **D. Edición** | "a esta foto cámbiale…", poner un producto real en una escena | la foto que sube el usuario | como B |

Si es para un **proyecto**, saca del código: paleta (tokens/hex), estilo de las imágenes que ya hay,
tamaño en el que se muestra y si va sobre fondo claro, oscuro o ambos.

## Paso 2 — Escribir el prompt
Reglas que valen para todos los tipos y que rinden en Nano Banana:

1. **Describe la escena en frases, no en una lista de palabras sueltas.** Nano Banana entiende
   lenguaje natural; "a glossy red apple resting on…" sale mejor que "apple, red, 4k, best quality".
2. **En inglés**, salvo el texto que se dibuja (va en el idioma que se vea, normalmente español).
3. **Orden fijo:** sujeto → estilo → composición/encuadre → luz → paleta (en **hex**) → fondo → formato → lo que debe evitar.
4. **Formato:** dilo en el prompt ("square 1:1", "wide 16:9", "vertical 9:16", "portrait 3:4").
5. **Texto en la imagen:** entre comillas, exacto y corto, y dice dónde va y con qué tipo de letra
   (`the headline "Cumpleaños de Sofía" in bold rounded sans-serif, centered at the top`). Todo lo
   que no está entre comillas son instrucciones y **no se dibuja** — dilo explícito en el prompt.
6. **Nada de logos inventados.** Si va un logo real, se pone después; deja el espacio libre.
7. **Lo que debe evitar va al final**, en una sola frase ("No watermark, no extra text, no border.").
8. **Coherencia en un set:** escribe un **bloque de estilo** y repítelo **idéntico** en cada prompt del
   set. Guárdalo en el proyecto (ver Paso 3) para que la próxima tanda use el mismo.

### Tipo A — Recortable (el caso más importante)
El objetivo es que el recorte salga perfecto. Reglas:

- **Elige el croma por el sujeto**, de un color que el sujeto **no tenga**:
  - **Verde `#00FF00`** por defecto.
  - **Magenta `#FF00FF`** si el sujeto tiene verdes (plantas, lechuga, perejil, limón, ropa verde).
  - **Azul `#0000FF`** si tiene verde y también rosados/morados.
- Pide el fondo así, tal cual: *"on a perfectly flat, solid pure green (#00FF00) background, uniform
  edge to edge, with no gradient, no texture, no vignette, no floor, no horizon"*.
- **Sin sombra, sin brillo, sin reflejo, sin contorno blanco:** *"no drop shadow, no cast shadow, no
  glow, no reflection, no white outline or sticker border around the subject"*. El contorno blanco de
  sticker y los brillos son lo que deja halos.
- **Sujeto centrado y completo**, con aire: *"fully visible and centered, with about 12% empty margin
  on every side, nothing cropped"*. La esquina inferior derecha debe quedar vacía porque ahí Gemini
  pone su marca ✦ (el script la borra si no toca al sujeto).
- **Bordes nítidos:** *"crisp clean edges, no motion blur, no depth of field"*.
- 🚫 **Nunca pidas "transparent background" ni "PNG".** Nano Banana no produce transparencia
  real: **dibuja un tablero de cuadros gris** como fondo y no hay manera de recortarlo.
- **Para un set de íconos con el mismo estilo**, hay dos caminos:
  - **Hoja** (recomendado hasta ~9 piezas): *"a sprite sheet of 6 separate icons arranged in a 3×2
    grid, generous equal spacing, none touching each other, same size and style"* + la lista de cada
    ícono en orden. Sale todo con el mismo estilo y el script los separa solo (`--separar`).
  - **Uno por prompt** con el bloque de estilo idéntico, si cada pieza necesita mucho detalle o más
    resolución.

Plantilla A:
```
<Sujeto descrito en una o dos frases, con sus colores y detalles>. <Estilo: p. ej. "3D clay-style
game icon, soft rounded shapes, subtle studio lighting"> . Palette: <#hex, #hex>. Fully visible and
centered, with about 12% empty margin on every side, nothing cropped. Crisp clean edges, no motion
blur, no depth of field. On a perfectly flat, solid pure green (#00FF00) background, uniform edge to
edge, with no gradient, no texture, no vignette, no floor. No drop shadow, no cast shadow, no glow,
no reflection, no white outline or sticker border. Square 1:1. No text, no watermark.
```

### Tipo B — Imagen completa
- Foto: tipo de cámara/encuadre ("overhead shot", "close-up at 45°", "shallow depth of field"),
  superficie y ambiente, luz ("soft window light from the left"), mood.
- Ilustración/fondo: técnica ("flat vector", "watercolor", "isometric 3D"), densidad, paleta.
- Si encima va **texto o UI** (banner de app, fondo de login), pide **espacio libre** donde irá:
  *"keep the left third calm and empty for overlaid text"*.
- Comida, si la app ya tiene un estilo de fotos: copia superficie, luz y vajilla del estilo existente
  para que no desentone.

### Tipo C — Con texto
- Escribe el texto **completo y revisado** (tildes, ñ, signos ¿¡). Pocas palabras por bloque.
- Jerarquía explícita: título, subtítulo, puntos, pie, y la tipografía de cada uno.
- Si hay pasos numerados, di cuántos son y que no repita ni se salte ninguno.
- Cierra con: *"Render only the quoted text, exactly as written, with correct Spanish spelling.
  Do not draw any of these instructions as text."*
- Para infografías de capacitación de Infiniity usa **/Capacitacion_Infografias**, que ya tiene su
  estilo aprobado y sus reglas.

### Tipo D — Edición
El usuario sube su foto a Gemini junto con el prompt. Di **qué cambia y qué se conserva**:
*"Using the attached photo, replace the background with … Keep the product exactly as it is: same
shape, label, colors and proportions. Match the lighting to the new scene."* Si después hay que
recortarla, pide además el fondo croma (reglas del tipo A).

## Paso 3 — Entregar los prompts
- **Cada prompt en su propio bloque de código** (para copiarlo con un clic), con encima una línea en
  español: qué es, tipo (A/B/C/D), formato y el **nombre de archivo** que tendrá en el proyecto.
- Si es un set o un proyecto, **guárdalos también** en `.prompts-imagenes/<tema>.md` dentro del
  proyecto: bloque de estilo, cada prompt, nombre de archivo final y estado (`pendiente` /
  `generada` / `lista`). Así se retoma otro día y el set sigue coherente.
- Cierra con una línea: *"Genéralas en Gemini, descárgalas y me avisas (o arrástralas al chat)."*
- Si sabes que Nano Banana suele fallar en algo de ese pedido (manos, texto largo, muchos elementos
  pequeños), dilo en una línea y ofrece una alternativa.

## Paso 4 — Cuando el usuario trae las imágenes
1. **Búscalas:** si no las adjuntó, mira lo más nuevo en `~/Descargas` (Gemini las nombra
   `Gemini_Generated_Image_*.png`): `ls -t ~/Descargas | head`. Confirma cuál es cuál con **Read**.
2. **Analízalas BIEN antes de procesar — sin pereza.** Mira cada imagen con Read, y en las hojas
   haz zoom a cada pieza (recorta con `magick` y léela). Revisa dos cosas:
   - **Lo técnico:** ¿corresponde al prompt?, ¿el texto está bien escrito?, ¿el fondo croma es plano?
   - **Que se vea bonita y ENCAJE:** ¿es apetitosa / atractiva?, ¿tiene el mismo estilo, luz, escala
     y paleta que el resto del set?, ¿combina con el diseño donde va (fondo, colores, tamaño en que
     se verá)?, ¿hay deformaciones que se noten a primera vista (manos, objetos fundidos, vasos
     torcidos, piezas pegadas)? Después de montarlas, **mira el resultado final en contexto** — una
     pieza puede verse bien sola y desentonar junto a las otras.

   **El punto medio:** son imágenes de IA, así que **no es perfeccionismo** — un detalle mínimo que
   nadie va a notar impreso o en pantalla se acepta. Pero **lo que se ve feo, raro o no encaja se
   regenera**, aunque dé trabajo: no lo dejes pasar por no pedir otra vuelta. Para lo que toque
   rehacer, **corrige el prompt** (di qué cambiaste y por qué) y pide regenerar **solo esas piezas**
   — no intentes arreglar con código lo que se arregla mejor regenerando. Dile al usuario, pieza por
   pieza, qué aprobaste y qué hay que repetir.
3. **Tipo A → recortar:**
   ```bash
   python3 ~/.claude/skills/Generar_Imagen/scripts/recortar_croma.py ENTRADA SALIDA.png --webp 512
   # hoja con varios íconos:
   python3 ~/.claude/skills/Generar_Imagen/scripts/recortar_croma.py HOJA.png carpeta/icono.png --separar --webp 256
   ```
   - Quita el croma en **toda** la imagen (también los huecos encerrados), suaviza el borde, borra el
     tinte verde/magenta del contorno, borra la marca ✦ de Gemini y recorta al sujeto.
   - **Mira siempre `SALIDA.chk.png` con Read** (el resultado sobre claro, oscuro y violeta). No
     entregues sin mirarlo. `resto=` debería ser ~0%.
   - Si quedan restos de fondo → sube `--t1`; si se come el borde del sujeto → baja `--t0`. Si el
     sujeto tiene partes del color del croma → `--solo-borde` (o regenera con otro croma).
   - Avisos `fondo no plano` o `no es croma` → el fondo vino con degradado o es blanco: regenera, o
     pásalo por **/Quitar_Fondo_Mejorar_Calidad**, que tiene métodos para fondos claros y casos difíciles.
   - Si la pieza va a verse **grande** y quedó chica, súbele resolución con **/Mejorar_Calidad_Imagen**
     **antes** de recortar.
4. **Tipo B/C/D → optimizar para su uso:**
   - **App/web:** WebP al tamaño real × 2 (retina), q ≈ 82–88. Ej.: banner que se ve a 600 px → 1200 px.
     `python3 -c "from PIL import Image as I;i=I.open('IN');i.thumbnail((1200,1200),I.LANCZOS);i.save('OUT.webp',quality=85,method=6)"`
   - **Otro uso (imprimir, editar, redes):** PNG tal cual; si hace falta más grande, /Mejorar_Calidad_Imagen.
5. **Ubícalas en el proyecto** con el nombre acordado (p. ej. `public/img/…`) y cambia en el código
   los placeholders por la imagen. Si hay dev server, compruébalo en la vista previa.
6. Marca el estado `lista` en `.prompts-imagenes/<tema>.md` y **guarda en "Aprendido" lo que
   falló** para no repetirlo.

## Aprendido (reglas vivas)
Añade aquí, en una línea, cada cosa que Nano Banana hizo mal y cómo se evitó en el prompt.
- Pedir "transparent background" da un tablero de cuadros dibujado → siempre fondo croma plano.
- El contorno blanco tipo sticker y los brillos dejan halos al recortar → pedirlos fuera explícitamente.
- Gemini pone una marca ✦ abajo a la derecha → dejar esa esquina libre; el script la borra.
- Un **nombre que no es una palabra real** (p. ej. «Switfly») lo autocorrige solo → deletrearlo en el
  prompt: «spelled S-W-I-T-F-L-Y: the letter T comes before the letter F» + «do not write "Swiftly"».
  Probado y funcionó al primer intento en dos piezas distintas.
- El **bloque de estilo compartido NO garantiza el mismo dibujo**: el mismo sujeto descrito igual en
  dos prompts dio dos criaturas distintas. Para un set que comparte un símbolo, generar el símbolo
  primero y **adjuntarlo como referencia** (tipo D) en las demás piezas, o montarlas localmente.
- Para un **logo** sale mejor generar UNA pieza buena y despiezarla en local (recorte + `realesrgan`
  x4 + montaje con PIL) que pedirle a Gemini cada montaje: así el símbolo y la tipografía son
  idénticos en todas las versiones, sin volver a jugársela con el texto.
- `--separar` NO siempre numera las piezas de izquierda a derecha (en una fila de 3 puso primero la botella del centro) → identificar cada `p_NN` mirándola antes de nombrarla, y revisar el montaje final.
- Logo/pieza con **texto** recortada con `recortar_croma.py`: los puntos de la «i» y las tildes son piezas sueltas y el filtro de motas las borra («pızza») → usar `--motas 0.00002` y revisar el texto con zoom. Y el modelo `realesrgan-x4plus-anime` solo funciona a `-s 4` (con `-s 2` deforma la imagen): escalar ×4 y bajar con LANCZOS.

## Anterior
La versión que generaba con Pollinations + Flux quedó guardada en `_anterior_pollinations/` (ya no
se usa: calidad inferior a Nano Banana).

