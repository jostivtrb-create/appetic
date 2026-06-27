import { useState } from 'react'

export default function AdminConfig({ local, onUpdate }) {
  const [abre, setAbre] = useState(local.horario?.abre || '11:00')
  const [cierra, setCierra] = useState(local.horario?.cierra || '22:00')
  const [domicilio, setDomicilio] = useState(local.domicilio?.activo !== false)
  const [recoger, setRecoger] = useState(local.recoger !== false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  async function guardar() {
    setGuardando(true)
    await onUpdate({
      horario: { ...(local.horario || {}), abre, cierra },
      domicilio: { ...(local.domicilio || {}), activo: domicilio },
      recoger,
    })
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1800)
  }

  return (
    <div className="ac">
      <section className="ac-sec">
        <h3>Horario de atención</h3>
        <p className="ac-hint">Fuera de este horario, los clientes ven el menú pero no pueden pedir.</p>
        <div className="ac-horas">
          <label>Abre<input type="time" value={abre} onChange={e => setAbre(e.target.value)} /></label>
          <label>Cierra<input type="time" value={cierra} onChange={e => setCierra(e.target.value)} /></label>
        </div>
      </section>

      <section className="ac-sec">
        <h3>Entrega</h3>
        <label className="ac-switch">
          <span>🛵 Domicilio disponible</span>
          <input type="checkbox" checked={domicilio} onChange={e => setDomicilio(e.target.checked)} />
        </label>
        <label className="ac-switch">
          <span>🏪 Recoger en el local</span>
          <input type="checkbox" checked={recoger} onChange={e => setRecoger(e.target.checked)} />
        </label>
        <p className="ac-hint">Las tarifas de domicilio y métodos de pago los configura Appetic contigo.</p>
      </section>

      <button className="btn btn-primary ac-guardar" onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : guardado ? 'Guardado ✓' : 'Guardar cambios'}
      </button>
    </div>
  )
}
