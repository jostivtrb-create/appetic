---
name: Mejorar_Calidad_Imagen
description: Mejora la CALIDAD y RESOLUCIÓN de CUALQUIER imagen usando IA (upscale Real-ESRGAN) en la PC del usuario — sin Canva, sin subir nada a internet, gratis. Reconstruye detalle y bordes nítidos en vez de solo estirar. Úsala cuando el usuario diga "/Mejorar_Calidad_Imagen", "mejora la calidad de esta imagen", "súbele la resolución", "está borrosa/pixelada, arréglala", "hazla más nítida", "agranda esta foto sin que se vea fea", "mejorar imagen con IA", "upscale", "que se vea en HD", o pase una imagen pidiendo más calidad/resolución. Sirve para FOTOS y para DIBUJOS/ILUSTRACIONES/LOGOS (elige el modelo de IA según el tipo). NO quita el fondo (para eso está /Quitar_Fondo_Mejorar_Calidad). Es GENÉRICA: cualquier imagen, cualquier proyecto.
---

# Mejorar Calidad de Imagen (upscale con IA)

## Propósito
Tomar **cualquier imagen** (foto, dibujo, logo, captura, imagen generada por IA) y devolverla con **más resolución y mejor nitidez**, reconstruyendo detalle con IA en lugar de estirarla (que la dejaría borrosa). **Todo local en la PC del usuario, gratis, sin Canva y sin subir la imagen a ningún servidor.** Equivale al "Mejorar calidad con IA" de Canva.

> Esta skill SOLO mejora calidad. Si además hay que quitar el fondo / hacer sticker, usar **/Quitar_Fondo_Mejorar_Calidad**.

## Herramienta que usa (y de dónde sale)
- **Real-ESRGAN (ncnn-vulkan, portable)** — IA open-source de GitHub (`xinntao/Real-ESRGAN`). Versión `.exe` portable que usa la GPU (Vulkan) y **NO necesita Python** (evita problemas con la versión de Python instalada).
  - Ubicación estable: `C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe`

## Elegir el modelo según el tipo de imagen (clave para buen resultado)
Mira la imagen primero (tool Read) y decide:
- **Foto real / persona / paisaje / producto** → `realesrgan-x4plus`
- **Dibujo / caricatura / anime / logo / sticker / imagen IA estilo ilustración** → `realesrgan-x4plus-anime`
- **Imagen muy ruidosa o frame de video / animación** → `realesr-animevideov3` (con `-s 2`, `-s 3` o `-s 4`)

Si hay duda, pregunta al usuario o prueba el más apropiado y enséñale el resultado.

## Pasos a ejecutar

### 1. Mirar la imagen
Léela con Read para ver qué es y elegir el modelo. Anota su resolución (informa el antes→después).

### 2. Asegurar que Real-ESRGAN está instalado
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

### 3. Mejorar calidad (upscale)
```powershell
& "C:\Users\Sinfi\.claude\tools\realesrgan\realesrgan-ncnn-vulkan.exe" `
  -i "RUTA_ENTRADA" -o "RUTA_SALIDA.png" `
  -n MODELO -s 4
```
- `MODELO` = el elegido en el paso 1.
- `-s` es el factor de escala: 4 (máx detalle), o 2/3 si la imagen ya es grande y solo se quiere limpiar.
- La salida en **PNG** conserva mejor calidad (sin recompresión JPEG).

### 4. Verificar, abrir y entregar
- Lee la salida con Read y compárala con la original (informa el cambio de resolución, ej. 447×447 → 1788×1788).
- Abre con `Start-Process "RUTA_SALIDA.png"`.
- Entrega con SendUserFile.

## Expectativas honestas (decirlo si aplica)
- La IA reconstruye detalle plausible pero **no inventa información que no existía**: una imagen muy pequeña o muy comprimida tiene un techo de calidad.
- En **dibujos/logos** el resultado suele ser excelente (líneas limpias). En **fotos** mejora nitidez y resolución, pero rostros muy pequeños pueden verse "plásticos".
- Si el resultado no convence, probar otro modelo o ajustar `-s`.

## Salida
- Si el usuario no da ruta, guarda junto a la original con sufijo `_hd.png`.
- Recordar que fue local y gratis, y ofrecer procesar **una carpeta entera** por lotes (loop del paso 3 sobre cada imagen).

## Procesar una carpeta entera (lote)
Si el usuario lo pide, itera el paso 3 sobre cada imagen de la carpeta, guardando `<nombre>_hd.png` para cada una.
