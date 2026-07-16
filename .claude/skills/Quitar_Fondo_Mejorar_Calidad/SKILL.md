---
name: Quitar_Fondo_Mejorar_Calidad
description: Convierte una imagen en un STICKER/PNG profesional haciendo DOS cosas a la vez en la PC del usuario (sin Canva, sin subir nada a internet, gratis) — (1) MEJORA LA CALIDAD con IA (upscale Real-ESRGAN, modelo caricatura/anime) y (2) QUITA EL FONDO dejándolo transparente y solo el sujeto central. Úsala cuando el usuario diga "/Quitar_Fondo_Mejorar_Calidad", "hazme un sticker de esta imagen", "quítale el fondo y mejórala", "déjala como PNG transparente", "conviértela en sticker", "fondo transparente y mejor calidad", "como sticker para WhatsApp", o pase una imagen (logo, mascota, dibujo, ilustración con fondo de un color) y pida sticker/PNG. Funciona MEJOR con fondo plano de un color y sujeto con contorno (estilo sticker). Para fotos reales con fondo complejo, avisar que el recorte simple no aplica.
---

# Quitar Fondo + Mejorar Calidad (sticker PNG)

## Propósito
Tomar una imagen (típicamente logo, mascota, dibujo o ilustración generada por IA con fondo de un color) y devolver un **PNG con fondo transparente, nítido y en alta resolución** — listo como sticker para WhatsApp, logo, etc. **Todo local en la PC del usuario, gratis, sin Canva y sin subir la imagen a ningún servidor.**

Esto replica los botones "Mejorar calidad con IA" + "Quitar fondo" de Canva, pero local y por lotes.

## El proceso son DOS pasos (en este orden)
1. **Mejorar calidad** con Real-ESRGAN (upscale con IA) → bordes nítidos.
2. **Quitar fondo** con el script `remove_bg.py` → vacía el fondo plano y deja solo el sujeto central.

Se hace upscale PRIMERO y recorte DESPUÉS: así el quitado de fondo trabaja sobre bordes ya nítidos y la máscara queda suave.

## Herramientas que usa (y de dónde salen)
- **Real-ESRGAN (ncnn-vulkan, portable)** — IA open-source de GitHub (`xinntao/Real-ESRGAN`) que agranda reconstruyendo detalle. Versión `.exe` portable que usa la GPU (Vulkan) y **NO necesita Python** → evita problemas de versiones de Python.
  - Ubicación estable: `C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe`
  - Modelo para dibujo/caricatura/sticker: `realesrgan-x4plus-anime`
- **Script `remove_bg.py`** (incluido en esta skill, en `scripts/`) — usa Pillow (PIL). Hace flood-fill del fondo desde los bordes y se queda con el sujeto central. **No usa `rembg`** porque `rembg` no es compatible con Python 3.14 del usuario.

## Pasos a ejecutar

### 0. Mirar la imagen primero
Lee la imagen con la tool Read para verla. Confirma que es caso válido: **fondo de un color** (plano) y sujeto idealmente con contorno tipo sticker. Si es una **foto real con fondo complejo** (persona, escena), avisar que este recorte simple no sirve y que haría falta `rembg` (incompatible con Python 3.14; requeriría instalar Python 3.13). Aun así el paso de mejorar calidad sí aplica.

### 1. Asegurar que Real-ESRGAN está instalado
```powershell
$exe="C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe"
if(-not (Test-Path $exe)){
  $url="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip"
  $zip="$env:TEMP\realesrgan.zip"
  Invoke-WebRequest -Uri $url -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath "C:\Users\Sinfi\.claude\tools\realesrgan" -Force
}
Test-Path $exe
```

### 2. Mejorar calidad (upscale 4x con modelo anime/caricatura)
```powershell
& "C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe" `
  -i "RUTA_ENTRADA" -o "$env:TEMP\_upscaled.png" `
  -n realesrgan-x4plus-anime -s 4
```
- Para **fotos** (no dibujos), usar `-n realesrgan-x4plus` en vez del modelo anime.
- El modelo anime conserva canal alfa, así que sirve igual si la entrada ya es PNG transparente.

