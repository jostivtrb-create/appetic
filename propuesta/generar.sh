#!/usr/bin/env bash
# Regenera el PDF de la propuesta desde propuesta-appetic.html (self-contained:
# fuentes + logo van incrustados).
#
# OJO: la propuesta YA NO SE PUBLICA. La cartilla de ventas la reemplazó, y el
# botón del panel y el sitio sirven cartilla-appetic.pdf. Esto se queda porque
# de aquí salen las @font-face que usa la cartilla (cartilla/extraer-fuentes.mjs)
# y porque es el historial de cómo se vendía antes. Si lo que quieres es
# actualizar lo que descarga el dueño, el archivo es cartilla/generar.sh.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
rm -rf /tmp/_prop_prof
google-chrome --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
  --user-data-dir=/tmp/_prop_prof \
  --print-to-pdf="$DIR/propuesta-appetic.pdf" \
  "file://$DIR/propuesta-appetic.html"
sleep 1
echo "PDF regenerado en propuesta/. NO se copia a public/ ni a firebase-pdf/:"
echo "lo que se publica es la cartilla (bash cartilla/generar.sh)."
