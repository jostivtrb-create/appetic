#!/usr/bin/env bash
# Genera los DOS PDF de la cartilla de vendedores desde un solo HTML.
#
#   impresa  → para imprimir y anillar: deja 26mm de canal a la izquierda para
#              que los agujeros del anillado no se coman el texto.
#   whatsapp → para mandar por chat a un vendedor nuevo: márgenes parejos,
#              sin el canal vacío que en pantalla solo se ve raro.
#
# La diferencia la decide el propio HTML leyendo ?salida=... (ver el <script>
# del <body>). Un solo archivo que mantener, dos salidas.
#
#   bash cartilla/generar.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

pdf() { # $1 = valor de ?salida=   $2 = nombre del archivo
  rm -rf /tmp/_cartilla_prof
  google-chrome --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
    --user-data-dir=/tmp/_cartilla_prof \
    --print-to-pdf="$DIR/_crudo.pdf" \
    "file://$DIR/cartilla-appetic.html?salida=$1"
  sleep 1

  # Chrome mete las fotos sin comprimir: el PDF sale en 26 MB, y eso es una
  # cartilla que el vendedor no le puede mandar a nadie por datos. Ghostscript
  # en /printer las vuelve a meter a 300 ppp —calidad de imprenta, el ojo no
  # nota la diferencia— y quedan ~4 MB.
  gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite \
     -dPDFSETTINGS=/printer -dCompatibilityLevel=1.5 \
     -dDetectDuplicateImages=true -dSubsetFonts=true \
     -sOutputFile="$DIR/$2" "$DIR/_crudo.pdf"
  rm -f "$DIR/_crudo.pdf"

  echo "  ✅ $2 — $(du -h "$DIR/$2" | cut -f1)"
}

pdf impresa cartilla-appetic-impresa.pdf
pdf digital cartilla-appetic-whatsapp.pdf

# La cartilla reemplazó a la propuesta: es lo que el dueño descarga del panel y
# lo que sirve el sitio. Va la versión digital, no la del canal de anillado, que
# en pantalla se ve descuadrada. Copiar aquí y no a mano es lo que evita que el
# PDF publicado se quede atrás del original, que ya pasó una vez.
ROOT="$(cd "$DIR/.." && pwd)"
cp "$DIR/cartilla-appetic-whatsapp.pdf" "$ROOT/public/cartilla-appetic.pdf"
cp "$DIR/cartilla-appetic-whatsapp.pdf" "$ROOT/firebase-pdf/cartilla-appetic.pdf"
echo "  📤 copiada a public/ y firebase-pdf/ como cartilla-appetic.pdf"

echo "Listo. Para volver a sacar las capturas: node cartilla/capturar.mjs"
