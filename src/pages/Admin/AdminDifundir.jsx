import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isMobileBrowser } from '../../utils/whatsapp'
import { menuUrl, formatTel, mensajeBienvenida, qrDark, abrirAfiche } from '../../utils/compartir'
import { construirPromptPublicidad, VARIANTES_PUBLICIDAD } from '../../utils/promptIA'
import { abrirHojaMesas } from '../../utils/mesaQR'
import { tiene, ofreceDomicilio } from '../../utils/plan'
import { Candado } from './PlanAvisos'

// Dónde se recuerda, POR LOCAL, qué estilo de publicidad tocó la última vez.
const claveVariante = slug => `appetic_pub_variante_${slug}`

// 📣 Difundir: el dueño del local consigue aquí todo lo que necesita para que sus
// clientes lleguen al menú: el QR (descargable), un afiche de DOMICILIOS listo
// para imprimir, el link para copiar y un mensaje de bienvenida para WhatsApp.
export default function AdminDifundir({ local, slug, onUpdate }) {
  const url = menuUrl(slug)
  const urlTV = `${url.replace(/\/$/, '')}/tv`
  const [qrPng, setQrPng] = useState('')
  // El mensaje se regenera cada vez que se abre la pestaña (refleja los datos
  // actuales del local); el dueño puede editarlo antes de enviarlo.
  const [mensaje, setMensaje] = useState(() => mensajeBienvenida(local, url))
  const [copiado, setCopiado] = useState('') // 'link' | 'msg' | 'pub'
  const [avisoPubIA, setAvisoPubIA] = useState(null) // { prompt, estilo, n } tras abrir Gemini
  // Estilo de publicidad que toca ahora. Se ROTA en orden (no al azar) y se recuerda
  // en el navegador: así el dueño recorre los 10 sin que le repita uno antes de tiempo.
  const [variante, setVariante] = useState(() => {
    const guardado = Number(localStorage.getItem(claveVariante(slug)))
    return Number.isFinite(guardado) ? guardado : 0
  })

  const sinWhatsapp = !String(local.whatsapp || '').replace(/\D/g, '')
  // 🪑 QR por mesa: cuántas mesas tiene el local (0 = apagado).
  const [mesas, setMesas] = useState(Number(local.mesas) || 0)
  const [mesasMsg, setMesasMsg] = useState('')
  async function guardarMesas(n) {
    const v = Math.max(0, Math.min(99, Math.round(Number(n) || 0)))
    setMesas(v)
    if (v === (Number(local.mesas) || 0) || !onUpdate) return
    setMesasMsg('Guardando…')
    try { await onUpdate({ mesas: v }); setMesasMsg('Guardado ✓') } catch { setMesasMsg('No se pudo guardar') }
    setTimeout(() => setMesasMsg(''), 1800)
  }

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

  // ✨ Publicidad para redes con IA: arma el prompt con el nombre, el teléfono y los
  // colores del local, lo copia y abre Gemini — igual que "Crear con IA" del banner.
  // El prompt le PROHÍBE a la IA dibujar el logo (los modelos lo deforman): el afiche
  // se construye solo con tipografía, comida y color.
  function crearPublicidadConIA() {
    const total = VARIANTES_PUBLICIDAD.length
    const i = ((variante % total) + total) % total
    const prompt = construirPromptPublicidad({ local, telefono: formatTel(local.whatsapp), variante: i })
    try { navigator.clipboard?.writeText(prompt) } catch { /* queda el botón "copiar de nuevo" */ }
    window.open('https://gemini.google.com/app', '_blank', 'noopener')
    setAvisoPubIA({ prompt, estilo: VARIANTES_PUBLICIDAD[i].nombre, n: i + 1, total })
    // Deja listo el SIGUIENTE estilo para el próximo click.
    const siguiente = (i + 1) % total
    setVariante(siguiente)
    try { localStorage.setItem(claveVariante(slug), String(siguiente)) } catch { /* modo privado */ }
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
        {/* La URL a la vista: antes de mandar a IMPRIMIR conviene poder leer a dónde
            apunta el código. Un QR malo se ve idéntico a uno bueno. */}
        <p className="dif-qr-url">Apunta a <strong>{url.replace(/^https?:\/\//, '')}</strong></p>
        <button className="btn btn-primary dif-full" onClick={descargarQR} disabled={!qrPng}>
          ⬇️ Descargar QR (PNG)
        </button>
      </section>

      {/* ---- Pantalla de TV (Guía para la Pantalla de TV.md, S8) ---- */}
      <section className="ac-sec">
        <h3>📺 Tu menú en el TV</h3>
        <p className="ac-hint">Tu menú en vivo en el televisor del local: cambia solo cuando cambias un precio o agotas un plato. Es un link fijo, sin activar nada.</p>
        <div className="dif-link">
          <span className="dif-link-url">{urlTV.replace(/^https?:\/\//, '')}</span>
          <button className="dif-copybtn" onClick={() => copiar(urlTV, 'tv')}>
            {copiado === 'tv' ? '¡Copiado! ✓' : 'Copiar'}
          </button>
        </div>
        <div className="dif-tv-pasos">
          <details>
            <summary>📺 En un Smart TV</summary>
            <p>Abre el <b>navegador</b> del TV («Internet» en Samsung, «Navegador web» en LG), escribe el link con el control y guárdalo en <b>favoritos</b> o como <b>página de inicio</b>. La próxima vez es abrir el navegador y listo.</p>
          </details>
          <details>
            <summary>🔌 Con Chromecast, Fire TV Stick o TV Box</summary>
            <p>Abre el navegador del aparato (Chrome en Android TV, <b>Silk</b> en Fire TV), escribe el link y déjalo en favoritos. También puedes abrirlo en Chrome de un computador y usar «Enviar» (transmitir pestaña) al Chromecast.</p>
          </details>
          <details>
            <summary>💻 Con un computador por HDMI</summary>
            <p>Abre el link en Chrome y pulsa <b>F11</b> para verlo en pantalla completa. El puntero del mouse se esconde solo.</p>
          </details>
          <details>
            <summary>📱 En una tablet o un celular en la pared</summary>
            <p>Abre el link y gira el aparato como lo vayas a dejar: la pantalla se acomoda sola en horizontal o vertical. Mientras esté abierta, no se apaga.</p>
          </details>
        </div>
        <Link className="dif-afiche" to={`/${slug}/admin/config/pantalla${window.location.search}`}>
          <span className="dif-afiche-ic">⚙️</span>
          <span className="dif-afiche-txt"><strong>Configurar la pantalla</strong><small>Transición, categorías y anuncios</small></span>
          <span className="dif-afiche-arrow">→</span>
        </Link>
      </section>

      {/* ---- QR por mesa (plan Empresario) ---- */}
      <section className="ac-sec">
        <h3>🪑 QR por mesa</h3>
        {!tiene(local, 'mesas') ? <Candado local={local} funcion="mesas" compacto /> : <>
        <p className="ac-hint">Un QR en cada mesa: el cliente escanea, pide y la comanda llega a la cocina como «MESA 4», con su nombre. Cuando sale, les avisa a los meseros para que la lleven.</p>
        <label className="dif-mesas">
          ¿Cuántas mesas tienes?
          <input type="number" min="0" max="99" inputMode="numeric" value={mesas || ''} placeholder="0"
            onChange={e => setMesas(Number(e.target.value) || 0)} onBlur={e => guardarMesas(e.target.value)} />
          {mesasMsg && <span className="dif-mesas-msg">{mesasMsg}</span>}
        </label>
        <button className="dif-afiche" disabled={!mesas}
          onClick={() => {
            // La ventana se abre en el mismo toque: en iPhone, abrirla después de guardar la bloquea.
            const w = window.open('', '_blank')
            if (!w) { setMesasMsg('Tu navegador bloqueó la ventana: permite las ventanas emergentes y vuelve a tocar.'); return }
            guardarMesas(mesas)
            abrirHojaMesas(local, url, mesas, qrDark(local.tema), w)
          }}>
          <span className="dif-afiche-ic">🪑</span>
          <span className="dif-afiche-txt"><strong>Imprimir los QR de las mesas</strong><small>{mesas ? `${mesas} QR, uno por mesa, con tu logo y el número` : 'Primero pon cuántas mesas tienes'}</small></span>
          <span className="dif-afiche-arrow">→</span>
        </button>
        </>}
      </section>

      {/* ---- Afiche de domicilios (PDF imprimible, plan Comerciante) ---- */}
      <section className="ac-sec">
        <h3>🖨️ Afiche de domicilios</h3>
        {!tiene(local, 'domicilios') ? <Candado local={local} funcion="domicilios" compacto />
          : !local.domicilio?.activo ? <p className="ac-hint">🛵 Prende el domicilio en ⚙️ Configuración → Negocio para armar tu afiche.</p> : <>
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
        </>}
      </section>

      {/* ---- Publicidad para redes sociales (imagen con IA) ---- */}
      <section className="ac-sec">
        <h3>📢 Publicidad para tus redes</h3>
        {/* Toda la pieza anuncia «ya hacemos domicilios»: solo para quien los ofrece. */}
        {!ofreceDomicilio(local) ? (tiene(local, 'domicilios')
          ? <p className="ac-hint">🛵 Prende el domicilio en ⚙️ Configuración → Negocio para crear tu publicidad de domicilios.</p>
          : <Candado local={local} funcion="domicilios" compacto />) : <>
        <p className="ac-hint">
          Una imagen épica para Instagram, Facebook o el estado de WhatsApp, anunciando que
          <strong> ya haces domicilios</strong>. Sale con tu nombre, tu número
          {sinWhatsapp ? '' : <> (<strong>{formatTel(local.whatsapp)}</strong>)</>} y los colores de tu local.
        </p>
        {sinWhatsapp && (
          <span className="ac-ubic-warn">⚠️ Aún no tienes WhatsApp guardado: la publicidad saldría sin número. Ponlo en ⚙️ Configuración.</span>
        )}
        <button className="btn btn-primary dif-full" onClick={crearPublicidadConIA}>
          ✨ Crear publicidad con IA
        </button>
        <p className="dif-qr-url">
          Cada vez que le des sale un <strong>estilo distinto</strong> ({VARIANTES_PUBLICIDAD.length} en total)
        </p>
        {avisoPubIA && (
          <div className="ap-ia-aviso">
            <button className="ap-ia-aviso-x" onClick={() => setAvisoPubIA(null)} aria-label="Cerrar">✕</button>
            <p className="ap-ia-aviso-tit">✨ Abrimos <strong>Gemini</strong> en otra pestaña</p>
            <p className="dif-pub-estilo">
              🎨 Estilo {avisoPubIA.n} de {avisoPubIA.total}: <strong>{avisoPubIA.estilo}</strong>
            </p>
            <ol className="ap-ia-aviso-pasos">
              <li>Pega el prompt (ya copiado) con <strong>Ctrl/Cmd + V</strong> y envía.</li>
              <li>Cuando genere la imagen, <strong>descárgala</strong>.</li>
              <li>Súbela a tus redes o al <strong>estado de WhatsApp</strong>.</li>
            </ol>
            <p className="ac-hint">
              ¿No te gustó? Vuelve a darle al botón y te arma <strong>otro estilo</strong>, o escríbele a Gemini
              <em> “hazla otra vez, más épica”</em>. Revisa que el número y el nombre estén bien escritos antes de publicar.
            </p>
            <button
              type="button"
              className="ap-ia-aviso-copiar"
              onClick={() => copiar(avisoPubIA.prompt, 'pub')}
            >
              {copiado === 'pub' ? '¡Copiado! ✓' : '📋 Copiar el prompt de nuevo'}
            </button>
          </div>
        )}
        </>}
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