### 3. Quitar fondo y dejar solo el sujeto
```powershell
python "C:\Users\Sinfi\.claude\skills\Quitar_Fondo_Mejorar_Calidad\scripts\remove_bg.py" `
  "$env:TEMP\_upscaled.png" "RUTA_SALIDA.png"
```
- Si el logo tiene **varios bloques separados** (escena + texto en líneas aparte), añade `--no-keep-center` (si no, se queda solo con la mancha central y se come el texto/los elementos sueltos).
- El script (v2) ya NO recorta solo por color: borra el fondo con criterio **"claro Y neutro"** (`--light-min`, `--neutral-chroma`), por lo que **caza los trazos tenues del fondo (líneas de cielo, nubes, bocetos gris-claro)** que un recorte por color exacto dejaba como FANTASMAS visibles solo sobre oscuro. Además trae *feather* (borde suave, no dentado), *erode* (mata el halo claro) y *despeckle* (borra restos sueltos). Flags útiles: `--light-min 200` (súbelo si se come zonas claras del sujeto; bájalo si quedan trazos), `--despeckle 0.0008` (súbelo para borrar fragmentos más grandes), `--feather`/`--erode`.

### 4. Verificar SIEMPRE (bucle obligatorio — no entregues a ciegas)

El recorte por color **falla seguido** (bordes duros, halos, óvalos, sujeto comido). **NUNCA entregues el primer intento sin mirarlo.** El usuario es exigente: una entrega con borde feo es un fallo de la skill.

Como una imagen transparente NO se ve bien en un visor (el visor la pone sobre blanco y engaña), **compón el resultado sobre DOS fondos contrastantes** (claro y oscuro) y míralos con Read:

```powershell
python -c @"
from PIL import Image
logo=Image.open(r'RUTA_SALIDA.png').convert('RGBA')
for n,bg in [('white',(245,245,245)),('dark',(20,17,26))]:
    c=Image.new('RGBA',logo.size,bg+(255,)); c.alpha_composite(logo)
    c.convert('RGB').save(r'$env:TEMP'+'\\_chk_'+n+'.png')
"@
```

Lee `_chk_white.png` y `_chk_dark.png` y **juzga con criterio**. Defectos a cazar:
- **Borde duro / dentado** (línea recta o escalonada en el contorno) → falta *feather* (difuminar la máscara) → usa método alternativo (abajo).
- **Halo del color de fondo** (aro oscuro/de color alrededor) → sube `--threshold`.
- **Sujeto comido** (se perdió parte) → baja `--threshold`.
- **Óvalo / recorte deforme** → un destello/elemento suelto en una esquina agrandó el bounding box → usa el método de **círculo robusto** (abajo) o `--no-keep-center` mal aplicado.
- **Quedó un rectángulo** o fondo sin quitar → threshold mal o fondo no plano.
- **Trazos / nubes / líneas fantasma del fondo** (curvas o bocetos gris-claro que NO se ven sobre blanco/crema pero aparecen SOBRE OSCURO) → el fondo tenía dibujo tenue que el recorte por color dejó pasar. Con el script v2 baja `--light-min` (ej. 190, 180) para que esos grises claros cuenten como fondo, y/o sube `--despeckle` para borrar los fragmentos. **Este defecto es la razón por la que verificar sobre fondo OSCURO es obligatorio**: sobre claro es invisible.

**Itera** (cambia threshold o cambia de método) y vuelve a componer y mirar. **Solo entrega cuando esté limpio en AMBOS fondos.** Si tras 2-3 intentos con flood-fill no queda bien, **cambia de método** (sección "Métodos alternativos"). No te quedes martillando el mismo threshold.

Cuando esté bien:
- Abre con `Start-Process "RUTA_SALIDA.png"`.
- Entrega con la tool SendUserFile.
- Si descubriste algo nuevo en este recorte, **anótalo en la Bitácora** (al final del archivo).

## Ajuste de calidad del recorte (importante)
El parámetro `--threshold` controla qué tan agresivo es el quitado de fondo:
- **Queda un borde/halo del color de fondo** → SUBE el threshold (ej. 180, 200).
- **Se come parte del sujeto** → BÁJALO (ej. 120, 110).
- Valor por defecto 155 funcionó bien para el sticker de prueba (fondo rojo + borde blanco).
- Si hay elementos sueltos en las esquinas (doodles, marcas) se eliminan solos al quedarse con el sujeto central. Si el sujeto NO es central o son varios, usar `--no-keep-center`.

Itera: corre → mira el resultado con Read → ajusta threshold → repite hasta que se vea limpio. El usuario es exigente con la calidad; no entregues a la primera sin revisar.

## Métodos alternativos (cuando el flood-fill falla)

El `remove_bg.py` (flood-fill por color desde los bordes) es bueno para **fondo plano + sujeto con contorno duro**. Pero produce **bordes binarios (duros/dentados)** y se rompe con **glow/neón** o con **destellos sueltos**. Para esos casos usa uno de estos dos, según el sujeto:

### A) Emblema / logo CIRCULAR (medallón, sello, moneda) → máscara de círculo robusta
El sujeto es un disco. Detecta su **centro y radio reales de forma robusta** (ignorando destellos en esquinas que deforman el bounding box) y aplica un **círculo con borde difuminado** (feather). Da un recorte circular perfecto y suave:

```python
import math
from PIL import Image, ImageDraw, ImageFilter, ImageChops
up=Image.open(UPSCALED).convert('RGBA'); W,H=up.size
r,g,b=up.convert('RGB').split()
mx=ImageChops.lighter(ImageChops.lighter(r,g),b)          # canal mas brillante
sw=400; sh=int(400*H/W); sm=mx.resize((sw,sh)); px=sm.load()
xs=[];ys=[]
for y in range(sh):
    for x in range(sw):
        if px[x,y]>120: xs.append(x);ys.append(y)         # pixeles brillantes (el emblema)
