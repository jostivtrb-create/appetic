import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { turnosDe } from '../../services/horarioSemana'
import { DIAS, PRESETS, turnoTxt, turnoCorto, turnoValido, horasSemana, hoyDia, limpiarSemana } from '../../utils/horarioSemana'
import { coloresComanda } from './comandaUtils'
import { conTope } from '../../utils/conTope'
import './Caja.css'
import './Horario.css'

// 🗓️ HORARIO DE LA SEMANA (guía «Paquetes de Appetic» D10, paquete Contabilidad).
//   <HorarioEditor> Cuentas → Horario: el dueño arma la semana de su gente (la de Nómina).
//   <HorarioEquipo> /admin/horario: el equipo la ve, con «Hoy trabajan» arriba.
// Cada persona es una tarjeta con sus 7 días en fila: cabe igual en el celular y en el PC.

function Semana({ personas, hoy, onCelda }) {
  return (
    <div className="hr-lista">
      {personas.map(p => (
        <article key={p.id} className="pv-card hr-persona">
          <header><b>{p.nombre}</b><small>{Math.round(horasSemana(p))} h a la semana</small></header>
          <div className="hr-dias">
            {DIAS.map(d => {
              const t = p.dias?.[d.id]
              const Tag = onCelda ? 'button' : 'div'
              return (
                <Tag key={d.id} type={onCelda ? 'button' : undefined} className={`hr-dia${turnoValido(t) ? ' trabaja' : ''}${d.id === hoy ? ' hoy' : ''}`}
                  onClick={onCelda ? () => onCelda(p, d) : undefined} aria-label={`${p.nombre}, ${d.largo}: ${turnoTxt(t)}`}>
                  <small>{d.corto}</small>
                  <b>{turnoCorto(t)}</b>
                </Tag>
              )
            })}
          </div>
        </article>
      ))}
    </div>
  )
}

function HoyTrabajan({ personas, hoy }) {
  const hoyLista = personas.filter(p => turnoValido(p.dias?.[hoy]))
  const dia = DIAS.find(d => d.id === hoy)
  return (
    <div className="pv-card hr-hoy">
      <h3>Hoy, {dia.largo.toLowerCase()}, trabajan</h3>
      {hoyLista.length
        ? <ul>{hoyLista.sort((a, b) => a.dias[hoy].de.localeCompare(b.dias[hoy].de)).map(p => <li key={p.id}><b>{p.nombre}</b><span>{turnoTxt(p.dias[hoy])}</span></li>)}</ul>
        : <p className="pv-vacio">Nadie tiene turno hoy.</p>}
    </div>
  )
}

// ───────────── El dueño: Cuentas → Horario ─────────────
export function HorarioEditor({ local, api, demo, usuario }) {
  const tapi = useMemo(() => turnosDe(local.id, { demo }), [local.id, demo])
  const [gente, setGente] = useState(null)
  const [guardada, setGuardada] = useState(null)
  const [semana, setSemana] = useState(null)
  const [editando, setEditando] = useState(null) // { persona, dia }
  const [estado, setEstado] = useState('')
  useEffect(() => api.escucharTrabajadores(setGente, () => setGente([])), [api])
  useEffect(() => tapi.escuchar(setGuardada, () => setGuardada({ personas: [] })), [tapi])
  // La semana guardada + la gente activa de Nómina que todavía no tiene turnos.
  useEffect(() => {
    if (!gente || !guardada || semana) return
    const activos = gente.filter(t => t.activo !== false)
    const porId = Object.fromEntries((guardada.personas || []).map(p => [p.id, p]))
    setSemana(activos.map(t => ({ id: t.id, nombre: t.nombre, dias: porId[t.id]?.dias || {} })))
  }, [gente, guardada, semana])
  const hoy = hoyDia()
  // Se compara ya limpio (un día sin tocar y uno de descanso valen lo mismo: null).
  const norm = l => JSON.stringify(limpiarSemana(l).map(p => [p.id, p.dias]))
  const cambiada = semana && norm(semana) !== norm(semana.map(p => ({ ...p, dias: (guardada?.personas || []).find(x => x.id === p.id)?.dias || {} })))

  function poner(personaId, dias, turno) {
    setSemana(s => s.map(p => (p.id === personaId ? { ...p, dias: { ...p.dias, ...Object.fromEntries(dias.map(d => [d, turno])) } } : p)))
    setEstado('')
  }
  async function guardar() {
    setEstado('guardando')
    try { await conTope(tapi.guardar(semana, { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }), 12000); setEstado('ok') }
    catch { setEstado('error') }
  }

  if (!semana) return <div className="pv-panel"><p className="pv-vacio">Cargando…</p></div>
  return (
    <div className="pv-panel">
      <p className="pv-nota">La semana de tu gente. Toca un día para ponerle el turno o dejarlo de descanso. Tu equipo lo ve en su panel.</p>
      {!semana.length
        ? <p className="pv-vacio">Primero agrega a tu gente en la pestaña 👥 Nómina.</p>
        : <>
          <HoyTrabajan personas={semana} hoy={hoy} />
          <Semana personas={semana} hoy={hoy} onCelda={(persona, dia) => setEditando({ persona, dia })} />
          <div className="hr-guardar">
            {estado === 'ok' && !cambiada && <span className="pv-ok">✓ Guardado</span>}
            {estado === 'error' && <span className="pv-error">No se pudo guardar. Revisa el internet.</span>}
            <button type="button" className="pv-cobrar" disabled={!cambiada || estado === 'guardando'} onClick={guardar}>
              {estado === 'guardando' ? 'Guardando…' : cambiada ? 'Guardar horario' : 'Horario al día'}
            </button>
          </div>
        </>}
      {editando && <TurnoHoja local={local} {...editando} onCerrar={() => setEditando(null)}
        onPoner={(dias, turno) => { poner(editando.persona.id, dias, turno); setEditando(null) }} />}
    </div>
  )
}

