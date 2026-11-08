import { invitarAvisos } from '../../components/InvitarAvisos/InvitarAvisos'
import { useMemo, useRef, useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { cop } from '../../utils/money'
import { precioItem } from '../../utils/price'
import { resumenSeleccion } from '../../utils/selectionSummary'
import { comandasDe, itemsDeComanda } from '../../services/comandas'
import { llevaTurno } from '../../utils/turnos'
import { enviarAlServidor, lineasDelCarrito, textoCambios } from '../../services/enviarPedido'
import { isDevSlug } from '../../dev'
import './Checkout.css'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { avisarDemo } from '../../components/Demo/eventosDemo'

// 🪑 Pedir DESDE LA MESA (QR por mesa). Reemplaza al checkout normal cuando el cliente entró por
// el QR de su mesa: solo pide su NOMBRE (obligatorio) y manda la comanda «MESA 4 · Ana» directo
// a la cocina. Sin dirección, sin forma de pago y sin WhatsApp: la cuenta la cobra el local.
const NOMBRE_KEY = 'appetic_cliente'

export default function CheckoutMesa({ local, mesa, onClose, abierto = true }) {
  const { items, subtotal, clear, ponerAlDia } = useCart()
  const demo = isDevSlug(local.slug)
  const api = useMemo(() => comandasDe(local.id, { demo }), [local.id, demo])
  const [nombre, setNombre] = useState(() => { try { return JSON.parse(localStorage.getItem(NOMBRE_KEY))?.nombre || '' } catch { return '' } })
  const [estado, setEstado] = useState('')   // '' | enviando | error
  const [listo, setListo] = useState(null)   // { nombre, turno } con el que salió
  const [aviso, setAviso] = useState({ cambios: [], error: '' })   // lo que dijo el servidor (guía «Blindaje»)
  const idRef = useRef(null)                 // mismo id en los reintentos → nunca se duplica
  const valido = abierto && items.length > 0 && nombre.trim().length >= 2
  const { agregarFavorito } = useFavoritos()

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
    setAviso({ cambios: [], error: '' })
    let turno = null
    if (demo) {
      // Vista previa (?preview=1): motor DEMO del navegador.
      try {
        turno = llevaTurno(local, datos.destino, 'qr') ? await api.tomarTurno(datos.id) : null
        await api.crear({ ...datos, turno })
      } catch { setEstado('error'); return }
    } else {
      // 🧾 El SERVIDOR rehace los precios y cuenta los envíos de este celular (guía «Blindaje» D1, D4).
      const r = await enviarAlServidor({ tipo: 'mesa', localId: local.id, id: datos.id, mesa, nombre: quien, items: lineasDelCarrito(items) })
      if (r.cambios) {
        ponerAlDia(r.cambios, r.productos)
        setAviso({ cambios: textoCambios(r.cambios), error: '' })
        setEstado('')
        return
      }
      if (r.error) {
        setAviso({ cambios: [], error: r.motivo === 'limite' ? 'Ya mandaste varios pedidos seguidos. Espera unos minutos o pídeselo al mesero.' : r.motivo === 'cerrado' ? 'El local acaba de cerrar.' : r.error })
        setEstado('')
        return
      }
      if (r.sinRed) { setEstado('error'); return }
      turno = r.turno || null
    }
    try { localStorage.setItem(NOMBRE_KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(NOMBRE_KEY)) || {}), nombre: quien })) } catch { /* nada */ }
    idRef.current = null
    agregarFavorito(local)   // ❤️ D14
    invitarAvisos(local, 'pedido') // 🔔 D34
    clear()
    setListo({ nombre: quien, turno })
    avisarDemo('pedido-mesa')
    setEstado('')
  }

  if (listo) {
    return (
      <div className="co-screen co-exito">
        <div className="co-exito-check">✓</div>
        <h2>¡Listo, {listo.nombre.split(' ')[0]}!</h2>
        <p>Tu pedido ya está en la cocina 🍳. Te lo llevamos a la <strong>mesa {mesa}</strong>.</p>
        {listo.turno && (
          <div className="co-turno">
            <small>Tu turno</small>
            <b>{listo.turno}</b>
            <span>Cuando esté listo, sale en el TV del local.</span>
          </div>
        )}
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
        {aviso.cambios.length > 0 && (
          <section className="co-convenir co-cambios" role="alert">
            <strong>🔄 Actualizamos tu pedido</strong>
            <ul>{aviso.cambios.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <span>Revisa el total y vuelve a enviar.</span>
          </section>
        )}
        {aviso.error && <p className="co-hint co-hint-err">⚠️ {aviso.error}</p>}
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