cx=sum(xs)/len(xs); cy=sum(ys)/len(ys)
d=sorted(math.hypot(x-cx,y-cy) for x,y in zip(xs,ys))
rad=d[int(len(d)*0.97)]                                   # radio robusto: 97pct ignora destellos lejanos
fx=W/sw; fy=H/sh
CX=cx*fx; CY=cy*fy; R=rad*((fx+fy)/2)*1.06                # +6% para incluir el borde
mask=Image.new('L',(W,H),0)
ImageDraw.Draw(mask).ellipse((CX-R,CY-R,CX+R,CY+R),fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(max(3,int(R*0.02))))  # FEATHER = borde suave
out=up.copy(); out.putalpha(mask); out=out.crop(mask.getbbox())
out.save(SALIDA)
```
Clave: el **percentil 97 del radio** descarta un destello en la esquina (lo que antes hacía un óvalo), y el **GaussianBlur** de la máscara elimina el borde dentado.

### B) Logo de NEÓN / líneas brillantes sobre fondo OSCURO → alfa por luminancia
Cuando el sujeto son trazos luminosos sobre negro (y NO un disco sólido), convierte el **brillo en transparencia**: el negro pasa a transparente y el neón conserva su glow con transparencia parcial. Funciona sobre cualquier fondo:

```python
from PIL import Image, ImageChops
src=Image.open(UPSCALED).convert('RGB')
r,g,b=src.split()
m=ImageChops.lighter(ImageChops.lighter(r,g),b)           # brillo
alpha=m.point(lambda x:0 if x<18 else min(255,int((x-18)*1.5)))  # negro->0, neon->opaco (ajusta el 18)
out=src.copy(); out.putalpha(alpha)
bb=alpha.getbbox(); out=out.crop(bb) if bb else out
out.save(SALIDA)
```
Sube el punto negro (18 → 40, 60…) si queda halo del fondo; bájalo si se pierde glow. **OJO:** este método disuelve rellenos sólidos oscuros — NO lo uses si el logo es un disco/medallón sólido (usa el método A).

### C) HUECOS INTERIORES blancos (agujeros de letras O/R/P/a/e, rejillas, molinos) → punzonar con limpieza de aro
Logos con **texto** o **rejillas** dejan blancos ENCERRADOS (los contadores de las letras, los espacios de un molino). El flood-fill NO los toca (no están conectados al borde) → quedan blancos opacos y sobre fondo oscuro/de color se ven como manchas. Hay que **punzonarlos a transparente**, pero el error chambón es quitar solo el blanco puro y dejar el **aro anti-aliasing** (el borde pálido entre el blanco y la tinta) → sobre negro se ve un **contorno blanco feo** alrededor de cada hueco.

Clave para un borde limpio: la **tinta del logo (roja/naranja/colores saturados) tiene `min(r,g,b)` BAJO**; el **blanco y su aro pálido tienen `min(r,g,b)` ALTO**. Así, **crece la región** desde el blanco hacia afuera comiéndote el aro hasta chocar con la tinta (donde `min` cae), y paras. Limita SIEMPRE a la zona de los huecos (banda del texto, caja del molino) para NO perforar ojos/dientes/brillos del sujeto:

```python
from PIL import Image, ImageFilter
from collections import deque
im=Image.open(SRC).convert('RGBA'); W,H=im.size; px=im.load()
MAXD=8                                            # cuánto aro come (px); rims suelen ser 2-6px
core=lambda r,g,b: min(r,g,b)>=232 and max(r,g,b)-min(r,g,b)<=16   # semilla = blanco puro
rim =lambda r,g,b: min(r,g,b)>=130                # pálido/baja-sat = aro/blanco, NO tinta
target=lambda fx,fy: fy>=0.62 or (fx<=0.20 and fy<=0.28)          # AJUSTA a TU logo
rm=bytearray(W*H); fr=deque()
for y in range(H):
    for x in range(W):
        r,g,b,a=px[x,y]
        if a>=200 and target(x/W,y/H) and core(r,g,b): rm[y*W+x]=1; fr.append((x,y,0))
