// 🪑 QR POR MESA (guía «Mesero y Comandas», D3 + decisiones del 29-oct-2026).
//
// Cada mesa tiene su QR: appetic.vercel.app/<local>?mesa=4. Al abrirlo, la app recuerda la mesa
// mientras el cliente navega el menú (sessionStorage, 4 horas) y el pedido sale como comanda
// «MESA 4 · Ana» DIRECTO a la cocina (sin WhatsApp, sin dirección ni forma de pago: la cuenta la
// cobra el local). Solo funciona si el local activó sus mesas (local.mesas > 0, en Difundir).
const VIDA_MS = 4 * 60 * 60 * 1000
const clave = slug => `appetic_mesa_${slug}`

export function mesaDeLaUrl() {
  if (typeof window === 'undefined') return null
  const m = new URLSearchParams(window.location.search).get('mesa')
  return m && /^\d{1,3}$/.test(m) ? String(Number(m)) : null
}

// La mesa en la que está sentado el cliente en ESTE local (o null).
export function mesaActual(local) {
  if (!local?.slug || !(Number(local.mesas) > 0)) return null
  const deUrl = mesaDeLaUrl()
  try {
    if (deUrl && Number(deUrl) >= 1 && Number(deUrl) <= Number(local.mesas)) {
      sessionStorage.setItem(clave(local.slug), JSON.stringify({ mesa: deUrl, en: Date.now() }))
      return deUrl
    }
    const g = JSON.parse(sessionStorage.getItem(clave(local.slug)) || 'null')
    if (g && Date.now() - g.en < VIDA_MS) return g.mesa
  } catch { /* nada */ }
  return null
}

export function olvidarMesa(slug) {
  try { sessionStorage.removeItem(clave(slug)) } catch { /* nada */ }
}

// Hoja para imprimir: un QR por mesa (6 por hoja carta), con el logo y el número grande.
export async function abrirHojaMesas(local, urlMenu, cuantas, colorQR) {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write('<p style="font-family:sans-serif;padding:20px">Generando los QR…</p>')
  const { default: QRCode } = await import('qrcode')
  const qrs = await Promise.all(Array.from({ length: cuantas }, (_, i) =>
    QRCode.toDataURL(`${urlMenu}?mesa=${i + 1}`, { width: 600, margin: 1, errorCorrectionLevel: 'H', color: { dark: colorQR, light: '#FFFFFF' } })))
  const primario = local.tema?.primary || '#ED7D2B'
  const logo = local.icono || local.logo || ''
  const tarjetas = qrs.map((src, i) => `
    <div class="t">
      <div class="cab">${logo ? `<img class="logo" src="${logo}" alt="">` : ''}<span>${esc(local.nombre)}</span></div>
      <div class="mesa">MESA <b>${i + 1}</b></div>
      <img class="qr" src="${src}" alt="QR mesa ${i + 1}">
      <p>Escanea, mira el menú y pide desde tu mesa</p>
    </div>`).join('')
  w.document.open()
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>QR de las mesas · ${esc(local.nombre)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: letter; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #2A211C; background: #f4f1ec; }
  .barra { position: sticky; top: 0; padding: 12px; text-align: center; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
  .barra button { font: inherit; font-weight: 800; padding: 12px 22px; border: 0; border-radius: 12px; background: ${primario}; color: #fff; cursor: pointer; }
  .hoja { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8mm; padding: 10mm; max-width: 216mm; margin: 0 auto; }
  .t { break-inside: avoid; background: #fff; border: 2px dashed #d8cfc4; border-radius: 6mm; padding: 6mm; text-align: center; }
  .cab { display: flex; align-items: center; justify-content: center; gap: 3mm; font-weight: 800; font-size: 13pt; }
  .logo { width: 12mm; height: 12mm; object-fit: contain; border-radius: 2mm; }
  .mesa { margin: 3mm 0; font-size: 14pt; font-weight: 800; letter-spacing: .1em; color: ${primario}; }
  .mesa b { font-size: 30pt; letter-spacing: 0; color: #2A211C; }
  .qr { width: 52mm; height: 52mm; }
  p { margin-top: 2mm; font-size: 10pt; color: #6b5f55; }
  @media print { .barra { display: none; } body { background: #fff; } .hoja { padding: 0; } }
</style></head><body>
<div class="barra"><button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div>
<div class="hoja">${tarjetas}</div>
<script>window.addEventListener('load',function(){setTimeout(function(){try{window.print()}catch(e){}},600)})</script>
</body></html>`)
  w.document.close()
  return true
}

function esc(t) { return String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) }
