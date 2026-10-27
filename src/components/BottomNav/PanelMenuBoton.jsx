import { useNavUI } from '../../contexts/NavUIContext'
import { useAdmin } from '../../contexts/AdminContext'
import { useAuth } from '../../contexts/AuthContext'
import { esSuperadmin } from '../../config/roles'
import { useEsEscritorio } from '../../utils/useEsEscritorio'
import { devSuper } from './PanelRail'

// ¿Este usuario tiene panel? Dueño de algún local o superadmin.
export function usePuedePanel() {
  const { user } = useAuth()
  const { esDueno } = useAdmin()
  const esSuper = esSuperadmin(user?.email) || devSuper()
  return { puede: esSuper || esDueno, esSuper }
}

// 📱 Botón ☰ de las cabeceras del panel: abre el cajón (PanelDrawer). Solo se
// pinta en el celular y para quien tiene panel; en PC la barra ya está al lado.
export default function PanelMenuBoton() {
  const { setPanelMenu } = useNavUI()
  const { puede } = usePuedePanel()
  const esPC = useEsEscritorio()
  if (!puede || esPC) return null
  return (
    <button className="prail-menu-btn" onClick={() => setPanelMenu(true)} aria-label="Abrir menú del panel">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  )
}

// 📱 En las pantallas que NO son del panel (buscador, menú de un local, Cuenta…)
// no hay cabecera común donde poner el ☰: va flotando abajo a la izquierda, que
// es donde estaba la barra inferior y no choca con las cabeceras de cada página.
export function PanelMenuFlotante() {
  const { setPanelMenu } = useNavUI()
  return (
    <button className="prail-fab" onClick={() => setPanelMenu(true)} aria-label="Abrir menú">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  )
}
