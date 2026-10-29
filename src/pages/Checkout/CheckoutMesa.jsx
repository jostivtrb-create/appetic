import { useMemo, useRef, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { cop } from '../../utils/money'
import { precioItem } from '../../utils/price'
import { resumenSeleccion } from '../../utils/selectionSummary'
import { comandasDe, itemsDeComanda } from '../../services/comandas'
import { registrarPedidoStats } from '../../services/stats'
import { isDevSlug } from '../../dev'
import './Checkout.css'
import { avisarDemo } from '../../components/Demo/eventosDemo'

// 🪑 Pedir DESDE LA MESA (QR por mesa). Reemplaza al checkout normal cuando el cliente entró por
// el QR de su mesa: solo pide su NOMBRE (obligatorio) y manda la comanda «MESA 4 · Ana» directo
// a la cocina. Sin dirección, sin forma de pago y sin WhatsApp: la cuenta la cobra el local.
const NOMBRE_KEY = 'appetic_cliente'

export default function CheckoutMesa({ local, mesa, onClose, abierto = true }) {
  const { items, subtotal, clear } = useCart()
  const demo = isDevSlug(local.slug)
  const api = useMemo(() => comandasDe(local.id, { demo }), [local.id, demo])
  const [nombre, setNombre] = useState(() => { try { return JSON.parse(localStorage.getItem(NOMBRE_KEY))?.nombre || '' } catch { return '' } })
  const [estado, setEstado] = useState('')   // '' | enviando | error
  const [listo, setListo] = useState(null)   // nombre con el que salió
  const idRef = useRef(null)                 // mismo id en los reintentos → nunca se duplica
  const valido = abierto && items.length > 0 && nombre.trim().length >= 2

  async function enviar() {
    if (!valido || estado === 'enviando') return
    setEstado('enviando')
    if (!idRef.current) idRef.current = api.nuevoId()
    const quien = nombre.trim()
    const datos = {
      id: idRef.current,
      origen: 'qr',
      destino: { tipo: 'mesa', mesa: String(mesa), nombre: quien },
      items: itemsDeComanda(items.map(it => ({ ...it, comentario: it.notas || '' }))),
      creadaPor: { email: '', nombre: `${quien} (desde la mesa)` },
    }
    try {
      await Promise.race([api.crear(datos), new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo')), 10000))])
      if (!demo) registrarPedidoStats(local.id, subtotal)
      try { localStorage.setItem(NOMBRE_KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(NOMBRE_KEY)) || {}), nombre: quien })) } catch { /* nada */ }
      idRef.current = null
      clear()
      setListo(quien)
      avisarDemo('pedido-mesa')
      setEstado('')
    } catch {
      setEstado('error')
    }
  }

  if (listo) {
    return (
      <div className="co-screen co-exito">
        <div className="co-exito-check">✓</div>
        <h2>¡Listo, {listo.split(' ')[0]}!</h2>
        <p>Tu pedido ya está en la cocina 🍳. Te lo llevamos a la <strong>mesa {mesa}</strong>.</p>
        <p className="co-hint">¿Quieres algo más? Puedes volver al menú y pedir otra vez desde aquí.</p>
        <button className="btn btn-primary" onClick={onClose}>Volver al menú</button>
      </div>
    )
  }

  return (
    <div className="co-screen">
      <header className="co-head">
        <button className="co-back" onClick={onClose} aria-label="Volver">‹</button>
        <h2>Pedir a la mesa {mesa}</h2>
      </header>
      <div className="co-body">
        <section className="co-sec">
          <h3 className="co-sec-title">Tu pedido</h3>
          <ul className="com-items">
            {items.map(it => (
              <li key={it.uid}>
                <span><b>{it.cantidad}×</b> {it.producto.nombre}{resumenSeleccion(it.producto, it.seleccion) && <small> · {resumenSeleccion(it.producto, it.seleccion)}</small>}{it.notas && <em> “{it.notas}”</em>}</span>
                <span>{cop(precioItem(it))}</span>
              </li>
            ))}
          </ul>
          <p className="com-total">Total <strong>{cop(subtotal)}</strong></p>
        </section>
        <section className="co-sec">
          <h3 className="co-sec-title">¿A nombre de quién?</h3>
          <input className="co-input" placeholder="Tu nombre" value={nombre} maxLength={30} autoComplete="given-name" onChange={e => setNombre(e.target.value)} />
          <p className="co-hint">Así sabemos de quién es en la mesa {mesa}. La cuenta la pagas en el local, como siempre.</p>
        </section>
        {estado === 'error' && <p className="co-hint co-hint-err">⚠️ No se envió. Revisa el internet y vuelve a intentar.</p>}
      </div>
      <footer className="co-footer">
        {!abierto && <p className="co-hint">😴 El local está cerrado ahora. Abre a las {local.horario?.abre}.</p>}
        <button className="btn btn-primary co-enviar" disabled={!valido || estado === 'enviando'} onClick={enviar}>
          {!abierto ? 'Cerrado ahora' : estado === 'enviando' ? 'Enviando…' : estado === 'error' ? '↻ Reintentar' : !nombre.trim() ? 'Escribe tu nombre' : `🍳 Enviar a la cocina · Mesa ${mesa}`}
        </button>
      </footer>
    </div>
  )
}
