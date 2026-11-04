import { useEffect, useMemo, useState } from 'react'
import { cambiarEstadoSolicitud, listarSolicitudes } from '../../services/solicitudes'

// 📋 Solicitudes de cotización (guía «Propuesta web de Appetic»): lo que llega del formulario
// «Solicitar cotización formal» de switflysolutions.com/appetic. Las llenan los vendedores en la
// calle (con foto de la fachada, GPS y fotos de la carta y el logo) o dueños curiosos (solo datos).
// Aquí se ven, se contactan por WhatsApp y se mueven de estado: nueva → contactada → cerrada.
// En modo simulado (?super=1) muestra dos inventadas sin leer Firestore.

const FILTROS = [
  { id: 'nueva', nombre: 'Nuevas' },
  { id: 'contactada', nombre: 'Contactadas' },
  { id: 'cerrada', nombre: 'Cerradas' },
  { id: 'todas', nombre: 'Todas' },
]
const ESTADOS = [
  { id: 'nueva', nombre: 'Nueva', emoji: '🆕' },
  { id: 'contactada', nombre: 'Contactada', emoji: '📞' },
  { id: 'cerrada', nombre: 'Cerrada', emoji: '✅' },
]
const TIPOS = { trailer: '🚚 Tráiler', local: '🏪 Local', restaurante: '🍽️ Restaurante' }
const PLANES = {
  emprendedor: 'Plan Emprendedor', comerciante: 'Plan Comerciante', empresario: 'Plan Empresario',
  desarrollador: 'Plan Desarrollador', 'no-sabe': 'Plan: no sabe aún',
}
const FOTOS = [['lugar', 'Fachada'], ['carta', 'Carta'], ['logo', 'Logo']]

// Timestamp de Firestore, Date o ISO → Date (o null).
const fechaDe = v => {
  if (!v) return null
  const d = v.toDate?.() ?? (v instanceof Date ? v : new Date(v))
  return Number.isNaN(d.getTime()) ? null : d
}

// El celular → link de WhatsApp con el saludo listo. Colombia: 10 dígitos → se antepone 57.
function linkWhatsApp(celular, local) {
  let digitos = String(celular || '').replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length === 10) digitos = `57${digitos}`
  const texto = `Hola, soy de Swiftfly Solutions. Recibimos tu solicitud de cotización de Appetic para «${local}». ¿Te queda bien que hablemos ahora?`
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}

