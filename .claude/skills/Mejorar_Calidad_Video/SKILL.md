---
name: Mejorar_Calidad_Video
description: Mejora la CALIDAD y RESOLUCIÓN de CUALQUIER video usando IA (upscale Real-ESRGAN frame por frame) en la PC del usuario — sin subir nada a internet, gratis. Separa el video en frames, mejora cada uno con IA reconstruyendo detalle, y los vuelve a unir CONSERVANDO el audio y los FPS originales. Úsala cuando el usuario diga "/Mejorar_Calidad_Video", "mejora la calidad de este video", "súbele la resolución al video", "el video está borroso/pixelado, arréglalo", "hazlo más nítido", "pásalo a HD/2K/4K", "mejorar video con IA", "upscale de video", o pase un video pidiendo más calidad/resolución. Sirve para VIDEO real (personas, productos) y para ANIMACIÓN/dibujos (elige el modelo de IA según el tipo). Es GENÉRICA: cualquier video, cualquier proyecto. OJO: es un proceso PESADO (minutos/horas y varios GB temporales según la duración) — avisa siempre antes de arrancar.
---

# Mejorar Calidad de Video (upscale con IA, frame por frame)

## Propósito
Tomar **cualquier video** y devolverlo con **más resolución y mejor nitidez**, reconstruyendo detalle con IA en cada cuadro (en lugar de estirarlo, que lo dejaría borroso). **Todo local en la PC del usuario, gratis, sin subir el video a ningún servidor.**

Un video = **muchos frames (imágenes) + una pista de audio**. Por eso el proceso es:
```
Video → [1] extraer frames → [2] upscale de cada frame con Real-ESRGAN (IA)
      → [3] re-unir frames + pegar audio original → Video HD
```

> Esta skill es la hermana en video de **/Mejorar_Calidad_Imagen** (usa el MISMO Real-ESRGAN).

## ⚠️ Antes de arrancar: AVISA al usuario (esto es pesado)
A diferencia de la imagen, el video es costoso. **Siempre** informa y confirma:
- **Tiempo**: se procesa 1 frame por cada cuadro. Un video de 30s a 30fps = ~900 imágenes a mejorar. Puede tardar de **varios minutos a horas** según duración, FPS, resolución, escala y la GPU.
  - Dato real medido en esta PC: `realesrgan-x4plus -s 2` a 1024→2048 rinde **~2,5 seg/frame** (169 frames ≈ 10 min). Úsalo para estimar y avisar.
- **Disco**: los frames sueltos (PNG) pueden pesar **varios GB temporales** (se borran al final).
- **Sugerencias para bajar el costo** (ofrécelas):
  - Usar `-s 2` en vez de `-s 4` (mitad de trabajo, casi el mismo salto visible en pantallas normales).
  - Recortar a un clip corto si solo quiere una muestra.
  - Para animación, el modelo `realesr-animevideov3` con `-s 2` es rápido y excelente.

## Herramientas que usa (y de dónde salen)
1. **Real-ESRGAN (ncnn-vulkan, portable)** — la misma IA de la skill de imagen (GPU/Vulkan, sin Python).
   - `C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe`
2. **ffmpeg (portable)** — para extraer/re-unir frames y manejar el audio. Sin instalar nada al sistema.
   - `C:\Users\Sinfi\.claude\tools\ffmpeg\ffmpeg.exe` y `ffprobe.exe`

## Elegir el modelo según el tipo de video (clave)
Mira 1 frame primero (extrae uno y léelo con Read) y decide:
- **Video real / persona / producto / paisaje** → `realesrgan-x4plus`  → usar **`-s 4`** (su escala nativa)
- **Animación / anime / dibujo / motion graphics** → `realesr-animevideov3` (recomendado para video) → **`-s 2`, `-s 3` o `-s 4`** (tiene modelo nativo para cada una)
- Si hay ruido/compresión fuerte → `realesr-animevideov3` limpia muy bien.

