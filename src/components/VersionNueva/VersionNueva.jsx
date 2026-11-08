import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { versionNuevaLista, actualizarAhora } from '../../registerSW'
import './VersionNueva.css'

// 🔄 Aviso de versión nueva, SOLO en el panel (/…/admin) y en el superadmin. Ahí no hay clientes
// pidiendo, así que se puede ofrecer recargar; el resto de la app se sigue actualizando sola al
// reabrirla (registerSW.js). En el celular la app instalada casi nunca se cierra del todo: sin
// esto, el dueño se quedaba días con la versión vieja.
export default function VersionNueva() {
  const { pathname } = useLocation()
  const [hay, setHay] = useState(versionNuevaLista)
  const [actualizando, setActualizando] = useState(false)
  const [luego, setLuego] = useState(false) // «Después»: se esconde hasta que se recargue la app
  useEffect(() => {
    const f = () => setHay(true)
    window.addEventListener('appetic:version-nueva', f)
    return () => window.removeEventListener('appetic:version-nueva', f)
  }, [])
  if (!hay || luego || !/\/(admin|superadmin)(\/|$)/.test(pathname)) return null
  // Tarjeta abajo, de una sola línea (antes era una píldora negra arriba que en el celular se
  // partía en 5 renglones y tapaba la cabecera; al usuario no le gustaba, 8-nov).
  return (
    <div className="vn" role="status">
      <span className="vn-ico" aria-hidden="true">✨</span>
      <span className="vn-txt"><b>Versión nueva lista</b><small>Trae mejoras</small></span>
      <button type="button" className="vn-luego" onClick={() => setLuego(true)} aria-label="Después">✕</button>
      <button type="button" className="vn-ya" disabled={actualizando} onClick={() => { setActualizando(true); actualizarAhora() }}>
        {actualizando ? 'Actualizando…' : 'Actualizar'}
      </button>
    </div>
  )
}
