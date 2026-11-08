import { useEffect, useState } from 'react'
import { puedeInvitar, suscribirse, ahoraNo } from '../../services/avisosClientes'
import './InvitarAvisos.css'

// 🔔 «¿Te avisamos de las promociones?» (guía «Paquetes de Appetic» D34). Sale después del primer
// pedido o al marcar un local de favorito, nunca apenas entra (casi todos dirían que no). Cualquier
// pantalla la dispara con:
//   window.dispatchEvent(new CustomEvent('appetic:invitar-avisos', { detail: { local, motivo } }))
// Si el navegador no puede (iPhone sin instalar la app, D18) o ya dijo que no, ni se muestra.
export function invitarAvisos(local, motivo) {
  if (!local?.id || local.esDemo) return
  window.dispatchEvent(new CustomEvent('appetic:invitar-avisos', { detail: { local, motivo } }))
}

export default function InvitarAvisos() {
  const [oferta, setOferta] = useState(null) // { local, motivo }
  const [estado, setEstado] = useState('')   // '' | 'pidiendo' | 'listo' | 'error'
  useEffect(() => {
    const f = async e => {
      const { local, motivo } = e.detail || {}
      if (await puedeInvitar(local?.id)) { setOferta({ local, motivo }); setEstado('') }
    }
    window.addEventListener('appetic:invitar-avisos', f)
    return () => window.removeEventListener('appetic:invitar-avisos', f)
  }, [])
  if (!oferta) return null
  const { local, motivo } = oferta
  const cerrar = () => setOferta(null)
  async function si() {
    setEstado('pidiendo')
    try { await suscribirse(local.id, motivo); setEstado('listo'); setTimeout(cerrar, 2200) }
    catch { setEstado('error'); setTimeout(cerrar, 2600) }
  }
  return (
    <div className="ia" role="dialog" aria-label={`Avisos de ${local.nombre}`}>
      <span className="ia-logo" aria-hidden="true">{local.icono || local.logo ? <img src={local.icono || local.logo} alt="" /> : '🔔'}</span>
      {estado === 'listo' ? <p className="ia-txt"><b>¡Listo! 🔔</b>{local.nombre} te avisará de sus promociones.</p>
        : estado === 'error' ? <p className="ia-txt"><b>No se activaron</b>Puedes permitirlos después en la configuración del navegador.</p>
          : <>
            <p className="ia-txt"><b>¿Te avisamos de las promociones de {local.nombre}?</b>Máximo 3 avisos por semana. Nada de spam.</p>
            <div className="ia-acc">
              <button type="button" className="ia-no" onClick={() => { ahoraNo(local.id); cerrar() }}>Ahora no</button>
              <button type="button" className="ia-si" disabled={estado === 'pidiendo'} onClick={si}>{estado === 'pidiendo' ? 'Activando…' : 'Sí, avísenme'}</button>
            </div>
          </>}
    </div>
  )
}
