# Motor de /Generar_Imagen : Pollinations (Flux) GRATIS + conversion segun uso
# Uso:
#   .\generar.ps1 -Prompt "descripcion en ingles" -Out "C:\ruta\nombre" -Uso web -Orient horizontal
# Parametros:
#   -Uso    : "web"  -> WebP liviano (~1024-1280px, q82)
#             "alta" -> PNG alta resolucion (1536px+), maxima calidad
#   -Orient : cuadrada | horizontal | vertical
param(
  [Parameter(Mandatory=$true)][string]$Prompt,
  [Parameter(Mandatory=$true)][string]$Out,
  [ValidateSet("web","alta")][string]$Uso = "web",
  [ValidateSet("cuadrada","horizontal","vertical")][string]$Orient = "cuadrada",
  [int]$Seed = 0,
  [int]$Quality = 82
)
$ErrorActionPreference = "Continue"

# 1) Dimensiones de generacion segun uso + orientacion
if ($Uso -eq "alta") {
  switch ($Orient) {
    "horizontal" { $W=1536; $H=1152 }
    "vertical"   { $W=1152; $H=1536 }
    default      { $W=1536; $H=1536 }
  }
  $maxSide = 0   # sin reducir: maxima calidad
} else {
  switch ($Orient) {
    "horizontal" { $W=1280; $H=960 }
    "vertical"   { $W=960;  $H=1280 }
    default      { $W=1152; $H=1152 }
  }
  $maxSide = 1280  # lado mayor final para web (liviano)
}

if ($Seed -le 0) { $Seed = Get-Random -Minimum 1 -Maximum 999999 }

# 2) Generar desde Pollinations con REINTENTOS (vence timeouts de la cola gratis)
$enc = [uri]::EscapeDataString($Prompt)
$url = "https://image.pollinations.ai/prompt/$enc`?width=$W`&height=$H`&nologo=true`&model=flux`&seed=$Seed"
$tmp = [IO.Path]::Combine([IO.Path]::GetTempPath(), "genimg_$Seed.jpg")
$minBytes = 30000
$maxAttempts = 6
$ok = $false
for ($a=1; $a -le $maxAttempts -and -not $ok; $a++) {
  Write-Host "Generando (intento $a/$maxAttempts)..." -NoNewline
  try { Invoke-WebRequest -Uri $url -OutFile $tmp -TimeoutSec 150 } catch { Write-Host " en cola, reintentando"; Start-Sleep 3; continue }
  if ((Test-Path $tmp) -and ((Get-Item $tmp).Length -ge $minBytes)) { Write-Host " OK"; $ok=$true } else { Write-Host " parcial, reintento"; Start-Sleep 2 }
}
if (-not $ok) { Write-Host "ERROR: Pollinations no respondio completo. Reintenta en un momento."; exit 1 }

# 3) Convertir/optimizar segun uso
Add-Type -AssemblyName System.Drawing
$outDir = Split-Path $Out -Parent
if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$base = [IO.Path]::Combine($outDir, [IO.Path]::GetFileNameWithoutExtension($Out))

if ($Uso -eq "web") {
  # --- WebP liviano ---
  $cwebp = "C:\Users\Sinfi\.claude\tools\webp\cwebp.exe"
  if (-not (Test-Path $cwebp)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $cwebp -Parent) | Out-Null
    $zip = "$env:TEMP\libwebp.zip"
    Invoke-WebRequest -Uri "https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-1.4.0-windows-x64.zip" -OutFile $zip -TimeoutSec 120
    $tx = "$env:TEMP\libwebp_x"; Expand-Archive -Path $zip -DestinationPath $tx -Force
    Copy-Item ((Get-ChildItem $tx -Recurse -Filter cwebp.exe | Select-Object -First 1).FullName) $cwebp -Force
  }
  # calcular tamano final (lado mayor = $maxSide)
  $rw = $W; $rh = $H
  if ($maxSide -gt 0 -and ([Math]::Max($W,$H) -gt $maxSide)) {
    $scale = $maxSide / [Math]::Max($W,$H)
    $rw = [int][Math]::Round($W*$scale); $rh = [int][Math]::Round($H*$scale)
  }
  $final = "$base.webp"
  & $cwebp -q $Quality -resize $rw $rh $tmp -o $final 2>$null
  $kb = [math]::Round((Get-Item $final).Length/1KB)
  Write-Host "LISTO_WEB|$final|${rw}x${rh}|${kb}KB"
} else {
  # --- PNG alta calidad ---
  $final = "$base.png"
  $img = [System.Drawing.Image]::FromFile($tmp)
  $img.Save($final, [System.Drawing.Imaging.ImageFormat]::Png)
  $dim = "$($img.Width)x$($img.Height)"; $img.Dispose()
  $kb = [math]::Round((Get-Item $final).Length/1KB)
  Write-Host "LISTO_ALTA|$final|$dim|${kb}KB"
}
Remove-Item $tmp -ErrorAction SilentlyContinue
