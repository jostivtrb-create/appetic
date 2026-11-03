import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getHistorial, borrarHistorial } from '../../services/historial'
import { cop } from '../../utils/money'
import { soloLocal } from '../../utils/soloLocal'
import './Pedidos.css'

// 🧾 "Mis pedidos": el historial guardado en este dispositivo. Cada pedido
// enviado por WhatsApp queda aquí para verlo y volver a pedir en un toque.
export default function Pedidos() {
  const navigate = useNavigate()
  // 🔒 Cliente de un local que no sale en el buscador: solo ve los pedidos de ese local (D13).
  const encerrado = soloLocal()
  const [pedidos, setPedidos] = useState(() => getHistorial().filter(p => !encerrado || p.localSlug === encerrado.slug))

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
        <Link to={encerrado ? `/${encerrado.slug}` : '/cuenta'} className="pedidos-volver" aria-label={encerrado ? 'Volver al menú' : 'Volver a mi cuenta'}>‹</Link>
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
          <Link to={encerrado ? `/${encerrado.slug}` : '/'} className="btn btn-primary">{encerrado ? 'Ver el menú' : 'Explorar locales'}</Link>
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
