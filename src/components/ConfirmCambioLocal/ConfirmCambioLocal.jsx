import { useNavUI } from '../../contexts/NavUIContext'
import { useBloquearScroll } from '../../utils/useBloquearScroll'
import './ConfirmCambioLocal.css'

// 🛒 Modal bonito que reemplaza al window.confirm al cambiar de local con
// carrito. Se pinta con los colores de la app (tema del local activo).
export default function ConfirmCambioLocal() {
  const { pendiente, confirmarCambio, cancelarCambio } = useNavUI()
  useBloquearScroll(Boolean(pendiente))
  if (!pendiente) return null

  return (
    <div className="ccl-overlay" onClick={cancelarCambio}>
      <div className="ccl-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="ccl-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 4h1.7l2.1 10.4a1.2 1.2 0 0 0 1.2 1h7.3a1.2 1.2 0 0 0 1.2-.95L20 7.5H6" />
            <circle cx="9.5" cy="19" r="1.4" />
            <circle cx="16.5" cy="19" r="1.4" />
          </svg>
        </div>
        <h2 className="ccl-title">¿Cambiar de local?</h2>
        <p className="ccl-text">
          Tienes un pedido sin terminar en <strong>{pendiente.nombre}</strong>. Si entras a otro
          local se vaciará — solo puedes pedir de un local a la vez.
        </p>
        <div className="ccl-actions">
          <button className="ccl-btn ccl-cancel" onClick={cancelarCambio}>Seguir aquí</button>
          <button className="ccl-btn ccl-ok" onClick={confirmarCambio}>Vaciar y cambiar</button>
        </div>
      </div>
    </div>
  )
}
