import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getHistorial, borrarHistorial } from '../../services/historial'
import { cop } from '../../utils/money'
import './Pedidos.css'

// 🧾 "Mis pedidos": el historial guardado en este dispositivo. Cada pedido
// enviado por WhatsApp queda aquí para verlo y volver a pedir en un toque.
export default function Pedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState(() => getHistorial())

  const fmtFecha = useMemo(
    () => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    []
  )

  function limpiar() {
    if (!window.confirm('¿Borrar todo tu historial de pedidos en este dispositivo?')) return
    borrarHistorial()
    setPedidos([])
  }

  return (
    <div className="pedidos">
      <header className="pedidos-top">
        <Link to="/" className="pedidos-volver" aria-label="Volver al inicio">‹</Link>
        <h1>Mis pedidos</h1>
        {pedidos.length > 0 && (
          <button className="pedidos-limpiar" onClick={limpiar}>Borrar</button>
        )}
      </header>

      {pedidos.length === 0 ? (
        <div className="pedidos-vacio">
          <div className="pedidos-vacio-emoji">🧾</div>
          <h2>Aún no tienes pedidos</h2>
          <p>Cuando envíes un pedido por WhatsApp, aquí quedará guardado para que lo repitas fácil.</p>
          <Link to="/" className="btn btn-primary">Explorar locales</Link>
        </div>
      ) : (
        <ul className="pedidos-lista">
          {pedidos.map(p => (
            <li key={p.id} className="pedido-card">
              <div className="pedido-head">
                <span className="pedido-logo">
                  {p.localLogo ? <img src={p.localLogo} alt="" loading="lazy" /> : <span>🍽️</span>}
                </span>
                <div className="pedido-info">
                  <strong>{p.localNombre}</strong>
                  <span className="pedido-meta">
                    {p.entrega === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger'} · {fmtFecha.format(new Date(p.fecha))}
                  </span>
                </div>
                <span className="pedido-total">{cop(p.total)}</span>
              </div>

              <ul className="pedido-items">
                {p.items.map((it, i) => (
                  <li key={i}><span className="pedido-cant">{it.cantidad}×</span> {it.nombre}</li>
                ))}
              </ul>

              <button className="pedido-repetir" onClick={() => navigate(`/${p.localSlug}`)}>
                Volver a pedir ›
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
