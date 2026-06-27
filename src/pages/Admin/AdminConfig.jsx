import { useMemo, useState } from 'react'

// Genera los intervalos de 0.5 km hasta el máximo: ['0.5','1.0',...,'maxKm']
function intervalosHasta(maxKm) {
  const out = []
  const max = Number(maxKm) || 0
  for (let k = 0.5; k <= max + 1e-9; k += 0.5) out.push(k.toFixed(1))
  return out
}

export default function AdminConfig({ local, onUpdate }) {
  const [abre, setAbre] = useState(local.horario?.abre || '11:00')
  const [cierra, setCierra] = useState(local.horario?.cierra || '22:00')
  const [domicilio, setDomicilio] = useState(local.domicilio?.activo !== false)
  const [recoger, setRecoger] = useState(local.recoger !== false)
  const [maxKm, setMaxKm] = useState(String(local.domicilio?.maxKm || 5))
  const [tarifas, setTarifas] = useState(() => {
    const base = local.domicilio?.tarifas || {}
    const limpio = {}
    for (const k of Object.keys(base)) limpio[k] = String(base[k] ?? '')
    return limpio
  })
  const [ubicacion, setUbicacion] = useState(local.ubicacion || null)
  const [ubicEstado, setUbicEstado] = useState('idle') // idle | cargando | ok | error
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const keys = useMemo(() => intervalosHasta(maxKm), [maxKm])

  function setTarifa(key, valor) {
    setTarifas(t => ({ ...t, [key]: valor.replace(/\D/g, '') }))
  }

  // Copia la tarifa de un intervalo hacia abajo (rellena los siguientes vacíos).
  function rellenarDesde(key) {
    const valor = tarifas[key]
    if (!valor) return
    setTarifas(t => {
      const next = { ...t }
      let copiar = false
      for (const k of keys) {
        if (k === key) { copiar = true; continue }
        if (copiar && !next[k]) next[k] = valor
      }
      return next
    })
  }

  function capturarUbicacion() {
    if (!navigator.geolocation) { setUbicEstado('error'); return }
    setUbicEstado('cargando')
    navigator.geolocation.getCurrentPosition(
      pos => { setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setUbicEstado('ok') },
      () => setUbicEstado('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function guardar() {
    setGuardando(true)
    const tarifasLimpias = {}
    for (const k of keys) tarifasLimpias[k] = Number(tarifas[k]) || 0
    const cambios = {
      horario: { ...(local.horario || {}), abre, cierra },
      domicilio: {
        ...(local.domicilio || {}),
        activo: domicilio,
        maxKm: Number(maxKm) || 0,
        tarifas: tarifasLimpias,
      },
      recoger,
    }
    if (ubicacion) cambios.ubicacion = ubicacion
    await onUpdate(cambios)
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
      </section>

      {/* Domicilio por radio: ubicación + tarifas por distancia */}
      {domicilio && (
        <section className="ac-sec">
          <h3>Domicilio por distancia</h3>
          <p className="ac-hint">
            Pon la ubicación de tu local y el precio del domicilio según qué tan lejos esté el cliente.
            Se cobra por tramos de 0,5 km.
          </p>

          {/* Ubicación del local */}
          <div className="ac-ubic">
            <button className="ac-ubic-btn" onClick={capturarUbicacion} disabled={ubicEstado === 'cargando'}>
              📍 {ubicEstado === 'cargando' ? 'Obteniendo…' : ubicacion ? 'Actualizar ubicación del local' : 'Usar mi ubicación actual'}
            </button>
            {ubicacion && <span className="ac-ubic-ok">Ubicación lista ✓</span>}
            {ubicEstado === 'error' && <span className="ac-ubic-err">No se pudo obtener. Activa el permiso de ubicación.</span>}
            {!ubicacion && ubicEstado !== 'error' && <span className="ac-ubic-warn">⚠️ Sin ubicación no se puede calcular el domicilio.</span>}
          </div>

          {/* Distancia máxima */}
          <label className="ac-maxkm">
            Distancia máxima de entrega (km)
            <input
              type="number" inputMode="decimal" step="0.5" min="0.5"
              value={maxKm}
              onChange={e => setMaxKm(e.target.value)}
            />
          </label>

          {/* Tarifas por tramo */}
          <div className="ac-tarifas">
            <div className="ac-tarifas-head">
              <span>Hasta…</span><span>Precio del domicilio</span>
            </div>
            {keys.map(k => (
              <div key={k} className="ac-tarifa-row">
                <span className="ac-tarifa-km">{k} km</span>
                <div className="ac-tarifa-input">
                  <span className="ac-tarifa-cur">$</span>
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={tarifas[k] || ''}
                    onChange={e => setTarifa(k, e.target.value)}
                  />
                  <button className="ac-tarifa-fill" onClick={() => rellenarDesde(k)} title="Copiar este precio a los tramos siguientes vacíos">↓</button>
                </div>
              </div>
            ))}
            {keys.length === 0 && <p className="ac-hint">Sube la distancia máxima para definir tramos.</p>}
          </div>
          <p className="ac-hint">El botón ↓ copia ese precio a los tramos de abajo que estén vacíos.</p>
        </section>
      )}

      <button className="btn btn-primary ac-guardar" onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : guardado ? 'Guardado ✓' : 'Guardar cambios'}
      </button>
    </div>
  )
}
