#!/usr/bin/env bash
# Regenera el PDF de la propuesta desde propuesta-appetic.html (self-contained:
# fuentes + logo van incrustados). Copia el resultado a firebase-pdf/ y public/.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
rm -rf /tmp/_prop_prof
google-chrome --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
  --user-data-dir=/tmp/_prop_prof \
  --print-to-pdf="$DIR/propuesta-appetic.pdf" \
  "file://$DIR/propuesta-appetic.html"
sleep 1
cp "$DIR/propuesta-appetic.pdf" "$ROOT/firebase-pdf/propuesta-appetic.pdf"
cp "$DIR/propuesta-appetic.pdf" "$ROOT/public/propuesta-appetic.pdf"
echo "PDF regenerado y copiado a firebase-pdf/ y public/"
