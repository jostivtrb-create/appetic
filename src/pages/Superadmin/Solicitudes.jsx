import { useEffect, useMemo, useState } from 'react'
import { cambiarEstadoSolicitud, listarSolicitudes, MOTIVOS_VISITA, recorridoUrls } from '../../services/solicitudes'
import { PAQUETES } from '../../utils/paquetes'
import { cop } from '../../utils/money'

// 📋 Solicitudes de cotización (guía «Propuesta web de Appetic»): lo que llega del formulario
// «Solicitar cotización formal» de switflysolutions.com/appetic. Las llenan los vendedores en la
// calle (con foto de la fachada, GPS y fotos de la carta y el logo) o dueños curiosos (solo datos).
// Aquí se ven, se contactan por WhatsApp y se mueven de estado: pendiente → enviada → cerrada
// (guía «Paquetes de Appetic» S5). Las COTIZACIONES por paquetes traen número (AP-0001), paquetes,
// total y el comentario del vendedor; «Enviar cotización» baja su PDF y abre el chat del cliente con
// el saludo (D27). Las viejas («nueva», «contactada») se leen como pendiente y enviada.
//
// La carta y el logo llegan como `archivos[]` (uno por petición a /api/solicitud-archivo: la carta
// puede ser un PDF o varias fotos) y se pintan agrupados por clave; `fotos.carta/logo` de la página
// vieja se siguen mostrando como siempre.
//
// También llegan las VISITAS (D21–D23): el vendedor pasó por un negocio y el dueño no pidió
// cotización; queda el local, la ubicación y el motivo. No tienen estados ni botones, pero sí
// cuentan en el bloque «Recorridos»: por fecha, cada vendedor con sus puntos del día (cotizaciones
// + visitas en orden de hora) y el link de Google Maps para ver por dónde pasó.
// En modo simulado (?super=1) muestra inventadas sin leer Firestore.

const FILTROS = [
  { id: 'pendiente', nombre: 'Pendientes' },
  { id: 'enviada', nombre: 'Enviadas' },
  { id: 'cerrada', nombre: 'Cerradas' },
  { id: 'visita', nombre: 'Visitas' },
  { id: 'todas', nombre: 'Todas' },
]
const ESTADOS = [
  { id: 'pendiente', nombre: 'Pendiente', emoji: '🕒' },
  { id: 'enviada', nombre: 'Enviada', emoji: '📤' },
  { id: 'cerrada', nombre: 'Cerrada', emoji: '✅' },
]
const TIPOS = { trailer: '🚚 Tráiler', local: '🏪 Local', restaurante: '🍽️ Restaurante', barberia: '💈 Barbería' }
// ✂️ BarberIA (guía «Propuesta de Legends» S8): llega por este mismo formulario con `producto: 'barberia'`.
const esBarberia = s => s.producto === 'barberia'
const nombreProducto = s => (esBarberia(s) ? 'BarberIA' : 'Appetic')
const BARBEROS = { '1-2': '1–2 barberos', '3-5': '3–5 barberos', '6-10': '6–10 barberos', 'mas-10': 'Más de 10 barberos' }
const SEDES = { 1: '1 sede', 2: '2 sedes', '3+': '3 sedes o más' }
const PLANES = {
  emprendedor: 'Plan Emprendedor', comerciante: 'Plan Comerciante', empresario: 'Plan Empresario',
  desarrollador: 'Plan Desarrollador', 'no-sabe': 'Plan: no sabe aún',
}
const FOTOS = [['lugar', 'Fachada'], ['carta', 'Carta'], ['logo', 'Logo']]
// Grupos de `archivos[]` (espejo de CLAVES en api/solicitud-archivo.js), en el orden en que se pintan.
const ARCHIVOS = [['carta', '📋 Carta'], ['logo', '🎨 Logo']]
const ZONA = 'America/Bogota'