function Tarjeta({ s, onEstado }) {
  const [abierta, setAbierta] = useState(false)
  const fecha = fechaDe(s.llenadaEn) || fechaDe(s.creadaEn)
  const fotos = FOTOS.filter(([k]) => s.fotos?.[k])
  const wa = linkWhatsApp(s.celular, s.local)
  const lugar = [s.ciudad, s.barrio].filter(Boolean).join(' · ')
  const estadoActual = ESTADOS.find(e => e.id === s.estado) || ESTADOS[0]

  return (
    <li className={`sa-sol-item sa-sol-item--${s.estado || 'nueva'}`}>
      <button className="sa-sol-head" onClick={() => setAbierta(a => !a)} aria-expanded={abierta}>
        <div className="sa-sol-head-txt">
          <span className="sa-sol-origen">
            {s.origen === 'vendedor' ? <>🧑‍💼 Vendedor <b>{s.vendedor || '—'}</b></> : <>🏪 Dueño del negocio</>}
          </span>
          <strong className="sa-sol-local">{s.local || 'Sin nombre'}</strong>
          <span className="sa-sol-sub">
            {lugar || 'Sin ciudad'}
            {fecha && <> · {fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</>}
          </span>
        </div>
        <span className={`sa-sol-estado sa-sol-estado--${estadoActual.id}`}>{estadoActual.emoji} {estadoActual.nombre}</span>
        <span className="sa-sol-chevron">{abierta ? '▲' : '▼'}</span>
      </button>

      {/* Siempre a la mano: a quién llamar. */}
      <div className="sa-sol-contacto">
        <span>👤 {s.dueno || 'Dueño sin nombre'}</span>
        {wa
          ? <a className="sa-sol-wa" href={wa} target="_blank" rel="noopener noreferrer">💬 {s.celular}</a>
          : <span className="sa-sol-faint">Sin celular</span>}
      </div>

      {abierta && (
        <div className="sa-sol-body">
          {(s.tipo || s.plan) && (
            <div className="sa-sol-chips">
              {s.tipo && <span className="sa-sol-chip">{TIPOS[s.tipo] || s.tipo}</span>}
              {s.plan && <span className="sa-sol-chip sa-sol-chip--plan">{PLANES[s.plan] || s.plan}</span>}
            </div>
          )}
          {s.notas && <p className="sa-sol-notas">{s.notas}</p>}

          <div className="sa-sol-ubi">
            {s.ubicacion && Number.isFinite(Number(s.ubicacion.lat)) && Number.isFinite(Number(s.ubicacion.lng))
              ? (
                <a href={`https://www.google.com/maps?q=${s.ubicacion.lat},${s.ubicacion.lng}`} target="_blank" rel="noopener noreferrer">
                  📍 Ver en Google Maps
                  <small> (±{Math.round(Number(s.ubicacion.precision) || 0)} m)</small>
                </a>
              )
              : <span className="sa-sol-faint">📍 Sin ubicación</span>}
          </div>

          {fotos.length > 0 && (
            <div className="sa-sol-fotos">
              {fotos.map(([k, nombre]) => (
                <a key={k} className="sa-sol-foto" href={s.fotos[k]} target="_blank" rel="noopener noreferrer" title={`Abrir ${nombre.toLowerCase()}`}>
                  <img src={s.fotos[k]} alt={nombre} loading="lazy" />
                  <small>{nombre}</small>
                </a>
              ))}
            </div>
          )}
          {s.fotosFallidas?.length > 0 && (
            <p className="sa-sol-faint">⚠️ No llegaron: {s.fotosFallidas.map(k => (FOTOS.find(f => f[0] === k)?.[1] || k).toLowerCase()).join(', ')}.</p>
          )}

          <div className="sa-sol-estados" role="group" aria-label="Estado de la solicitud">
            {ESTADOS.map(e => (
              <button
                key={e.id}
                className={`sa-sol-estado-btn ${s.estado === e.id ? 'on' : ''}`}
                disabled={s.estado === e.id || s.guardando}
                onClick={() => onEstado(s.id, e.id)}
              >{e.emoji} {e.nombre}</button>
            ))}
          </div>
          {s.errorEstado && <p className="sa-sol-error">No se pudo guardar el estado. Intenta de nuevo.</p>}
        </div>
      )}
    </li>
  )
}

export default function Solicitudes({ simulado = false }) {
  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [items, setItems] = useState([])
  const [filtro, setFiltro] = useState('nueva')

  useEffect(() => {
    let activo = true
    ;(simulado ? import('./superSimulado').then(m => m.solicitudesSimuladas()) : listarSolicitudes())
      .then(ls => { if (activo) { setItems(ls); setEstado('ok') } })
      .catch(e => { console.error('[solicitudes] no se pudieron cargar:', e); if (activo) setEstado('error') })
    return () => { activo = false }
  }, [simulado])

  const nuevas = useMemo(() => items.filter(s => (s.estado || 'nueva') === 'nueva').length, [items])
  const visibles = useMemo(
    () => (filtro === 'todas' ? items : items.filter(s => (s.estado || 'nueva') === filtro)),
    [items, filtro],
  )
  const cuenta = id => (id === 'todas' ? items.length : items.filter(s => (s.estado || 'nueva') === id).length)

  // Cambio de estado OPTIMISTA: se pinta ya; si Firestore falla, vuelve al anterior y avisa.
  async function cambiarEstado(id, nuevo) {
    const anterior = items.find(s => s.id === id)?.estado || 'nueva'
    setItems(ls => ls.map(s => s.id === id ? { ...s, estado: nuevo, guardando: true, errorEstado: false } : s))
    try {
      if (!simulado) await cambiarEstadoSolicitud(id, nuevo)
      setItems(ls => ls.map(s => s.id === id ? { ...s, guardando: false, estadoEn: new Date() } : s))
    } catch (e) {
      console.error('[solicitudes] no se pudo cambiar el estado:', e)
      setItems(ls => ls.map(s => s.id === id ? { ...s, estado: anterior, guardando: false, errorEstado: true } : s))
    }
  }

  return (
    <section className="sa-sol" id="solicitudes">
      <div className="sa-sol-cab">
        <span className="sa-sol-ico">📋</span>
        <div className="sa-sol-cab-txt">
          <strong>Solicitudes de cotización</strong>
          <small>
            {estado === 'cargando' ? 'Cargando…'
              : estado === 'error' ? 'No se pudieron cargar.'
                : nuevas === 0 ? 'Ninguna nueva por contactar.'
                  : `${nuevas} ${nuevas === 1 ? 'nueva por contactar' : 'nuevas por contactar'}`}
          </small>
        </div>
        {nuevas > 0 && <span className="sa-sol-contador" aria-label={`${nuevas} nuevas`}>{nuevas}</span>}
      </div>

      <div className="sa-sol-filtros" role="tablist">
        {FILTROS.map(f => (
          <button key={f.id} role="tab" aria-selected={filtro === f.id}
            className={`sa-sol-filtro ${filtro === f.id ? 'on' : ''}`} onClick={() => setFiltro(f.id)}>
            {f.nombre}{estado === 'ok' && <span className="sa-sol-filtro-n">{cuenta(f.id)}</span>}
          </button>
        ))}
      </div>

      {estado === 'cargando' && <div className="sa-sol-skel" />}
      {estado === 'error' && <p className="sa-sol-vacio">📡 No se pudieron cargar las solicitudes. Revisa la conexión y recarga.</p>}
      {estado === 'ok' && visibles.length === 0 && (
        <p className="sa-sol-vacio">
          {items.length === 0
            ? '🌱 Todavía no ha llegado ninguna solicitud. Cuando alguien llene el formulario de la propuesta, aparece aquí.'
            : filtro === 'nueva' ? '🎉 Nada nuevo por contactar. ¡Todo al día!' : 'No hay solicitudes en este estado.'}
        </p>
      )}
      {estado === 'ok' && visibles.length > 0 && (
        <ul className="sa-sol-lista">
          {visibles.map(s => <Tarjeta key={s.id} s={s} onEstado={cambiarEstado} />)}
        </ul>
      )}
    </section>
  )
}
