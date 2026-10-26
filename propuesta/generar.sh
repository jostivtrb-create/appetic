#!/usr/bin/env bash
# Regenera los PDF de Appetic con Chrome headless.
#
#   bash propuesta/generar.sh                  → los dos
#   bash propuesta/generar.sh propuesta-appetic
#   bash propuesta/generar.sh folleto-appetic
#
# Las imágenes viven en propuesta/img/ y las fuentes en propuesta/fuentes.css
# (copiado de cartilla/fuentes.css). El PDF resultante sí es autosuficiente:
# Chrome mete dentro las fuentes y las imágenes.
#
# Appetic tiene DOS piezas y ninguna cartilla (decisión T6, 25-oct-2026):
#   · propuesta-appetic.html → 8 páginas A4, para la reunión y para WhatsApp
#   · folleto-appetic.html   → una hoja carta, lado y lado, para dejar en el local
# La cartilla de cartilla/ está jubilada: no se regenera.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PROF="/tmp/_appetic_prop_prof"
DOCS="${@:-propuesta-appetic folleto-appetic}"
for d in $DOCS; do
  rm -rf "$PROF"
  google-chrome --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
    --user-data-dir="$PROF" --virtual-time-budget=5000 \
    --print-to-pdf="$DIR/$d.pdf" "file://$DIR/$d.html" 2>/dev/null
  echo "PDF regenerado: $d.pdf"
done
rm -rf "$PROF"
