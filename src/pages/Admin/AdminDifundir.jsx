import { useEffect, useState } from 'react'
import { isMobileBrowser } from '../../utils/whatsapp'
import { menuUrl, formatTel, mensajeBienvenida, qrDark, abrirAfiche } from '../../utils/compartir'

// 📣 Difundir: el dueño del local consigue aquí todo lo que necesita para que sus
// clientes lleguen al menú: el QR (descargable), un afiche de DOMICILIOS listo
// para imprimir, el link para copiar y un mensaje de bienvenida para WhatsApp.
export default function AdminDifundir({ local, slug }) {
  const url = menuUrl(slug)
  const [qrPng, setQrPng] = useState('')
  // El mensaje se regenera cada vez que se abre la pestaña (refleja los datos
  // actuales del local); el dueño puede editarlo antes de enviarlo.
  const [mensaje, setMensaje] = useState(() => mensajeBienvenida(local, url))
  const [copiado, setCopiado] = useState('') // 'link' | 'msg'

  const sinWhatsapp = !String(local.whatsapp || '').replace(/\D/g, '')

  // Genera el QR en alta resolución (para verlo, descargarlo y meterlo al afiche).
  // La librería se carga de forma diferida: solo pesa cuando el dueño abre esta
  // pestaña, no en el bundle que cargan los clientes del menú.
  useEffect(() => {
    let vivo = true
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(url, {
        width: 1024,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark: qrDark(local.tema), light: '#FFFFFF' },
      }))
      .then(d => { if (vivo) setQrPng(d) })
      .catch(err => console.error('QR:', err))
    return () => { vivo = false }
  }, [url, local.tema])

  function copiar(texto, cual) {
    const ok = () => { setCopiado(cual); setTimeout(() => setCopiado(''), 1700) }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(texto).then(ok).catch(() => fallbackCopiar(texto, ok))
    } else {
      fallbackCopiar(texto, ok)
    }
  }

  function descargarQR() {
    if (!qrPng) return
    const a = document.createElement('a')
    a.href = qrPng
    a.download = `qr-${slug}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function enviarWhatsApp() {
    const texto = encodeURIComponent(mensaje)
    // Mismo criterio que los pedidos: móvil usa deep link; PC api.whatsapp.com
    // (wa.me corrompe emojis en WhatsApp Web).
    const base = isMobileBrowser() ? 'whatsapp://send?text=' : 'https://api.whatsapp.com/send?text='
    if (isMobileBrowser()) window.location.href = base + texto
    else window.open(base + texto, '_blank')
  }

  return (
    <div className="dif">
      {/* ---- Link del menú ---- */}
      <section className="ac-sec">
        <h3>🔗 El link de tu menú</h3>
        <p className="ac-hint">Este es el enlace directo a tu menú. Compártelo por donde quieras.</p>
        <div className="dif-link">
          <span className="dif-link-url">{url.replace(/^https?:\/\//, '')}</span>
          <button className="dif-copybtn" onClick={() => copiar(url, 'link')}>
            {copiado === 'link' ? '¡Copiado! ✓' : 'Copiar'}
          </button>
        </div>
      </section>

      {/* ---- Código QR ---- */}
      <section className="ac-sec">
        <h3>📱 Tu código QR</h3>
        <p className="ac-hint">Quien lo escanee con la cámara llega directo a tu menú para pedir.</p>
        <div className="dif-qr">
          {qrPng
            ? <img className="dif-qr-img" src={qrPng} alt={`Código QR de ${local.nombre}`} />
            : <div className="dif-qr-ph">Generando…</div>}
        </div>
        <button className="btn btn-primary dif-full" onClick={descargarQR} disabled={!qrPng}>
          ⬇️ Descargar QR (PNG)
        </button>
      </section>

      {/* ---- Afiche de domicilios (PDF imprimible) ---- */}
      <section className="ac-sec">
        <h3>🖨️ Afiche de domicilios</h3>
        <p className="ac-hint">
          Un afiche con la imagen de tu local, tu QR y tu número de domicilios, listo para
          imprimir o guardar como PDF. Se arma con tus datos actuales
          {sinWhatsapp ? '' : <> (domicilios: <strong>{formatTel(local.whatsapp)}</strong>)</>}.
        </p>
        {sinWhatsapp && (
          <span className="ac-ubic-warn">⚠️ Aún no tienes WhatsApp guardado: el afiche saldrá sin número. Ponlo en ⚙️ Configuración.</span>
        )}
        <button className="dif-afiche" onClick={() => abrirAfiche(local, url, qrPng)} disabled={!qrPng}>
          <span className="dif-afiche-ic">🧾</span>
          <span>
            <strong>Ver e imprimir afiche</strong>
            <small>Se abre listo para “Guardar como PDF”</small>
          </span>
          <span className="dif-afiche-arrow">→</span>
        </button>
      </section>

      {/* ---- Mensaje de bienvenida para WhatsApp ---- */}
      <section className="ac-sec">
        <h3>💬 Mensaje de bienvenida</h3>
        <p className="ac-hint">Envíaselo a tus clientes por WhatsApp. Puedes editarlo antes de mandarlo.</p>
        <textarea
          className="dif-msg"
          rows={8}
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
        />
        <div className="dif-msg-acciones">
          <button className="btn btn-ghost dif-half" onClick={() => copiar(mensaje, 'msg')}>
            {copiado === 'msg' ? '¡Copiado! ✓' : '📋 Copiar'}
          </button>
          <button className="btn btn-primary dif-half dif-wa" onClick={enviarWhatsApp}>
            <WaIcon /> Enviar por WhatsApp
          </button>
        </div>
      </section>
    </div>
  )
}

// Copia de respaldo cuando no hay Clipboard API (contextos no seguros / viejos).
function fallbackCopiar(texto, ok) {
  try {
    const ta = document.createElement('textarea')
    ta.value = texto
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    ok()
  } catch (e) { console.error('copiar:', e) }
}

function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.15-1.7-.84-2-.94-.26-.1-.46-.15-.65.15-.2.3-.75.94-.92 1.13-.17.2-.34.22-.63.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.73-1.63-2.03-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.65-1.56-.9-2.14-.23-.56-.47-.48-.65-.49h-.55c-.2 0-.5.07-.77.37-.26.3-1 1-1 2.42 0 1.43 1.03 2.8 1.17 3 .15.2 2.03 3.1 4.92 4.35.69.3 1.22.47 1.64.6.69.22 1.32.19 1.81.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34zM12.05 2C6.5 2 2 6.5 2 12.05c0 1.77.46 3.5 1.34 5.02L2 22l5.05-1.32a10 10 0 0 0 4.99 1.32h.01C17.6 22 22 17.5 22 11.95 22 6.5 17.6 2 12.05 2z"/>
    </svg>
  )
}