// Timestamp de Firestore, Date o ISO → Date (o null).
const fechaDe = v => {
  if (!v) return null
  const d = v.toDate?.() ?? (v instanceof Date ? v : new Date(v))
  return Number.isNaN(d.getTime()) ? null : d
}
// Cuándo pasó de verdad: la hora del celular al llenar; si no vino, la del servidor.
const momentoDe = s => fechaDe(s.llenadaEn) || fechaDe(s.creadaEn)
// Date → 'YYYY-MM-DD' en Bogotá (el input type="date" usa este mismo formato).
const diaBogota = d => (d ? d.toLocaleDateString('en-CA', { timeZone: ZONA }) : '')
const horaBogota = d => (d ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: ZONA }) : '—')
// 'YYYY-MM-DD' → «mié, 4 de nov» para leerlo en la cabecera del recorrido.
const diaLegible = ymd => {
  const d = new Date(`${ymd}T12:00:00-05:00`)
  return Number.isNaN(d.getTime()) ? ymd : d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA })
}
// 1234567 → «1,2 MB»; menos de 1 MB → «830 KB».
const pesoLegible = bytes => {
  const b = Number(bytes) || 0
  return b >= 1048576
    ? `${(b / 1048576).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`
}
// `archivos[]` → [[clave, título, archivos de esa clave]] solo de las claves que traen algo.
const archivosPorClave = s => ARCHIVOS
  .map(([k, titulo]) => [k, titulo, (Array.isArray(s.archivos) ? s.archivos : []).filter(a => a?.clave === k && a.url)])
  .filter(([, , lista]) => lista.length > 0)
const esVisita = s => s.registro === 'visita' || s.estado === 'visita'
const VIEJOS = { nueva: 'pendiente', contactada: 'enviada' }
const estadoDe = s => (esVisita(s) ? 'visita' : (VIEJOS[s.estado] || s.estado || 'pendiente'))
const tieneUbicacion = s => !!s.ubicacion && Number.isFinite(Number(s.ubicacion.lat)) && Number.isFinite(Number(s.ubicacion.lng))

// El celular → link de WhatsApp con el saludo listo. Colombia: 10 dígitos → se antepone 57.
function linkWhatsApp(celular, local, visita, producto = 'Appetic') {
  let digitos = String(celular || '').replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length === 10) digitos = `57${digitos}`
  const texto = visita
    ? `Hola, soy de Swiftfly Solutions. Hace poco pasamos por «${local}» a contarles de ${producto}. ¿Te queda bien que hablemos ahora?`
    : `Hola, soy de Swiftfly Solutions. Recibimos tu solicitud de cotización de ${producto} para «${local}». ¿Te queda bien que hablemos ahora?`
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}

// 📤 El saludo de «Enviar cotización» (D27): mientras se descarga el PDF se va saludando, y se
// ofrece la reunión en persona.
function linkEnviarCotizacion(s) {
  let digitos = String(s.celular || '').replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length === 10) digitos = `57${digitos}`
  const nombre = String(s.dueno || '').trim().split(/\s+/)[0]
  const texto = `¡Hola${nombre ? ` ${nombre}` : ''}! 👋 Soy de Swiftfly Solutions. Te comparto la cotización ${s.numero} de Appetic para «${s.local}», con los paquetes que elegiste. 📄\n\nSi quieres, podemos reunirnos y explicarte todo el sistema en persona. ¿Qué día te queda bien?`
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}

// BarberIA no tiene PDF (el de Appetic es de paquetes): la cotización va completa en el mensaje.
function linkCotizacionBarberia(s) {
  let digitos = String(s.celular || '').replace(/\D/g, '')
  if (!digitos) return null
  if (digitos.length === 10) digitos = `57${digitos}`
  const nombre = String(s.dueno || '').trim().split(/\s+/)[0]
  const promo = s.promo ? `\n🎁 Promoción: ${s.promo}.` : ''
  const texto = `¡Hola${nombre ? ` ${nombre}` : ''}! 👋 Soy de Swiftfly Solutions. Te comparto la cotización ${s.numero} de BarberIA para «${s.local}». 💈\n\n✅ Todo incluido: reservas, agenda, caja, comisiones de barberos, inventario, reportes, varias sedes y el Asesor de Look IA.\n💰 ${cop(s.total)} al mes.${promo}\n📆 Si pagas 6 meses, pagas 5; si pagas 12, pagas 10.\n\nVálida hasta el ${s.venceDia}. Si quieres, nos reunimos y te mostramos la app en persona. ¿Qué día te queda bien?`
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}

