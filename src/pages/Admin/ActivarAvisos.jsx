import { useEffect, useState } from 'react'
import { avisosSoportados, estadoAvisos, activarAvisos } from '../../services/notificaciones'

// 🔔 «Activar avisos en este celular»: para que el «¡Pedido listo!» llegue aunque la app esté
// cerrada o el celular bloqueado. Se pide una vez por celular (el navegador exige un toque).
export default function ActivarAvisos({ local, usuario }) {
  const [soporta, setSoporta] = useState(null)
  const [estado, setEstado] = useState(() => estadoAvisos(local.id))
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { avisosSoportados().then(setSoporta) }, [])

  if (soporta === null || estado === 'activo') return null
  if (!soporta) {
    // iPhone sin instalar, o navegador sin notificaciones.
    const iphone = /iphone|ipad/i.test(navigator.userAgent)
    return iphone ? (
      <p className="av-nota">📲 Para recibir el aviso de «pedido listo» con la app cerrada, instala Appetic en la pantalla de inicio (Compartir → «Agregar a inicio») y ábrela desde ahí.</p>
    ) : null
  }
  if (estado === 'bloqueado') {
    return <p className="av-nota">🔕 Los avisos están bloqueados en este navegador. Actívalos en los permisos del sitio para recibir el «pedido listo» con la app cerrada.</p>
  }

  async function activar() {
    setOcupado(true); setError('')
    try {
      await activarAvisos(local.id, usuario?.email)
      setEstado('activo')
    } catch (e) {
      setEstado(estadoAvisos(local.id))
      setError(e?.message === 'bloqueado' ? 'Bloqueaste los avisos. Puedes activarlos en los permisos del sitio.' : 'No se pudo activar. Revisa el internet e intenta de nuevo.')
    } finally { setOcupado(false) }
  }

  return (
    <div className="av">
      <span aria-hidden="true">🔔</span>
      <div>
        <strong>Activa los avisos en este celular</strong>
        <small>Te llega «¡Pedido listo!» aunque tengas la app cerrada.</small>
        {error && <small className="av-error">{error}</small>}
      </div>
      <button onClick={activar} disabled={ocupado}>{ocupado ? '…' : 'Activar'}</button>
    </div>
  )
}
