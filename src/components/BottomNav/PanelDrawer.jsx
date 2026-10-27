import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavUI } from '../../contexts/NavUIContext'
import { usePuedePanel } from './PanelMenuBoton'
import { useEsEscritorio } from '../../utils/useEsEscritorio'
import { useBloquearScroll } from '../../utils/useBloquearScroll'
import PanelRail from './PanelRail'
import { marcarCajonAbierto } from '../../utils/cajonPanel'

// 📱 Cajón lateral del panel en el CELULAR (como el de Registro Infiniity): el
// mismo contenido de la barra lateral de PC, deslizándose desde la izquierda
// sobre un velo. Solo existe para dueños de algún local y superadmins.
//   • Se cierra con el velo, la ✕, Escape, el "atrás" del teléfono o al
//     navegar a cualquier pantalla.
//   • Al abrir mete una entrada en el historial: así "atrás" cierra el cajón en
//     vez de sacarte del panel. Si navegas desde el cajón, esa entrada se
//     reemplaza (PanelRail navega con replace) y no queda un paso fantasma.
export default function PanelDrawer() {
  const { panelMenu: abierto, setPanelMenu } = useNavUI()
  const { puede, esSuper } = usePuedePanel()
  const esPC = useEsEscritorio()
  const { key } = useLocation()
  const empujado = useRef(false)

  const activo = puede && !esPC
  useBloquearScroll(activo && abierto)

  // Cualquier navegación cierra el cajón (y el PC no lo usa nunca).
  useEffect(() => { setPanelMenu(false) }, [key, setPanelMenu])
  useEffect(() => { if (esPC) setPanelMenu(false) }, [esPC, setPanelMenu])

  // "Atrás" del teléfono = cerrar el cajón.
  useEffect(() => {
    if (!abierto || !activo) return
    window.history.pushState({ ...(window.history.state || {}), prailDrawer: true }, '')
    empujado.current = true
    marcarCajonAbierto(true)
    const alAtras = () => { empujado.current = false; setPanelMenu(false) }
    const alTecla = e => { if (e.key === 'Escape') cerrar() }
    window.addEventListener('popstate', alAtras)
    document.addEventListener('keydown', alTecla)
    return () => {
      marcarCajonAbierto(false)
      window.removeEventListener('popstate', alAtras)
      document.removeEventListener('keydown', alTecla)
    }
  }, [abierto, activo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cierre a mano (velo, ✕, Escape): si la entrada del cajón sigue arriba, se
  // saca con back() para no dejarla colgando en el historial.
  const cerrar = useCallback(() => {
    if (empujado.current && window.history.state?.prailDrawer) window.history.back()
    else setPanelMenu(false)
    empujado.current = false
  }, [setPanelMenu])

  if (!activo) return null

  return (
    <div className={`prail-drawer ${abierto ? 'is-open' : ''}`} aria-hidden={!abierto} inert={abierto ? undefined : ''}>
      {/* inert como cadena: React 18 no conoce el atributo y con booleanos avisa. */}
      <button className="prail-drawer-velo" onClick={cerrar} aria-label="Cerrar menú" tabIndex={abierto ? 0 : -1} />
      <aside className="prail-drawer-panel">
        <PanelRail esSuper={esSuper} modo="drawer" onCerrar={cerrar} />
      </aside>
    </div>
  )
}
