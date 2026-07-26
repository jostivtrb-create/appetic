import { useBloquearScroll } from '../../utils/useBloquearScroll'
import './ConfirmSalirMenu.css'

// 🧲 Aviso AMABLE (no bloqueante) cuando alguien que llegó al menú por LINK DIRECTO
// (el QR o WhatsApp del local — sin haber pisado el buscador) toca "Buscar": un
// empujoncito para que se quede en el menú, con salida libre. Sale máximo UNA vez
// por visita (lo controla BottomNav con sessionStorage). Se pinta con los colores
// del local activo (hereda sus variables CSS).
export default function ConfirmSalirMenu({ abierto, nombreLocal, onQuedarse, onSalir }) {
  useBloquearScroll(Boolean(abierto))
  if (!abierto) return null

  return (
    <div className="csm-overlay" onClick={onQuedarse}>
      <div className="csm-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="csm-icon" aria-hidden="true">😋</div>
        <h2 className="csm-title">¡Espera, que hay más!</h2>
        <p className="csm-text">
          Aún no has visto todo el menú de <strong>{nombreLocal || 'este local'}</strong>…
          ¿seguro que quieres salir al buscador?
        </p>
        <div className="csm-actions">
          <button className="csm-btn csm-quedarse" onClick={onQuedarse}>Seguir en el menú</button>
          <button className="csm-btn csm-salir" onClick={onSalir}>Ir al buscador</button>
        </div>
      </div>
    </div>
  )
}