## 🛑 REGLA DE ORO DE LA ESCALA (evita el video "en mosaico")
**Usa SIEMPRE la escala NATIVA del modelo.** Pedir una escala distinta a la nativa rompe el resultado en GPUs con poca VRAM: cada frame sale como una **rejilla de tiles descuadrados** (mosaico) y el video queda inservible. Comprobado en esta PC.
- `realesrgan-x4plus` y `realesrgan-x4plus-anime` son modelos **4x** → **SOLO `-s 4`**. **NUNCA `-s 2` ni `-s 3`** con estos (es exactamente lo que produce el mosaico).
- `realesr-animevideov3` tiene modelos nativos `-x2/-x3/-x4` → `-s 2/3/4` son todas válidas ahí.
- ¿Quieres un tamaño final menor (ej. 2K en vez de 4K)? **Haz el upscale a la escala nativa (limpio) y luego REDUCE con ffmpeg** en el paso de re-armado (filtro `scale`, ver paso 4). NO bajes la escala en Real-ESRGAN.
- Nota: esta build es **solo-Vulkan** (no hay modo CPU `-g -1`). Si aun con escala nativa una GPU muy limitada saca frames negros o con costuras, baja el tamaño de tile con `-t 256` (más lento pero cabe en VRAM).

---

## Pasos a ejecutar

### 0. Asegurar herramientas instaladas
```powershell
# Real-ESRGAN
$rex="C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe"
if(-not (Test-Path $rex)){
  $url="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip"
  $zip="$env:TEMP\realesrgan.zip"; Invoke-WebRequest $url -OutFile $zip
  Expand-Archive $zip "C:\Users\Sinfi\.claude\tools\realesrgan" -Force
}
# ffmpeg
$ff="C:\Users\Sinfi\.claude\tools\ffmpeg\ffmpeg.exe"
if(-not (Test-Path $ff)){
  $url="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
  $zip="$env:TEMP\ffmpeg.zip"; Invoke-WebRequest $url -OutFile $zip
  Expand-Archive $zip "$env:TEMP\ffmpeg_x" -Force
  # mover bin\ffmpeg.exe y ffprobe.exe a la carpeta estable
  $bin=(Get-ChildItem "$env:TEMP\ffmpeg_x" -Recurse -Filter ffmpeg.exe | Select-Object -First 1).DirectoryName
  New-Item -ItemType Directory -Force "C:\Users\Sinfi\.claude\tools\ffmpeg" | Out-Null
  Copy-Item "$bin\ffmpeg.exe","$bin\ffprobe.exe" "C:\Users\Sinfi\.claude\tools\ffmpeg\" -Force
}
Test-Path $rex; Test-Path $ff
```

### 1. Leer la info del video (FPS, resolución, audio, duración)
```powershell
$ff="C:\Users\Sinfi\.claude\tools\ffmpeg"
& "$ff\ffprobe.exe" -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames -of default=nw=1 "RUTA_VIDEO"
& "$ff\ffprobe.exe" -v error -show_entries format=duration -of default=nw=1 "RUTA_VIDEO"
# ¿tiene audio? (si imprime "audio", sí)
& "$ff\ffprobe.exe" -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "RUTA_VIDEO"
```
Guarda el **FPS exacto** (ej. `30000/1001`) — hay que reusarlo al re-unir. Calcula ~nº de frames = fps × duración para estimar el tiempo y avisar.

### 2. Extraer frames a una carpeta temporal
```powershell
$work="$env:TEMP\vhd_<nombre>"; $fin="$work\in"; $fout="$work\out"
New-Item -ItemType Directory -Force $fin,$fout | Out-Null
& "$ff\ffmpeg.exe" -i "RUTA_VIDEO" -qscale:v 1 "$fin\f%08d.png"
(Get-ChildItem $fin).Count  # nº de frames extraídos
```

