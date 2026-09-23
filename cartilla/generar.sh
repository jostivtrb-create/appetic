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

# Sello de versión. Va impreso en la portada del PDF y, en el mismo formato, al
# lado del botón del panel: si los dos textos coinciden, el archivo que tienes
# abierto es el que está publicado. Sin esto la única forma de saberlo era
# comparar el PDF página por página, que es justo lo que no se puede pedir.
VERSION="$(date '+%d/%m/%Y · %H:%M')"

pdf() { # $1 = valor de ?salida=   $2 = nombre del archivo
  rm -rf /tmp/_cartilla_prof
  google-chrome --headless --disable-gpu --no-pdf-header-footer --no-sandbox \
    --user-data-dir=/tmp/_cartilla_prof \
    --print-to-pdf="$DIR/_crudo.pdf" \
    "file://$DIR/cartilla-appetic.html?salida=$1&v=$(printf %s "$VERSION" | jq -sRr @uri)"
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
for destino in "$ROOT/public" "$ROOT/firebase-pdf"; do
  cp "$DIR/cartilla-appetic-whatsapp.pdf" "$destino/cartilla-appetic.pdf"
  # El mismo sello que quedó impreso en la portada, para que el panel lo lea y
  # lo enseñe al lado del botón.
  # du -m redondea hacia arriba y convierte 5,4 MB en "6". Con los bytes de
  # verdad el número que ve el dueño es el mismo que le dice su celular.
  printf '{"version":"%s","paginas":18,"mb":"%s"}\n' \
    "$VERSION" \
    "$(awk -v b="$(stat -c%s "$DIR/cartilla-appetic-whatsapp.pdf")" 'BEGIN{printf "%.1f", b/1048576}')" \
    > "$destino/cartilla-version.json"
done
echo "  📤 copiada a public/ y firebase-pdf/ — versión $VERSION"

echo "Listo. Para volver a sacar las capturas: node cartilla/capturar.mjs"
