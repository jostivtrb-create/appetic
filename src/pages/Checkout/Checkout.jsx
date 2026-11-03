import { useEffect, useMemo, useRef, useState } from 'react'
import { cuentasCliente } from '../../utils/cuentasDinero'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { cop } from '../../utils/money'
import { calcularDomicilio } from '../../utils/delivery'
import { abrirPedidoWhatsApp, textoPedido } from '../../utils/whatsapp'
import ChatWhatsApp from '../../components/Demo/ChatWhatsApp'
import { crearPedido, pedidosDe } from '../../services/pedidos'
import { enviarAlServidor, lineasDelCarrito, textoCambios } from '../../services/enviarPedido'
import { isDevSlug } from '../../dev'
import { generarCodigoPedido } from '../../utils/codigoPedido'
import { guardarEnHistorial } from '../../services/historial'
import { getPerfil, guardarPerfil } from '../../services/usuarios'
import './Checkout.css'
import { crearPedidoLaGranEsquina } from '../../services/pedidoLaGranEsquina'
import { avisarDemo } from '../../components/Demo/eventosDemo'
import { Link } from 'react-router-dom'
import { ofreceDomicilio } from '../../utils/plan'
import { useFavoritos } from '../../contexts/FavoritosContext'

// Dónde vive la app de La Gran Esquina, para armar el link de la comanda.
const LA_GRAN_ESQUINA_WEB = 'https://la-gran-esquina-lyart.vercel.app'

// 💾 Datos del cliente guardados en el propio dispositivo, para recordarlos
// aunque pida como invitado (sin iniciar sesión). Si inicia sesión, además se
// guardan en su perfil (usuarios/{uid}).
const CLIENTE_KEY = 'appetic_cliente'
function leerClienteLocal() {
  try { return JSON.parse(localStorage.getItem(CLIENTE_KEY)) || null } catch { return null }
}
function guardarClienteLocal(datos) {
  try { localStorage.setItem(CLIENTE_KEY, JSON.stringify(datos)) } catch { /* sin espacio: no pasa nada */ }
}

// Lo que falta para poder enviar, en el pie del checkout.
const TEXTO_FALTA = {
  ubicacion: 'Falta tu ubicación',
  cobertura: 'Sin domicilio para tu ubicación',
  direccion: 'Falta la dirección',
  nombre: 'Falta tu nombre',
  telefono: 'Falta tu WhatsApp válido',
  'confirmar-whatsapp': 'Confirma tu WhatsApp',
  pago: 'Elige cómo pagas',
  efectivo: 'El efectivo no alcanza para el total',
}