// Los paquetes y el total de una cotización, a la vista en la tarjeta.
function Cotizacion({ s, onEnviar }) {
  const pqs = PAQUETES.filter(p => (s.paquetes || []).includes(p.id))
  const [enviando, setEnviando] = useState(false)
  const vencida = s.venceDia && s.venceDia < new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10)
  async function enviar() {
    if (enviando) return
    if (esBarberia(s)) {
      const wa = linkCotizacionBarberia(s)
      if (wa) { window.open(wa, '_blank', 'noopener'); onEnviar() }
      return
    }
    setEnviando(true)
    // La pestaña de WhatsApp se abre YA, en el toque (después de armar el PDF el navegador la bloquea).
    const wa = linkEnviarCotizacion(s)
    if (wa) window.open(wa, '_blank', 'noopener')
    try {
      const { descargarCotizacionPdf } = await import('../../services/cotizacionPdf')
      await descargarCotizacionPdf(s)
      onEnviar()
    } catch (e) {
      console.error('[cotización] no se armó el PDF:', e)
      alert('No se pudo armar el PDF. Intenta de nuevo.')
    } finally { setEnviando(false) }
  }
  return (
    <div className="sa-cot">
      <div className="sa-cot-pq">
        {esBarberia(s)
          ? <span className="sa-sol-chip">💈 BarberIA · todo incluido</span>
          : pqs.map(p => <span key={p.id} className="sa-sol-chip">{p.icono} {p.nombre}</span>)}
      </div>
      <div className="sa-cot-total">
        <span>Total al mes{s.promo ? ` · 🎁 ${s.promo}` : ''}</span>
        <b>{cop(s.total)}</b>
      </div>
      <small className={`sa-cot-vence${vencida ? ' vencida' : ''}`}>{vencida ? '⚠️ Venció' : 'Válida hasta'} el {s.venceDia}</small>
      <button type="button" className="sa-cot-enviar" disabled={enviando} onClick={enviar}>
        {enviando ? 'Armando el PDF…' : estadoDe(s) === 'pendiente' ? '📤 Enviar cotización' : '📤 Enviar otra vez'}
      </button>
      <small className="sa-sol-faint">{esBarberia(s) ? 'Abre el chat del cliente con la cotización escrita.' : 'Baja el PDF y abre el chat del cliente con el saludo: adjunta el PDF ahí.'}</small>
    </div>
  )
}

