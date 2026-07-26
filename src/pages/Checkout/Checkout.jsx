import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { cop } from '../../utils/money'
import { calcularDomicilio } from '../../utils/delivery'
import { abrirPedidoWhatsApp } from '../../utils/whatsapp'
import { crearPedido } from '../../services/pedidos'
import { generarCodigoPedido } from '../../utils/codigoPedido'
import { guardarEnHistorial } from '../../services/historial'
import { getPerfil, guardarPerfil } from '../../services/usuarios'
import './Checkout.css'

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

export default function Checkout({ local, onClose, abierto = true }) {
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  // El domicilio solo se ofrece si el local registró su ubicación (sin ella no se
  // puede calcular la distancia). Hasta que el admin la fije, solo "Recoger".
  const tieneUbicacionLocal = local.ubicacion?.lat != null && local.ubicacion?.lng != null
  const domicilioPendiente = local.domicilio?.activo && !tieneUbicacionLocal
  const permiteDomicilio = local.domicilio?.activo && tieneUbicacionLocal
  const permiteRecoger = local.recoger !== false

  const [entrega, setEntrega] = useState(permiteDomicilio ? 'domicilio' : 'recoger')
  const [coord, setCoord] = useState(null)
  const [ubic, setUbic] = useState('idle') // idle | cargando | ok | error | denegado
  const [direccion, setDireccion] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [pagoId, setPagoId] = useState(local.pagos?.[0]?.id || null)
  const [cash, setCash] = useState('')
  const [notas, setNotas] = useState('')
  const [confirmoWhatsapp, setConfirmoWhatsapp] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(null) // { url, codigo }

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

  const domicilio = useMemo(
    () => (entrega === 'domicilio' ? calcularDomicilio(local, coord) : null),
    [entrega, local, coord]
  )
  const costoEnvio = entrega === 'domicilio' && domicilio?.ok ? domicilio.costo : 0
  const total = subtotal + costoEnvio
  const pago = local.pagos?.find(p => p.id === pagoId)
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
      err => { setUbic(err.code === 1 ? 'denegado' : 'error') },
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
  if (entrega === 'domicilio') {
    if (!direccion.trim()) faltas.push('direccion')
    // La ubicación solo es obligatoria si NO falló su captura. Si falló, se
    // permite pedir con la dirección y el domicilio queda a convenir.
    if (!domicilio?.ok && !ubicacionFallo) faltas.push('ubicacion')
  }
  const valido = items.length > 0 && faltas.length === 0 && abierto

  async function enviar() {
    if (!valido || enviando) return
    setEnviando(true)
    // Código corto que va en el WhatsApp y sirve para que el domiciliario busque el
    // pedido en la app (fuente de verdad del precio, anti-manipulación).
    const codigo = generarCodigoPedido(local)
    const pedido = {
      codigo,
      items,
      entrega,
      cliente: { nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(), coord },
      pago: { ...pago, cashAmount: pago?.tipo === 'efectivo' ? cashNum : 0 },
      domicilio,
      domicilioAConvenir,
      notas: notas.trim(),
      subtotal,
      total,
    }
    // Guarda el pedido COMPLETO en Firestore con su código (antes de abrir WhatsApp).
    // Le damos hasta 6s: así el pedido alcanza a guardarse antes de navegar a WhatsApp
    // (importante en móvil, donde la navegación corta las peticiones en curso), pero si la
    // red está lenta NO dejamos al cliente trabado en "Enviando…". Best-effort.
    if (local.id !== 'demo') {
      await Promise.race([
        crearPedido(local.id, pedido, codigo).catch(() => false),
        new Promise(res => setTimeout(res, 6000)),
      ])
    }

    // Guarda el pedido en el historial de ESTE dispositivo (para "Mis pedidos").
    guardarEnHistorial(local, pedido)

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
    const url = abrirPedidoWhatsApp(local, pedido)
    clear()
    setExito({ url, codigo })
    setEnviando(false)
  }

  // ---------- Pantalla de éxito ----------
  if (exito) {
    return (
      <div className="co-screen co-exito">
        <div className="co-exito-check">✓</div>
        <h2>¡Pedido enviado!</h2>
        {exito.codigo && (
          <p className="co-exito-codigo">Tu código de pedido: <strong>{exito.codigo}</strong></p>
        )}
        <p>Abrimos WhatsApp con tu pedido listo. Solo dale enviar al chat de <strong>{local.nombre}</strong> para confirmar.</p>
        <a className="btn btn-primary" href={exito.url} target="_blank" rel="noreferrer">Abrir WhatsApp otra vez</a>
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

            {ubic === 'ok' && domicilio?.ok && (
              <div className="co-ubic-ok">
                A {domicilio.distancia.toFixed(1)} km · Domicilio <strong>{cop(domicilio.costo)}</strong>
              </div>
            )}
            {ubic === 'ok' && domicilio && !domicilio.ok && domicilio.motivo === 'fuera-cobertura' && (
              <div className="co-ubic-error">Estás fuera del área de domicilio (máx {local.domicilio.maxKm} km).</div>
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
          {local.pagos?.map(p => (
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
        {abierto && !valido && items.length > 0 && (
          <p className="co-hint">
            {faltas.includes('ubicacion') ? 'Falta tu ubicación · ' : ''}
            {faltas.includes('direccion') ? 'Falta la dirección · ' : ''}
            {faltas.includes('nombre') ? 'Falta tu nombre · ' : ''}
            {faltas.includes('telefono') ? 'Falta tu WhatsApp válido · ' : ''}
            {faltas.includes('confirmar-whatsapp') ? 'Confirma tu WhatsApp · ' : ''}
            {faltas.includes('pago') ? 'Elige cómo pagas' : ''}
          </p>
        )}
        <button className="btn btn-primary co-enviar" disabled={!valido || enviando} onClick={enviar}>
          {!abierto ? 'Cerrado ahora' : enviando ? 'Enviando…'
            : `Enviar por WhatsApp · ${cop(total)}${domicilioAConvenir ? ' (sin domicilio)' : ''}`}
        </button>
      </footer>
    </div>
  )
}