export default function Checkout({ local, onClose, abierto = true }) {
  const { items, subtotal, clear, ponerAlDia } = useCart()
  const { user } = useAuth()
  // El domicilio solo se ofrece si el local registró su ubicación (sin ella no se
  // puede calcular la distancia). Hasta que el admin la fije, solo "Recoger".
  const tieneUbicacionLocal = local.ubicacion?.lat != null && local.ubicacion?.lng != null
  // 💳 A domicilio solo desde el plan Comerciante (guía «Planes en la app»).
  const conDomicilio = ofreceDomicilio(local)
  const domicilioPendiente = conDomicilio && !tieneUbicacionLocal
  const permiteDomicilio = conDomicilio && tieneUbicacionLocal
  // Si no hay domicilio, recoger siempre se puede (si no, no habría cómo pedir).
  const permiteRecoger = local.recoger !== false || !permiteDomicilio
  const { agregarFavorito } = useFavoritos()

  const [entrega, setEntrega] = useState(permiteDomicilio ? 'domicilio' : 'recoger')
  const [coord, setCoord] = useState(null)
  const [ubic, setUbic] = useState('idle') // idle | cargando | ok | error | denegado
  const [direccion, setDireccion] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  // D21: las cuentas de dinero que el cliente ve. Si el dueño las ocultó todas, al menos Efectivo
  // (si no, nadie podría pedir).
  const pagosCliente = cuentasCliente(local).length ? cuentasCliente(local) : [{ id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' }]
  const [pagoId, setPagoId] = useState(pagosCliente[0]?.id || null)
  const [cash, setCash] = useState('')
  const [notas, setNotas] = useState('')
  const [confirmoWhatsapp, setConfirmoWhatsapp] = useState(false)
  const [enviando, setEnviando] = useState(false)
  // Freno inmediato: dos toques casi juntos llegan antes de que React pinte «Enviando…».
  const enviandoRef = useRef(false)
  const [exito, setExito] = useState(null) // { url, codigo }
  // 🔄 Lo que el servidor corrigió (guía «Blindaje» D2/D3) y por qué no se pudo enviar.
  const [avisoCambios, setAvisoCambios] = useState([])
  const [envioServidor, setEnvioServidor] = useState(null) // costo del envío según el servidor
  const [errorEnvio, setErrorEnvio] = useState('')

  // Prellenar desde el dispositivo (funciona para invitados y al instante).
  useEffect(() => {
    const c = leerClienteLocal()
    if (!c) return
    setNombre(prev => prev || c.nombre || '')
    setTelefono(prev => prev || c.telefono || '')
    setDireccion(prev => prev || c.direccion || '')
  }, [])

  // Prellenar con los datos guardados del cliente (si inició sesión).
  useEffect(() => {
    if (!user) return
    let activo = true
    getPerfil(user.uid).then(p => {
      if (!activo || !p) return
      setNombre(prev => prev || p.nombre || user.displayName || '')
      setTelefono(prev => prev || p.telefono || '')
      setDireccion(prev => prev || p.direccion || '')
    })
    return () => { activo = false }
  }, [user])

  // 🍔 Demo para clientes: la ubicación no es obligatoria (es de prueba). Sin ella se usa una de
  // ejemplo a ~1,5 km del local, para que igual se vea el envío calculado por distancia.
  const coordDemo = local.esDemo && !coord && local.ubicacion?.lat != null
    ? { lat: local.ubicacion.lat + 0.0135, lng: local.ubicacion.lng } : null
  const coordUsada = coord || coordDemo
  const domicilio = useMemo(
    () => (entrega === 'domicilio' ? calcularDomicilio(local, coordUsada) : null),
    [entrega, local, coordUsada?.lat, coordUsada?.lng] // eslint-disable-line react-hooks/exhaustive-deps
  )
  // Otra ubicación u otra forma de entrega: lo que dijo el servidor del envío ya no aplica.
  useEffect(() => { setEnvioServidor(null) }, [entrega, coordUsada?.lat, coordUsada?.lng])
  const costoEnvio = entrega === 'domicilio' && domicilio?.ok ? (envioServidor ?? domicilio.costo) : 0
  const total = subtotal + costoEnvio
  const pago = pagosCliente.find(p => p.id === pagoId)
  const cashNum = Number(String(cash).replace(/\D/g, '')) || 0

  // 🛵 Si la ubicación FALLA (permiso denegado o error), no bloqueamos el pedido:
  // se puede pedir a domicilio solo con la dirección y el valor del domicilio
  // queda "a convenir" con el negocio (el total va SIN domicilio).
  const ubicacionFallo = ubic === 'error' || ubic === 'denegado'
  const domicilioAConvenir = entrega === 'domicilio' && ubicacionFallo

  function obtenerUbicacion() {
    if (!navigator.geolocation) { setUbic('error'); return }
    setUbic('cargando')
    navigator.geolocation.getCurrentPosition(
      pos => { setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setUbic('ok') },
      // Si ya teníamos su ubicación, un intento fallido después no la borra (ni lo deja «a convenir»).
      err => { setUbic(coord ? 'ok' : err.code === 1 ? 'denegado' : 'error') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Validación
  // 📱 El teléfono debe ser un WhatsApp válido (celular colombiano de 10 dígitos que
  // empieza en 3, con o sin indicativo 57). Así evitamos que se pase un número mal
  // (ej. un fijo o incompleto) y garantizamos que el local pueda responderle.
  const telDigits = telefono.replace(/\D/g, '')
  const telWhatsappValido = /^3\d{9}$/.test(telDigits) || /^573\d{9}$/.test(telDigits)

  const faltas = []
  if (!nombre.trim()) faltas.push('nombre')
  if (!telWhatsappValido) faltas.push('telefono')
  if (!confirmoWhatsapp) faltas.push('confirmar-whatsapp')
  if (!pagoId) faltas.push('pago')
  if (pago?.tipo === 'efectivo' && cashNum > 0 && cashNum < total) faltas.push('efectivo')
  // Ubicación tomada pero el local no cubre o no tiene tarifa para esa distancia.
  const sinDomicilioAqui = entrega === 'domicilio' && !ubicacionFallo && !!coordUsada && domicilio && !domicilio.ok
  if (entrega === 'domicilio') {
    if (!direccion.trim()) faltas.push('direccion')
    // La ubicación solo es obligatoria si NO falló su captura. Si falló, se
    // permite pedir con la dirección y el domicilio queda a convenir.
    if (!domicilio?.ok && !ubicacionFallo) faltas.push(sinDomicilioAqui ? 'cobertura' : 'ubicacion')
  }
  const valido = items.length > 0 && faltas.length === 0 && abierto

  async function enviar() {
    if (!valido || enviando || enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    // Código corto que va en el WhatsApp y en «Mi pedido» (para hablar del pedido por su nombre).
    const codigo = generarCodigoPedido(local)
    // Vista previa (?preview=1): el pedido va al motor DEMO del navegador, no a la base real.
    const demo = isDevSlug(local.slug)
    // El id se genera ANTES de abrir WhatsApp: el link «Mi pedido» del mensaje lo lleva.
    const id = pedidosDe(local.id, { demo }).nuevoId()
    const pedido = {
      id,
      codigo,
      items,
      entrega,
      cliente: { nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(), coord: coordUsada },
      pago: { ...pago, cashAmount: pago?.tipo === 'efectivo' ? cashNum : 0 },
      domicilio,
      domicilioAConvenir,
      notas: notas.trim(),
      subtotal,
      total,
    }
    // 🧾 El pedido pasa por el SERVIDOR, que rehace precios y envío con el menú de hoy (guía
    // «Blindaje» D1–D3). Si algo cambió, el carrito se pone al día y el cliente vuelve a enviar;
    // si no contesta (internet malo), el WhatsApp sale igual sin «Mi pedido» (S9).
    // Vista previa (?preview=1): va al motor DEMO del navegador, como siempre.
    setAvisoCambios([])
    setErrorEnvio('')
    let guardado = false
    if (demo) {
      guardado = await crearPedido(local, pedido, codigo, id, { demo }).catch(() => false)
    } else {
      const r = await enviarAlServidor({
        tipo: 'pedido', localId: local.id, id, items: lineasDelCarrito(items),
        pedido: {
          codigo, entrega, cliente: pedido.cliente, notas: pedido.notas,
          pago: { id: pago?.id || null, nombre: pago?.nombre || '', tipo: pago?.tipo || '', cashAmount: pedido.pago.cashAmount },
          domicilio: domicilio?.ok ? { costo: costoEnvio } : null, domicilioAConvenir,
        },
      })
      if (r.cambios) {
        const textos = textoCambios(r.cambios)
        if (r.cambios.length) ponerAlDia(r.cambios, r.productos)
        if (r.domicilio?.ok) { setEnvioServidor(r.domicilio.costo); textos.push(`El domicilio ahora cuesta ${cop(r.domicilio.costo)}`) }
        if (r.domicilio && !r.domicilio.ok) textos.push(r.domicilio.motivo === 'fuera-cobertura' ? 'Tu ubicación quedó fuera del área de domicilio' : 'El domicilio no está disponible para tu ubicación')
        setAvisoCambios(textos)
        enviandoRef.current = false
        setEnviando(false)
        return
      }
      if (r.error) {
        setErrorEnvio(r.motivo === 'limite' ? 'Espera un momento antes de volver a pedir.' : r.motivo === 'cerrado' ? 'El local acaba de cerrar.' : `No se pudo enviar: ${r.error}.`)
        enviandoRef.current = false
        setEnviando(false)
        return
      }
      if (r.ok) { guardado = true; pedido.subtotal = r.subtotal; pedido.total = r.total }
    }
    // Si el servidor no contestó a tiempo, el link «Mi pedido» va igual en el WhatsApp: el pedido
    // pudo alcanzar a guardarse (red lenta) y, si no, «Mi pedido» lo dice con calma. Al local le
    // llega además el link para responderle (whatsapp.js).
    if (!guardado) pedido.sinRegistro = true

    // Locales con su propia app: el pedido se deja escrito ALLÁ, con la forma
    // que su pantalla de comandas espera. El link que sale de aquí va en el
    // WhatsApp y lo manda a la cocina de un toque.
    //
    // Best-effort y con tope de tiempo, igual que el guardado normal: si falla
    // o tarda, el cliente manda su WhatsApp con el pedido escrito y en el local
    // lo teclean, como cualquier pedido por teléfono. Nadie se queda esperando.
    if (local.menuExterno === 'la-gran-esquina') {
      const id = await Promise.race([
        crearPedidoLaGranEsquina(items, pago).catch(err => {
          console.warn('[checkout] no se pudo dejar el pedido en La Gran Esquina:', err?.message || err)
          return null
        }),
        new Promise(res => setTimeout(() => res(null), 6000)),
      ])
      if (id) pedido.linkComanda = `${LA_GRAN_ESQUINA_WEB}/comanda/${id}`
    }

    // Guarda el pedido en el historial de ESTE dispositivo (para "Mis pedidos").
    guardarEnHistorial(local, pedido)
    // ❤️ Donde pide, le queda de favorito (D14).
    agregarFavorito(local)

    // Recordar datos para la próxima: siempre en el dispositivo (invitados) y,
    // si inició sesión, además en su perfil.
    const datosCliente = {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
    }
    guardarClienteLocal(datosCliente)
    if (user) guardarPerfil(user.uid, datosCliente)

    // Abre WhatsApp con el endpoint correcto según dispositivo (móvil/PC).
    // 🍔 En la demo NO se abre WhatsApp: se muestra cómo le llega el mensaje al restaurante.
    const wa = local.esDemo ? { url: '', abierto: true } : abrirPedidoWhatsApp(local, pedido)
    clear()
    setExito({ url: wa.url, waAbierto: wa.abierto, codigo, miPedido: `/p/${local.slug}/${id}`, chat: local.esDemo ? textoPedido(local, pedido) : '' })
    avisarDemo('pedido-app')
    enviandoRef.current = false
    setEnviando(false)
  }

  // ---------- Pantalla de éxito ----------
  if (exito && exito.chat) {
    return (
      <div className="co-screen co-exito co-exito-chat">
        <h2>¡Pedido enviado!</h2>
        <p>Así le llega tu pedido al WhatsApp del restaurante, completo y ordenado:</p>
        <ChatWhatsApp nombre={local.nombre} foto={local.icono || local.logo} texto={exito.chat} />
        {exito.miPedido && (
          <Link className="btn btn-primary co-exito-seguir" to={exito.miPedido} onClick={() => avisarDemo('mi-pedido')}>📍 Ver en qué va mi pedido</Link>
        )}
        <button className="btn btn-ghost" onClick={onClose}>Volver al menú</button>
      </div>
    )
  }
  if (exito) {
    return (
      <div className="co-screen co-exito">
        <div className="co-exito-check">✓</div>
        <h2>¡Pedido enviado!</h2>
        {exito.codigo && (
          <p className="co-exito-codigo">Tu código de pedido: <strong>{exito.codigo}</strong></p>
        )}
        {exito.waAbierto ? (
          <p>Abrimos WhatsApp con tu pedido listo. Solo dale enviar al chat de <strong>{local.nombre}</strong> para confirmar.</p>
        ) : (
          <>
            <p><strong>Falta un paso:</strong> abre WhatsApp y dale enviar al chat de <strong>{local.nombre}</strong>. Tu pedido ya va escrito.</p>
            <a className="btn btn-primary" href={exito.url} target="_blank" rel="noreferrer">Abrir WhatsApp</a>
          </>
        )}
        {exito.miPedido && (
          <Link className={`btn ${exito.waAbierto ? 'btn-primary' : 'btn-ghost'} co-exito-seguir`} to={exito.miPedido} onClick={() => avisarDemo('mi-pedido')}>📍 Ver en qué va mi pedido</Link>
        )}
        {exito.waAbierto && <a className="btn btn-ghost" href={exito.url} target="_blank" rel="noreferrer">Abrir WhatsApp otra vez</a>}
        <button className="btn btn-ghost" onClick={onClose}>Volver al menú</button>
      </div>
    )
  }

  // ---------- Checkout ----------
  return (
    <div className="co-screen">
      <header className="co-head">
        <button className="co-back" onClick={onClose} aria-label="Volver">‹</button>
        <h2>Finalizar pedido</h2>
      </header>

      <div className="co-body">
        {/* Tipo de entrega */}
        <section className="co-sec">
          <h3 className="co-sec-title">¿Cómo lo quieres?</h3>
          <div className="co-toggle">
            {permiteDomicilio && (
              <button className={entrega === 'domicilio' ? 'on' : ''} onClick={() => setEntrega('domicilio')}>
                🛵 Domicilio
              </button>
            )}
            {permiteRecoger && (
              <button className={entrega === 'recoger' ? 'on' : ''} onClick={() => setEntrega('recoger')}>
                🏪 Recoger
              </button>
            )}
          </div>
          {domicilioPendiente && (
            <p className="co-hint co-hint-info">🛵 El domicilio aún no está disponible. Por ahora solo puedes recoger en el local.</p>
          )}
        </section>

        {/* Ubicación (solo domicilio) */}
        {entrega === 'domicilio' && (
          <section className="co-sec">
            <h3 className="co-sec-title">Tu ubicación</h3>
            <button className="co-ubic-btn" onClick={obtenerUbicacion} disabled={ubic === 'cargando'}>
              📍 {ubic === 'cargando' ? 'Obteniendo…' : ubic === 'ok' ? 'Ubicación lista ✓' : 'Usar mi ubicación'}
            </button>

            {coordDemo && domicilio?.ok && (
              <div className="co-ubic-ok">
                🧪 En la demo no hace falta: usamos una ubicación de ejemplo a {domicilio.distancia.toFixed(1)} km · Domicilio <strong>{cop(domicilio.costo)}</strong>
              </div>
            )}
            {ubic === 'ok' && domicilio?.ok && (
              <div className="co-ubic-ok">
                A {domicilio.distancia.toFixed(1)} km · Domicilio <strong>{cop(domicilio.costo)}</strong>
              </div>
            )}
            {ubic === 'ok' && domicilio && !domicilio.ok && domicilio.motivo === 'fuera-cobertura' && (
              <div className="co-ubic-error">Estás fuera del área de domicilio (máx {local.domicilio.maxKm} km). Puedes escoger «Recoger» o escribirle al local.</div>
            )}
            {ubic === 'ok' && domicilio && !domicilio.ok && domicilio.motivo === 'sin-tarifa' && (
              <div className="co-ubic-error">El local todavía no tiene precio de domicilio para tu distancia ({domicilio.distancia.toFixed(1)} km). Puedes escoger «Recoger» o escribirle al local.</div>
            )}

            {/* Si la ubicación falló, no bloqueamos: se pide con la dirección y el
                domicilio queda a convenir. Aviso súper resaltado. */}
            {domicilioAConvenir && (
              <div className="co-convenir">
                <strong>⚠️ No pudimos tomar tu ubicación.</strong>
                <span>Puedes pedir igual escribiendo tu dirección abajo. El <strong>valor del domicilio lo acuerdas con el negocio</strong> por WhatsApp — el total <strong>NO incluye el domicilio</strong>.</span>
                <button type="button" className="co-convenir-reintentar" onClick={obtenerUbicacion}>Reintentar ubicación</button>
              </div>
            )}

            <input
              className="co-input"
              placeholder="Dirección y referencia (ej: Cra 10 #5-23, casa azul)"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
            />
          </section>
        )}

        {/* Datos del cliente */}
        <section className="co-sec">
          <h3 className="co-sec-title">Tus datos</h3>
          <input className="co-input" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
          <input
            className={`co-input ${telefono && !telWhatsappValido ? 'co-input-err' : ''}`}
            placeholder="Tu WhatsApp (te escribiremos por aquí)"
            inputMode="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
          />
          {telefono && !telWhatsappValido && (
            <p className="co-hint co-hint-err">📱 Escribe tu celular de WhatsApp: 10 dígitos que empiezan en 3.</p>
          )}
          <label className={`co-check ${confirmoWhatsapp ? 'on' : ''}`}>
            <input type="checkbox" checked={confirmoWhatsapp} onChange={e => setConfirmoWhatsapp(e.target.checked)} />
            <span>Confirmo que <strong>{telefono.trim() || 'este número'}</strong> es mi WhatsApp y ahí puedo recibir la respuesta del local.</span>
          </label>
        </section>

        {/* Método de pago */}
        <section className="co-sec">
          <h3 className="co-sec-title">¿Cómo pagas?</h3>
          {pagosCliente.map(p => (
            <label key={p.id} className={`co-pago ${pagoId === p.id ? 'on' : ''}`}>
              <span>{p.nombre}</span>
              <input type="radio" name="pago" checked={pagoId === p.id} onChange={() => setPagoId(p.id)} />
            </label>
          ))}
          {pago?.tipo === 'efectivo' && (
            <div className="co-cash">
              <input
                className="co-input"
                placeholder="¿Con cuánto pagas? (para el cambio)"
                inputMode="numeric"
                value={cash}
                onChange={e => setCash(e.target.value)}
              />
              {cashNum > 0 && cashNum >= total && (
                <span className="co-cambio">Cambio: {cop(cashNum - total)}</span>
              )}
              {cashNum > 0 && cashNum < total && (
                <span className="co-cambio co-cambio-warn">El monto es menor al total</span>
              )}
            </div>
          )}
        </section>

        {/* Notas */}
        <section className="co-sec">
          <h3 className="co-sec-title">Notas del pedido <span className="co-opt">(opcional)</span></h3>
          <textarea className="co-input co-textarea" rows={2} placeholder="Algo más que debamos saber…" value={notas} onChange={e => setNotas(e.target.value)} />
        </section>

        {avisoCambios.length > 0 && (
          <section className="co-convenir co-cambios" role="alert">
            <strong>🔄 Actualizamos tu pedido</strong>
            <ul>{avisoCambios.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <span>Revisa el total y vuelve a enviar.</span>
          </section>
        )}

        {/* Resumen */}
        <section className="co-resumen">
          <div className="co-res-row"><span>Subtotal</span><span>{cop(subtotal)}</span></div>
          {entrega === 'domicilio' && (
            <div className="co-res-row">
              <span>Domicilio</span>
              <span className={domicilioAConvenir ? 'co-res-convenir' : ''}>
                {domicilio?.ok ? cop(costoEnvio) : domicilioAConvenir ? 'A convenir' : '—'}
              </span>
            </div>
          )}
          <div className="co-res-row co-res-total"><span>Total</span><span>{cop(total)}</span></div>
          {domicilioAConvenir && (
            <p className="co-res-nota">⚠️ Este total <strong>NO incluye el domicilio</strong>. Lo acuerdas con el negocio.</p>
          )}
        </section>
      </div>

      <footer className="co-footer">
        {!abierto && (
          <p className="co-hint">😴 El local está cerrado ahora. Abre a las {local.horario?.abre}.</p>
        )}
        {errorEnvio && <p className="co-hint co-hint-err">⚠️ {errorEnvio}</p>}
        {abierto && !valido && items.length > 0 && (
          <p className="co-hint">{faltas.map(f => TEXTO_FALTA[f]).filter(Boolean).join(' · ')}</p>
        )}
        {/* El servidor pudo quitar todo (agotado, ya no existe): que no quede un botón muerto en $0. */}
        {items.length === 0 && (
          <p className="co-hint">Tu pedido quedó vacío. <button type="button" className="co-volver" onClick={onClose}>Volver al menú</button></p>
        )}
        <button className="btn btn-primary co-enviar" disabled={!valido || enviando} onClick={enviar}>
          {!abierto ? 'Cerrado ahora' : enviando ? 'Enviando…'
            : `Enviar por WhatsApp · ${cop(total)}${domicilioAConvenir ? ' (sin domicilio)' : ''}`}
        </button>
      </footer>
    </div>
  )
}
