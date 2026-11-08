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
  useEffect(() => {
    const f = () => setHay(true)
    window.addEventListener('appetic:version-nueva', f)
    return () => window.removeEventListener('appetic:version-nueva', f)
  }, [])
  if (!hay || !/\/(admin|superadmin)(\/|$)/.test(pathname)) return null
  return (
    <div className="vn" role="status">
      <span>🔄 Hay una versión nueva de Appetic</span>
      <button type="button" disabled={actualizando} onClick={() => { setActualizando(true); actualizarAhora() }}>
        {actualizando ? 'Actualizando…' : 'Actualizar'}
      </button>
    </div>
  )
}
