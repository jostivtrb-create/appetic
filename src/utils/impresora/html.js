// 🖨️ Respaldo SIN conexión directa: el documento como página de 58 u 80 mm y el «Imprimir» del
// navegador. Sirve con cualquier impresora instalada en el aparato (y en Android con apps como
// RawBT). No es automático: el navegador siempre muestra su ventana de imprimir.
import { renglones, anchoEnLetras } from './documento.js'

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function aHtml(doc, ancho = 58) {
  const mm = Number(ancho) === 80 ? 80 : 58
  const filas = renglones(doc, anchoEnLetras(mm)).map(r =>
    `<div class="${[r.grande && 'g', r.negrita && 'b', r.centro && 'c'].filter(Boolean).join(' ')}">${esc(r.texto) || '&nbsp;'}</div>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>Imprimir</title><style>
@page { size: ${mm}mm auto; margin: 0 }
html, body { margin: 0; background: #fff; color: #000 }
body { width: ${mm - 6}mm; padding: 3mm; font: 12px/1.35 "Courier New", ui-monospace, monospace; white-space: pre }
.c { text-align: center } .b { font-weight: 700 } .g { font-size: 18px; line-height: 1.25 }
</style></head><body>${filas}<script>window.onload=function(){setTimeout(function(){window.print()},150)};window.onafterprint=function(){window.close()}<\/script></body></html>`
}

// Abre la ventana y manda a imprimir. `ventana` se abre en el toque (si no, el navegador la bloquea).
export function imprimirEnNavegador(doc, ancho, ventana = null) {
  const w = ventana || window.open('', '_blank', 'width=420,height=640')
  if (!w) throw new Error('ventana-bloqueada')
  w.document.open()
  w.document.write(aHtml(doc, ancho))
  w.document.close()
}