### 3. Upscale de TODOS los frames de una vez (Real-ESRGAN procesa carpeta)
```powershell
$rex="C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe"
& $rex -i "$fin" -o "$fout" -n MODELO -s FACTOR -f png
```
- `MODELO` = el elegido arriba (ej. `realesr-animevideov3` o `realesrgan-x4plus`).
- `FACTOR` = **la escala NATIVA del modelo** (ver Regla de Oro): `realesrgan-x4plus` → `4`; `realesr-animevideov3` → `2`, `3` o `4`. **Jamás uses una escala no-nativa** o el video sale en mosaico.
- Si quieres tamaño final menor, NO lo bajes aquí: hazlo con el filtro `scale` de ffmpeg en el paso 4.
- Procesa toda la carpeta en un solo comando (usa GPU). Es el paso más largo.
- Verifica siempre 1 frame de salida con Read ANTES de re-armar: si ves rejilla/mosaico, la escala no era nativa — corrige y repite.
- **Ejecútalo en primer plano (no lo mates a media corrida)**: si el proceso se corta, deja frames a medio escribir → un PNG corrupto rompe el re-armado (`chunk too big`). Si eso pasa, borra los frames dañados y vuelve a correr este paso.

### 3b. Verificar integridad de frames (evita el error "chunk too big")
```powershell
# deben coincidir: nº frames de salida = nº de entrada
(Get-ChildItem $fin).Count; (Get-ChildItem $fout).Count
# detectar PNGs corruptos/incompletos (los muy pequeños suelen estar truncados)
Get-ChildItem $fout | Where-Object { $_.Length -lt 1000 } | ForEach-Object { $_.Name }
```
Si falta alguno o hay truncados, borra esos y vuelve a correr el paso 3 (Real-ESRGAN solo rehace los que falten si borras los malos).

### 4. Re-unir frames + audio original, conservando FPS
```powershell
# extraer el audio original (si tenía)
& "$ff\ffmpeg.exe" -i "RUTA_VIDEO" -vn -acodec copy "$work\audio.m4a"  # puede fallar si no hay audio: ignorar

# re-armar el video (usa el MISMO fps del paso 1). yuv420p = compatible con todo.
& "$ff\ffmpeg.exe" -framerate FPS -i "$fout\f%08d.png" -i "$work\audio.m4a" `
  -c:v libx264 -pix_fmt yuv420p -crf 17 -c:a aac -shortest "RUTA_SALIDA_hd.mp4"
```
- Si el video **no tenía audio**, omite `-i "$work\audio.m4a"` y `-c:a aac -shortest`.
- **¿Quieres tamaño final menor** (ej. bajar el 4x nativo a 2K limpio)? Añade el filtro de reducción `-vf "scale=2048:-2:flags=lanczos"` (Lanczos = reducción nítida). Reducir desde el 4x correcto da un 2K impecable — muy distinto a haber pedido `-s 2` a Real-ESRGAN (eso daba mosaico).
- `-crf 17` = alta calidad. Sube a 20-23 si quiere archivo más liviano.
- `FPS` = el valor exacto del paso 1 (acepta fracción tipo `30000/1001`).

### 5. Verificar y entregar
- Extrae 1 frame del resultado y léelo con Read para confirmar la mejora; informa **antes→después** (ej. 480×360 → 1920×1440, mismo FPS y duración, con audio).
- Abre con `Start-Process "RUTA_SALIDA_hd.mp4"`.
- Entrega con SendUserFile.

### 6. Limpiar temporales (¡importante, pesan!)
```powershell
Remove-Item -Recurse -Force "$work"
```

## Expectativas honestas (dilo si aplica)
- La IA reconstruye detalle plausible por frame, pero **no inventa lo que no existía**: un video muy pequeño o muy comprimido tiene un techo.
- Se procesa cada frame de forma independiente, así que puede haber leve "parpadeo" de textura en video real. En animación el resultado suele ser excelente y estable.
- Si no convence: probar otro modelo, o `-s` distinto.

## Salida
- Si el usuario no da ruta, guarda junto al original con sufijo `_hd.mp4`.
- Recuerda que fue **local y gratis**, e informa cuánto tardó y a qué resolución quedó.
