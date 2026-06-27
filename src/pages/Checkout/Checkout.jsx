import { useMemo, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { cop } from '../../utils/money'
import { calcularDomicilio } from '../../utils/delivery'
import { urlPedidoWhatsApp } from '../../utils/whatsapp'
import { registrarPedido } from '../../services/pedidos'
import './Checkout.css'

export default function Checkout({ local, onClose, abierto = true }) {
  const { items, subtotal, clear } = useCart()
  const permiteDomicilio = local.domicilio?.activo
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
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(null) // { url }

  const domicilio = useMemo(
    () => (entrega === 'domicilio' ? calcularDomicilio(local, coord) : null),
    [entrega, local, coord]
  )
  const costoEnvio = entrega === 'domicilio' && domicilio?.ok ? domicilio.costo : 0
  const total = subtotal + costoEnvio
  const pago = local.pagos?.find(p => p.id === pagoId)
  const cashNum = Number(String(cash).replace(/\D/g, '')) || 0

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
  const faltas = []
  if (!nombre.trim()) faltas.push('nombre')
  if (telefono.replace(/\D/g, '').length < 7) faltas.push('telefono')
  if (!pagoId) faltas.push('pago')
  if (entrega === 'domicilio') {
    if (!direccion.trim()) faltas.push('direccion')
    if (!domicilio?.ok) faltas.push('ubicacion')
  }
  const valido = items.length > 0 && faltas.length === 0 && abierto

  async function enviar() {
    if (!valido || enviando) return
    setEnviando(true)
    const pedido = {
      items,
      entrega,
      cliente: { nombre: nombre.trim(), telefono: telefono.trim(), direccion: direccion.trim(), coord },
      pago: { ...pago, cashAmount: pago?.tipo === 'efectivo' ? cashNum : 0 },
      domicilio,
      notas: notas.trim(),
      subtotal,
      total,
    }
    // Registro de métricas (best-effort, no en el local de prueba)
    if (local.id !== 'demo') registrarPedido(local.id, pedido)

    const url = urlPedidoWhatsApp(local, pedido)
    window.open(url, '_blank')
    clear()
    setExito({ url })
    setEnviando(false)
  }

  // ---------- Pantalla de éxito ----------
  if (exito) {
    return (
      <div className="co-screen co-exito">
        <div className="co-exito-check">✓</div>
        <h2>¡Pedido enviado!</h2>
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
            {ubic === 'denegado' && <div className="co-ubic-error">Activa el permiso de ubicación para calcular el domicilio.</div>}
            {ubic === 'error' && <div className="co-ubic-error">No pudimos obtener tu ubicación. Intenta de nuevo.</div>}

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
          <input className="co-input" placeholder="Tu WhatsApp / teléfono" inputMode="tel" value={telefono} onChange={e => setTelefono(e.target.value)} />
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
            <div className="co-res-row"><span>Domicilio</span><span>{domicilio?.ok ? cop(costoEnvio) : '—'}</span></div>
          )}
          <div className="co-res-row co-res-total"><span>Total</span><span>{cop(total)}</span></div>
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
            {faltas.includes('telefono') ? 'Falta tu teléfono · ' : ''}
            {faltas.includes('pago') ? 'Elige cómo pagas' : ''}
          </p>
        )}
        <button className="btn btn-primary co-enviar" disabled={!valido || enviando} onClick={enviar}>
          {!abierto ? 'Cerrado ahora' : enviando ? 'Enviando…' : `Enviar por WhatsApp · ${cop(total)}`}
        </button>
      </footer>
    </div>
  )
}
