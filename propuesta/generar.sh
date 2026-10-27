#!/usr/bin/env bash
# Regenera los PDF de Appetic con Chrome headless.
#
#   bash propuesta/generar.sh                  → la propuesta (única pieza vigente)
#   bash propuesta/generar.sh propuesta-appetic
#
# Las imágenes viven en propuesta/img/ y las fuentes en propuesta/fuentes.css
# (copiado de cartilla/fuentes.css). El PDF resultante sí es autosuficiente:
# Chrome mete dentro las fuentes y las imágenes.
#
# Appetic tiene UNA sola pieza (decisión P8, 27-oct-2026):
#   · propuesta-appetic.html → 8 páginas A4, tres planes, para la reunión y para WhatsApp
# El folleto (folleto-appetic.html) y la cartilla (cartilla/) están jubilados: no se regeneran.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PROF="/tmp/_appetic_prop_prof"
DOCS="${@:-propuesta-appetic}"
for d in $DOCS; do
  rm -rf "$PROF"
  google-chrome --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
    --user-data-dir="$PROF" --virtual-time-budget=5000 \
    --print-to-pdf="$DIR/$d.pdf" "file://$DIR/$d.html" 2>/dev/null
  echo "PDF regenerado: $d.pdf"
done
rm -rf "$PROF"