while fr:                                          # BFS con tope de distancia = come solo el aro
    x,y,d=fr.popleft()
    if d>=MAXD: continue
    for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
        if 0<=nx<W and 0<=ny<H and not rm[ny*W+nx]:
            r,g,b,a=px[nx,ny]
            if a>=200 and rim(r,g,b) and target(nx/W,ny/H): rm[ny*W+nx]=1; fr.append((nx,ny,d+1))
for y in range(H):
    for x in range(W):
        if rm[y*W+x]: r,g,b,a=px[x,y]; px[x,y]=(r,g,b,0)
a=im.getchannel('A').filter(ImageFilter.GaussianBlur(1.0)); im.putalpha(a)   # borde suave
bb=im.getbbox(); (im.crop(bb) if bb else im).save(SALIDA)
```
Ajustes: sube `MAXD` si queda aro; baja `rim`-min (130→120) para comer aros de letras NARANJA (su aro tiene min más bajo), pero ojo con piel/tonos cálidos (min~140) — el tope `MAXD` y el `target` los protegen. **Conserva** los blancos que SÍ son del sujeto (ojos, dientes, brillos, cielo crema de una escena) dejándolos FUERA del `target`.

> Regla de decisión rápida: ¿el sujeto es un **disco/sello sólido**? → A. ¿Son **líneas/neón sobre oscuro**? → B. ¿Hay **huecos blancos encerrados** (texto, rejilla) que se ven sobre oscuro? → C (punzonar con limpieza de aro). ¿Es un **ícono de app squircle** (rect. redondeado con cristal/degradado, borde glossy parecido al fondo)? → **D: medir bbox + máscara `rounded_rectangle`** (ver Bitácora 2026-06-30) — NO flood-fill por color. ¿**Fondo plano de un color con sujeto de contorno duro** (sticker típico)? → `remove_bg.py`. Siempre cierra con el **bucle de verificación** (Paso 4) — y para huecos, **verifica SOBRE NEGRO con zoom**: el aro chambón solo se ve ahí.

## Salida
- Por defecto guarda el PNG donde el usuario pida; si no especifica, usa la misma carpeta de la entrada con sufijo `_sticker.png`.
- Recordar al usuario que todo fue local y gratis, y ofrecer procesar una carpeta entera por lotes (loop sobre los pasos 2-3 para cada imagen).

## Procesar una carpeta entera (lote)
Si el usuario lo pide, itera sobre cada imagen de una carpeta repitiendo pasos 2 y 3, guardando cada `<nombre>_sticker.png`.

---

## Bitácora de aprendizajes (AUTO-RETROALIMENTACIÓN — manténla viva)

Esta skill debe **mejorar con el uso**. Cada vez que en un recorte real descubras algo que la skill no contemplaba —un tipo de imagen donde el flood-fill falla, un truco de máscara que sí funcionó, un valor de threshold/punto-negro que sirvió, un caso límite— **edita este archivo y déjalo registrado en el momento**, sin esperar a que el usuario lo pida:
- Si es un **caso donde falla el flood-fill** → asegúrate de que esté cubierto en "Métodos alternativos".
- Si es un **truco nuevo** → añádelo como método.
- **Siempre** que entregues, recuerda el **bucle de verificación del Paso 4** (componer sobre claro y oscuro). El fallo más común es entregar sin mirar.

### Registro

- **2026-06-22 · Logo "Mischief" (medallón circular dorado/neón sobre vino oscuro).** El flujo por defecto (upscale + `remove_bg.py` flood-fill) entregó un resultado **malo**: borde superior **duro/recto** y, en otro intento, un **óvalo** porque un **destello suelto en la esquina** agrandó el bounding box. El usuario reclamó (con razón) que la skill debe verificar e iterar.
  - **Lección 1:** para emblemas circulares, el flood-fill deja bordes duros. Solución que SÍ funcionó: **máscara de círculo robusta** (centroide + **percentil 97 del radio** para ignorar destellos) + **GaussianBlur** de la máscara para borde suave. (Método A, arriba.) Resultado limpio a la primera con ese método.
  - **Lección 2:** un visor normal pone la transparencia sobre blanco y **engaña**; hay que **componer sobre claro Y oscuro** y mirar ambos con Read antes de entregar. (Ahora es el Paso 4 obligatorio.)
  - **Lección 3:** para neón de líneas sobre negro (no disco), el **alfa por luminancia** (Método B) conserva el glow mejor que el flood-fill — pero disuelve rellenos sólidos, así que no sirve para medallones sólidos.
- **2026-06-29 · Logo "Perros Criiollos" (escena de granja ilustrada + texto, sobre fondo blanco).** El flood-fill por color (`--threshold 155`, `--no-keep-center`) entregó un recorte que SOBRE CREMA se veía perfecto, pero el fondo blanco traía **trazos de cielo/nubes dibujados en gris-claro (~228–240)**. El recorte por color borró el blanco puro pero dejó esos trazos como **líneas FANTASMA** flotando — invisibles sobre claro, **horribles sobre oscuro**. El usuario reclamó con razón.
  - **Lección 1 (la grande):** el recorte por **distancia al color de esquina falla** cuando el fondo no es plano de verdad sino que tiene dibujo tenue (bocetos, nubes, líneas de cielo). Reescribí `remove_bg.py` a **v2**: el fondo ahora se detecta también por **"claro Y neutro"** (`is_bg` = parecido-al-color-de-fondo **O** `min(r,g,b) >= light-min` con cromaticidad baja). Eso borra el blanco **y** los grises-claros del boceto, mientras la **conectividad desde el borde protege lo claro pero ENCERRADO** (sombrero tostado, cinta crema, cuello blanco, el propio cielo crema de la escena). Resultado limpio en ambos fondos.
  - **Lección 2:** v2 además trae **feather** (borde suave, adiós dentado), **erode 1px** (mata el halo claro del contorno) y **despeckle** (borra fragmentos sueltos = restos de trazos). Esto ataca de raíz los tres defectos clásicos del flood-fill viejo.
  - **Lección 3:** una ilustración con **cielo/fondo propio** (escena de paisaje) NO se debe vaciar entero: su cielo es lo que mantiene unidos los elementos (molino, granero, maíz). v2 lo **conserva** porque va encerrado por el contorno de la escena → queda como emblema coherente, no elementos flotando sueltos.
  - **Lección 4 (refuerzo):** este caso es la prueba de que **verificar sobre OSCURO es OBLIGATORIO**. Sobre crema/blanco el recorte malo pasaba como bueno. Nunca entregues juzgando solo el fondo claro.
- **2026-06-29 (cont.) · Mismo logo "Perros Criiollos": huecos de letras y molino + ARO chambón.** Tras dejar limpio el fondo, quedaban blancos ENCERRADOS (los contadores de O/R/P/a/e y los espacios del molino) que sobre el naranja de la app y sobre negro se veían como manchas blancas. Primer intento de punzonado: quité solo el blanco puro → quedó un **aro/contorno blanco anti-aliasing alrededor de cada hueco**, que sobre NEGRO se veía como garabatos blancos. El usuario (con razón) lo llamó "chambón".
  - **Lección 1:** punzonar huecos = quitar el blanco **Y su aro pálido**. El truco que funcionó: **crecer la región** desde el blanco hacia afuera usando que la **tinta saturada tiene `min(r,g,b)` bajo** y el **aro pálido lo tiene alto**; comes el aro hasta chocar con la tinta y paras. Con tope de distancia (`MAXD`) y limitado a la zona de los huecos. (Ahora es el Método C.)
  - **Lección 2:** limitar a un `target` (banda de texto, caja del molino) es OBLIGATORIO para NO perforar ojos/dientes/brillos del sujeto ni el cielo crema de la escena. Esos blancos SÍ son del logo.
  - **Lección 3 (refuerzo):** el aro chambón **solo se ve sobre NEGRO con zoom**. Verificar sobre claro/crema lo ocultaba. Para huecos: componer sobre negro y hacer zoom a las letras antes de entregar.
- **2026-06-30 · Ícono de app "Dahia" (squircle rosado glassmorphism sobre fondo rosa pálido plano).** El usuario quería quitar el borde exterior para dejar el ícono con esquinas transparentes + subir resolución. Upscale 4x → 4096px (OJO: `remove_bg.py` es flood-fill en **Python puro** y a 4096² (16M px) es impráctico/eterno → usé el flood-fill en **C de Pillow** `ImageDraw.floodfill`, instantáneo). Primer intento (flood-fill por color, thresh 30) dio **borde dentado/brochado**: el squircle es un degradado **claro/glossy arriba** (255,186,209) demasiado parecido al fondo (255,220,232) → comió el borde irregularmente.
  - **Lección 1 (método D nuevo):** para **íconos de app squircle** (rect. redondeado con cristal/degradado sobre fondo plano), NO recortar por color. En vez de eso: **medir el bbox del squircle** (escanear fila y columna centrales con umbral bajo ~26 desde cada lado) y aplicar **máscara de rectángulo redondeado** (`ImageDraw.rounded_rectangle`, radio ≈ 0.22·lado, estilo iOS) + `GaussianBlur(2.5)`. Esquinas perfectas, cero dentado, a la primera.
  - **Lección 2:** la sombra/glow agranda el bbox abajo-derecha (márgenes asimétricos: top/left limpios, bottom/right con sombra). Un `inset` (~10px) recorta la sombra; radio de máscara un pelín mayor que el del squircle real evita fugas de fondo en las esquinas.
  - **Lección 3 (entorno):** el `python` del usuario es **alias de Microsoft Store intermitente** (a veces "Python was not found", exit 9009/49). El intérprete real (registro `HKCU:\SOFTWARE\Python\PythonCore`) está en `C:\Users\Sinfi\AppData\Local\Python\pythoncore-3.14-64\python.exe`; **llamarlo por ruta completa** evita el fallo.
- **2026-07-04 · Ícono de app "Nia" (squircle blanco glassmorphism sobre fondo lila pálido con DEGRADADO).** Mismo caso que Dahia (Método D), pero aquí medir el bbox por "distancia al color de esquina" FALLÓ: el fondo no era plano sino un **degradado** (esquina TL 240 → BR 224), así que un solo umbral no cerraba los 4 lados (el lado opuesto ya difería más que el umbral) y el escaneo de columnas centrales se comía el logo. Además la tarjeta glass es **casi idéntica al fondo** (card min~241 vs bg~234, apenas 7 de diferencia) → invisible por color al ojo del script.
  - **Lección 1 (el truco que sirvió):** para hallar el squircle cuando el fondo tiene degradado o la tarjeta casi no contrasta, **quita el degradado con un high-pass**: `hp = gris - GaussianBlur(gris, 120)` (con offset 128). Eso aplana el fondo a ~128 y hace **resaltar el borde/glow de la tarjeta**. Guardé el high-pass y lo LEÍ con Read para confirmar el contorno visualmente; luego medí el bbox sobre el high-pass por **desviación de 128** (no por color). Detección limpia de los 4 lados.
  - **Lección 2:** medir con **run sostenido** (≥6 px consecutivos desviados) para top/bottom evita falsos positivos del logo; sacar **mediana** de muchas líneas de escaneo da un borde robusto. El squircle resultó cuadrado y centrado (center x≈W/2) → forcé **cuadrado centrado** promediando lados, y quedó perfecto.
  - **Lección 3 (refuerzo):** máscara `rounded_rectangle` radio ≈ **0.225·lado** + `GaussianBlur(3)` + `inset` pequeño (~4px) = esquinas iOS suaves, sin halo lila ni borde dentado, limpio en claro Y oscuro a la primera.
- **2026-07-16 · Logo "JUANCE" (emblema de llama + texto sobre MADERA oscura texturizada con halo lila).** Caso de Método B (alfa por luminancia), pero el punto negro típico (18–60) **fallaba**: la madera tiene vetas (26–40) y un **halo lila de ~75** que sobrevivían y formaban una **nube gris con BORDE RECTANGULAR** (el corte del crop) — invisible sobre oscuro, evidente sobre claro. Subir el punto negro a **120 con ganancia 3.5** lo limpió sin perforar la llama ni disolver la cadena/espiga.
  - **Lección 1 (medir, no adivinar):** antes de elegir el punto negro, **mide el fondo y el halo** (muestrea esquinas, bordes y la zona de glow) y saca el **histograma de `max(r,g,b)`**. Aquí el 88% de los píxeles estaba bajo 120 → el emblema era el 12% restante. El punto negro sale de ese número, no del valor por defecto de la bitácora.
  - **Lección 2 (el límite honesto del Método B):** el alfa por luminancia vuelve transparentes **los contornos oscuros del PROPIO logo**, no solo el fondo. Sobre oscuro es invisible (negro sobre negro); **sobre claro el logo se ve lavado** y el texto fino casi desaparece. Por eso **este método solo es válido si el logo va a vivir sobre fondo oscuro** — verifícalo en el CÓDIGO (dónde se pinta el logo) antes de entregarlo, no solo al ojo.
  - **Lección 3 (recorta ANTES de subir de escala):** un **destello suelto** en una esquina inflaba el bbox. Detectarlo con un **perfil de columnas/filas de píxeles brillantes** (`spans`) y recortar el emblema ANTES del upscale mata el destello, ahorra tiempo de IA y evita el óvalo.
  - **Lección 4 (PESO — WebP con alfa):** WebP guarda el **canal alfa SIN pérdida por defecto** → un emblema detallado se iba a **250 KB** aunque bajara `quality`. La palanca real es **`alpha_quality`** (Pillow: `save(..., 'WEBP', quality=74, alpha_quality=30)`). Aplanar a negro el RGB bajo alfa=0 ayuda poco; **el alfa es el que pesa**. Calibra por **peso/píxel**, no por peso absoluto: un logo ANCHO (Pilotos 788×303 = 239k px → 70 KB) y uno CUADRADO (JUANCE 720×807 = 581k px → 139 KB) son igual de eficientes. Dimensiona con el **CSS real** (`max-width` del hero × 2 para 2× DPR), no "a lo grande".
  - **Lección 5 (el ícono cuadrado NO es el logo entero):** para el cuadrito de 58 px, meter el emblema completo deja el texto en **papilla ilegible**. Recorta solo la **marca central** (el símbolo), sin texto y **sin cortar palabras a medias** (un recorte intermedio dejaba "…or que te enca…" y se veía roto). Verifícalo **componiendo a 58 px reales**, no ampliado.

