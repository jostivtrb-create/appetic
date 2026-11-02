#!/usr/bin/env bash
# Regenera el PDF de la propuesta de Appetic con Chrome headless.
#
#   bash propuesta/generar.sh
#
# UN SOLO PDF (2-nov-2026): propuesta-appetic.pdf sirve igual para WhatsApp y para imprimir.
# Ya trae su propia portada (Swiftfly × Appetic), así que la tapa del folder (tapa-appetic) y la
# versión impresa aparte (propuesta-impresa-appetic.pdf) se retiraron: repetían la portada.
#
# Las imágenes viven en propuesta/img/ y las fuentes en propuesta/fuentes.css. El PDF resultante
# es autosuficiente: Chrome mete dentro las fuentes y las imágenes.
#
#   · propuesta-appetic.html → 7 páginas A4: portada · qué es · 1 menú · 2 TV + 3 domicilios ·
#     4 meseros y cocina · 5 cuentas · planes (Emprendedor · Comerciante · Empresario · Desarrollador).
#     Ver .mega-cuestionario/Guía para los planes por tipo de negocio.md
# El folleto (folleto-appetic.html) y la cartilla (cartilla/) están jubilados: no se regeneran.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
PROF="/tmp/_appetic_prop_prof"
rm -rf "$PROF"
google-chrome --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
  --user-data-dir="$PROF" --virtual-time-budget=5000 \
  --print-to-pdf="$DIR/propuesta-appetic.pdf" "file://$DIR/propuesta-appetic.html" 2>/dev/null
rm -rf "$PROF"
echo "PDF regenerado: propuesta-appetic.pdf"