function TurnoHoja({ local, persona, dia, onPoner, onCerrar }) {
  const actual = persona.dias?.[dia.id]
  const [de, setDe] = useState(actual?.de || '08:00')
  const [a, setA] = useState(actual?.a || '16:00')
  const [alcance, setAlcance] = useState('dia') // dia | semana | lunvie
  const dias = alcance === 'semana' ? DIAS.map(d => d.id) : alcance === 'lunvie' ? ['lun', 'mar', 'mie', 'jue', 'vie'] : [dia.id]
  const valido = turnoValido({ de, a })
  return createPortal(
    <div className="pv-hoja-fondo centro" style={coloresComanda(local).vars} onClick={onCerrar}>
      <div className="pv-hoja hr-hoja" role="dialog" aria-modal="true" aria-label={`Turno de ${persona.nombre}`} onClick={e => e.stopPropagation()}>
        <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={onCerrar}>✕</button>
        <h2>{persona.nombre} · {dia.largo}</h2>
        <div className="hr-presets">
          {PRESETS.map(p => <button type="button" key={p.nombre} className={de === p.de && a === p.a ? 'on' : ''} onClick={() => { setDe(p.de); setA(p.a) }}>{p.nombre}<small>{turnoTxt(p)}</small></button>)}
        </div>
        <div className="hr-horas">
          <label>Entra<input type="time" value={de} onChange={e => setDe(e.target.value)} /></label>
          <label>Sale<input type="time" value={a} onChange={e => setA(e.target.value)} /></label>
        </div>
        <div className="hr-alcance" role="radiogroup" aria-label="A qué días">
          {[['dia', `Solo el ${dia.largo.toLowerCase()}`], ['lunvie', 'Lunes a viernes'], ['semana', 'Toda la semana']].map(([id, t]) => (
            <button type="button" key={id} role="radio" aria-checked={alcance === id} className={alcance === id ? 'on' : ''} onClick={() => setAlcance(id)}>{t}</button>
          ))}
        </div>
        <div className="pv-eliminar-acc">
          <button type="button" className="pv-link" onClick={() => onPoner(dias, null)}>😴 {dias.length > 1 ? 'Descansa esos días' : 'Descansa'}</button>
          <button type="button" className="pv-cobrar hr-poner" disabled={!valido} onClick={() => onPoner(dias, { de, a })}>Poner {turnoTxt({ de, a })}</button>
        </div>
      </div>
    </div>, document.body)
}

// ───────────── El equipo: /admin/horario ─────────────
export function HorarioEquipo({ local, demo }) {
  const tapi = useMemo(() => turnosDe(local.id, { demo }), [local.id, demo])
  const [semana, setSemana] = useState(null)
  const [error, setError] = useState(false)
  useEffect(() => tapi.escuchar(s => setSemana(s.personas || []), () => setError(true)), [tapi])
  const hoy = hoyDia()
  return (
    <div className="pv hr" style={coloresComanda(local).vars}>
      <header className="pv-top"><div className="pv-marca"><span className="pv-marca-logo" aria-hidden="true">🗓️</span><div><b>{local.nombre}</b><small>Horario de la semana</small></div></div></header>
      <div className="pv-panel">
        {error ? <p className="pv-vacio">No se pudo cargar el horario.</p>
          : semana === null ? <p className="pv-vacio">Cargando…</p>
            : !semana.length ? <p className="pv-vacio">El dueño todavía no ha publicado el horario.</p>
              : <><HoyTrabajan personas={semana} hoy={hoy} /><Semana personas={semana} hoy={hoy} /></>}
      </div>
    </div>
  )
}