function Tarjeta({ s, onEstado, onCrearBarberia }) {
  const [abierta, setAbierta] = useState(false)
  const visita = esVisita(s)
  const fecha = momentoDe(s)
  const fotos = FOTOS.filter(([k]) => s.fotos?.[k])
  const grupos = archivosPorClave(s)
  const wa = linkWhatsApp(s.celular, s.local, visita, nombreProducto(s))
  const lugar = [s.ciudad, s.barrio].filter(Boolean).join(' · ')
  const estadoActual = ESTADOS.find(e => e.id === estadoDe(s)) || ESTADOS[0]
  const motivo = visita ? (MOTIVOS_VISITA[s.motivo] || s.motivo || 'Sin motivo') : ''

  return (
    <li className={`sa-sol-item sa-sol-item--${estadoDe(s)}`}>
      <button className="sa-sol-head" onClick={() => setAbierta(a => !a)} aria-expanded={abierta}>
        <div className="sa-sol-head-txt">
          <span className="sa-sol-origen">
            {s.origen === 'vendedor' ? <>🧑‍💼 Vendedor <b>{s.vendedor || '—'}</b></> : <>🏪 Dueño del negocio</>}
          </span>
          <strong className="sa-sol-local">{esBarberia(s) && <span className="sa-cot-num">💈 BarberIA</span>}{s.numero && <span className="sa-cot-num">{s.numero}</span>}{s.local || 'Sin nombre'}</strong>
          <span className="sa-sol-sub">
            {lugar || 'Sin ciudad'}
            {fecha && <> · {fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</>}
          </span>
        </div>
        {visita
          ? <span className="sa-sol-estado sa-sol-estado--visita">🚶 Visita</span>
          : <span className={`sa-sol-estado sa-sol-estado--${estadoActual.id}`}>{estadoActual.emoji} {estadoActual.nombre}</span>}
        <span className="sa-sol-chevron">{abierta ? '▲' : '▼'}</span>
      </button>

      {/* Visita: qué pasó, siempre a la vista. */}
      {visita && (
        <div className="sa-sol-motivo">
          <span className="sa-sol-motivo-chip">{motivo}</span>
          {s.motivoTexto && <span className="sa-sol-motivo-txt">{s.motivoTexto}</span>}
        </div>
      )}

      {/* Siempre a la mano: a quién llamar (en una visita, solo si dejaron algún dato). */}
      {(!visita || s.dueno || s.celular) && (
        <div className="sa-sol-contacto">
          <span>👤 {s.dueno || 'Dueño sin nombre'}</span>
          {wa
            ? <a className="sa-sol-wa" href={wa} target="_blank" rel="noopener noreferrer">💬 {s.celular}</a>
            : <span className="sa-sol-faint">Sin celular</span>}
        </div>
      )}

      {/* 🗒️ Lo que dijo el vendedor (D29), siempre a la vista. */}
      {s.comentarioVendedor && <p className="sa-cot-comentario">🗒️ {s.comentarioVendedor}</p>}

      {abierta && (
        <div className="sa-sol-body">
          {s.numero && <Cotizacion s={s} onEnviar={() => estadoDe(s) === 'pendiente' && onEstado(s.id, 'enviada')} />}
          {esBarberia(s) && !visita && onCrearBarberia && (
            <button type="button" className="sa-sol-crear-bi" onClick={() => onCrearBarberia(s)}>💈 Crear su barbería en BarberIA</button>
          )}
          {(s.tipo || s.plan || s.barberos || s.sedes) && (
            <div className="sa-sol-chips">
              {s.tipo && <span className="sa-sol-chip">{TIPOS[s.tipo] || s.tipo}</span>}
              {s.barberos && <span className="sa-sol-chip">✂️ {BARBEROS[s.barberos] || s.barberos}</span>}
              {s.sedes && <span className="sa-sol-chip">📍 {SEDES[s.sedes] || s.sedes}</span>}
              {s.plan && <span className="sa-sol-chip sa-sol-chip--plan">{PLANES[s.plan] || s.plan}</span>}
            </div>
          )}
          {s.notas && <p className="sa-sol-notas">{s.notas}</p>}

          <div className="sa-sol-ubi">
            {tieneUbicacion(s)
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
          {/* 📎 Carta (PDF o varias fotos) y logo subidos a /api/solicitud-archivo, por grupo. */}
          {grupos.map(([k, titulo, lista]) => (
            <div key={k} className="sa-sol-arch">
              <span className="sa-sol-arch-titulo">{titulo} <small>{lista.length}</small></span>
              <div className="sa-sol-arch-lista">
                {lista.map((a, i) => a.tipo === 'pdf'
                  ? (
                    <a key={a.url} className="sa-sol-pdf" href={a.url} target="_blank" rel="noopener noreferrer" title="Abrir el PDF">
                      <span className="sa-sol-pdf-ico">📄</span>
                      <span className="sa-sol-pdf-txt">
                        <strong>{a.nombre || `${k}-${i + 1}.pdf`}</strong>
                        <small>PDF · {pesoLegible(a.bytes)}</small>
                      </span>
                    </a>
                  )
                  : (
                    <a key={a.url} className="sa-sol-foto" href={a.url} target="_blank" rel="noopener noreferrer" title={a.nombre ? `Abrir ${a.nombre}` : 'Abrir la foto'}>
                      <img src={a.url} alt={a.nombre || titulo} loading="lazy" />
                      <small>{pesoLegible(a.bytes)}</small>
                    </a>
                  ))}
              </div>
            </div>
          ))}
          {s.fotosFallidas?.length > 0 && (
            <p className="sa-sol-faint">⚠️ No llegaron: {s.fotosFallidas.map(k => (FOTOS.find(f => f[0] === k)?.[1] || k).toLowerCase()).join(', ')}.</p>
          )}

          {!visita && (
            <div className="sa-sol-estados" role="group" aria-label="Estado de la solicitud">
              {ESTADOS.map(e => (
                <button
                  key={e.id}
                  className={`sa-sol-estado-btn ${estadoDe(s) === e.id ? 'on' : ''}`}
                  disabled={estadoDe(s) === e.id || s.guardando}
                  onClick={() => onEstado(s.id, e.id)}
                >{e.emoji} {e.nombre}</button>
              ))}
            </div>
          )}
          {s.errorEstado && <p className="sa-sol-error">No se pudo guardar el estado. Intenta de nuevo.</p>}
        </div>
      )}
    </li>
  )
}

// 🗺️ Recorridos: por fecha, cada vendedor con sus puntos del día (cotizaciones + visitas con
// ubicación, en orden de hora) y el link de Google Maps con la ruta. Más de 10 puntos → un link por tramo.
function Recorridos({ items }) {
  const [dia, setDia] = useState(() => diaBogota(new Date()))
  const [abierto, setAbierto] = useState(null) // vendedor expandido

  const vendedores = useMemo(() => {
    const porVendedor = new Map()
    for (const s of items) {
      if (s.origen !== 'vendedor' || !tieneUbicacion(s)) continue
      const cuando = momentoDe(s)
      if (!cuando || diaBogota(cuando) !== dia) continue
      const nombre = s.vendedor || 'Sin nombre'
      if (!porVendedor.has(nombre)) porVendedor.set(nombre, [])
      porVendedor.get(nombre).push({ ...s, cuando })
    }
    return [...porVendedor.entries()]
      .map(([nombre, puntos]) => {
        puntos.sort((a, b) => a.cuando - b.cuando)
        return {
          nombre, puntos,
          cotizaciones: puntos.filter(p => !esVisita(p)).length,
          visitas: puntos.filter(esVisita).length,
          urls: recorridoUrls(puntos.map(p => p.ubicacion)),
        }
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [items, dia])

  return (
    <div className="sa-sol-rec">
      <div className="sa-sol-rec-cab">
        <strong>🗺️ Recorridos</strong>
        <label className="sa-sol-rec-fecha">
          <span>Fecha</span>
          <input type="date" value={dia} max={diaBogota(new Date())} onChange={e => { setDia(e.target.value); setAbierto(null) }} />
        </label>
      </div>

      {vendedores.length === 0
        ? <p className="sa-sol-rec-vacio">Sin visitas con ubicación {dia === diaBogota(new Date()) ? 'hoy' : `el ${diaLegible(dia)}`}.</p>
        : (
          <ul className="sa-sol-rec-lista">
            {vendedores.map(v => {
              const exp = abierto === v.nombre
              const primera = v.puntos[0].cuando, ultima = v.puntos[v.puntos.length - 1].cuando
              return (
                <li key={v.nombre} className="sa-sol-rec-item">
                  <button className="sa-sol-rec-head" onClick={() => setAbierto(exp ? null : v.nombre)} aria-expanded={exp}>
                    <div className="sa-sol-rec-txt">
                      <strong>🧑‍💼 {v.nombre}</strong>
                      <small>
                        {v.puntos.length} {v.puntos.length === 1 ? 'punto' : 'puntos'}
                        {' · '}{v.cotizaciones} {v.cotizaciones === 1 ? 'cotización' : 'cotizaciones'}
                        {' · '}{v.visitas} {v.visitas === 1 ? 'visita' : 'visitas'}
                        {' · '}{horaBogota(primera)}{v.puntos.length > 1 && <> → {horaBogota(ultima)}</>}
                      </small>
                    </div>
                    <span className="sa-sol-chevron">{exp ? '▲' : '▼'}</span>
                  </button>
                  <div className="sa-sol-rec-links">
                    {v.urls.map((u, i) => (
                      <a key={u} className="sa-sol-rec-btn" href={u} target="_blank" rel="noopener noreferrer">
                        {v.urls.length === 1 ? '🗺️ Ver recorrido' : `🗺️ Tramo ${i + 1}`}
                      </a>
                    ))}
                  </div>
                  {exp && (
                    <ol className="sa-sol-rec-puntos">
                      {v.puntos.map(p => (
                        <li key={p.id}>
                          <span className="sa-sol-rec-hora">{horaBogota(p.cuando)}</span>
                          <span className="sa-sol-rec-local">{p.local || 'Sin nombre'}</span>
                          <span className={`sa-sol-rec-tipo ${esVisita(p) ? 'visita' : 'cotizacion'}`}>
                            {esVisita(p) ? `🚶 ${MOTIVOS_VISITA[p.motivo] || p.motivo || 'Visita'}` : '📋 Cotización'}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              )
            })}
          </ul>
        )}
    </div>
  )
}

export default function Solicitudes({ simulado = false, onCrearBarberia }) {
  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [items, setItems] = useState([])
  const [filtro, setFiltro] = useState('pendiente')

  useEffect(() => {
    let activo = true
    ;(simulado ? import('./superSimulado').then(m => m.solicitudesSimuladas()) : listarSolicitudes())
      .then(ls => { if (activo) { setItems(ls); setEstado('ok') } })
      .catch(e => { console.error('[solicitudes] no se pudieron cargar:', e); if (activo) setEstado('error') })
    return () => { activo = false }
  }, [simulado])

  const nuevas = useMemo(() => items.filter(s => estadoDe(s) === 'pendiente').length, [items])
  const visitasHoy = useMemo(() => {
    const hoy = diaBogota(new Date())
    return items.filter(s => esVisita(s) && diaBogota(momentoDe(s)) === hoy).length
  }, [items])
  const visibles = useMemo(
    () => (filtro === 'todas' ? items : items.filter(s => estadoDe(s) === filtro)),
    [items, filtro],
  )
  const cuenta = id => (id === 'todas' ? items.length : items.filter(s => estadoDe(s) === id).length)

  // Cambio de estado OPTIMISTA: se pinta ya; si Firestore falla, vuelve al anterior y avisa.
  async function cambiarEstado(id, nuevo) {
    const anterior = items.find(s => s.id === id)?.estado || 'pendiente'
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
        {estado === 'ok' && visitasHoy > 0 && (
          <span className="sa-sol-contador sa-sol-contador--visitas" title="Visitas de hoy">🚶 {visitasHoy} {visitasHoy === 1 ? 'visita hoy' : 'visitas hoy'}</span>
        )}
        {nuevas > 0 && <span className="sa-sol-contador" aria-label={`${nuevas} nuevas`}>{nuevas}</span>}
      </div>

      {estado === 'ok' && <Recorridos items={items} />}

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
            : filtro === 'pendiente' ? '🎉 No hay cotizaciones pendientes. ¡Todo al día!'
              : filtro === 'visita' ? 'Ningún vendedor ha registrado visitas todavía.'
                : 'No hay solicitudes en este estado.'}
        </p>
      )}
      {estado === 'ok' && visibles.length > 0 && (
        <ul className="sa-sol-lista">
          {visibles.map(s => <Tarjeta key={s.id} s={s} onEstado={cambiarEstado} onCrearBarberia={onCrearBarberia} />)}
        </ul>
      )}
    </section>
  )
}
