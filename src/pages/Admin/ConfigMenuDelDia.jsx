import { useEffect, useRef, useState } from 'react'
import {
  DIAS_MD, menuDelDiaNuevo, partesActivas, opcionesDelDia, motivoSinAlmuerzo,
  ahoraBogota, idOpcion,
} from '../../utils/menuDelDia'
import { cop } from '../../utils/money'
import './ConfigMenuDelDia.css'

// 🍲 Configuración → Menú del día (el corrientazo). Guía «Pantalla de TV», Etapa B.
//
// Se guarda solo, un momento después de dejar de escribir. Arriba va lo del día a día (qué hay
// hoy y qué se acabó); abajo, lo que se arma una vez: semana tipo, precio y horario, y partes.

const ESPERA_GUARDAR = 900

export default function ConfigMenuDelDia({ local, onUpdate, onSubirFoto }) {
  const [md, setMd] = useState(() => normalizar(local.menuDelDia))
  const [estado, setEstado] = useState('') // '' | 'pendiente' | 'guardando' | 'ok' | 'error'
  const reloj = useRef(null)
  const ultimo = useRef(md)

  // Guardado automático con espera; `ya` guarda en el acto (interruptores, agotar).
  function cambiar(fn, ya = false) {
    setMd(prev => {
      const nuevo = typeof fn === 'function' ? fn(prev) : { ...prev, ...fn }
      ultimo.current = nuevo
      return nuevo
    })
    setEstado('pendiente')
    clearTimeout(reloj.current)
    reloj.current = setTimeout(guardar, ya ? 0 : ESPERA_GUARDAR)
  }
  async function guardar() {
    reloj.current = null   // ya no hay nada pendiente: al salir no se vuelve a guardar
    setEstado('guardando')
    try {
      await onUpdate({ menuDelDia: ultimo.current })
      setEstado('ok')
    } catch (e) {
      console.error('No se pudo guardar el menú del día', e)
      setEstado('error')
    }
  }
  // Al salir de la pantalla con algo pendiente, se guarda.
  useEffect(() => () => {
    if (reloj.current) { clearTimeout(reloj.current); onUpdate({ menuDelDia: ultimo.current }).catch(() => {}) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ahora = ahoraBogota()
  const [diaSel, setDiaSel] = useState(ahora.dia)
  const partes = partesActivas(md)

  return (
    <div className="cmd">
      <div className={`cmd-guardado ${estado}`} role="status">
        {estado === 'pendiente' || estado === 'guardando' ? 'Guardando…'
          : estado === 'ok' ? '✓ Guardado'
            : estado === 'error' ? '⚠️ No se pudo guardar. Revisa el internet.' : ''}
      </div>

      <section className="ac-sec">
        <label className="ac-switch cmd-on">
          <span>
            <b>Ofrecer menú del día</b>
            <small>Un almuerzo armado a precio fijo. Sale de primero en tu menú, en la caja, con el mesero y en el Menú en Pantalla, solo en su horario.</small>
          </span>
          <input type="checkbox" checked={md.activo} onChange={e => cambiar({ activo: e.target.checked }, true)} />
        </label>
        <EstadoHoy md={md} ahora={ahora} />
      </section>

      {md.activo && (
        <>
          <Hoy md={md} ahora={ahora} cambiar={cambiar} />

          <section className="ac-sec">
            <h3>📅 Semana tipo</h3>
            <p className="ac-hint cmd-hint-top">Lo que das cada día. Se repite sola todas las semanas; si un día cambia algo, usa «Cambiar solo hoy» arriba.</p>
            <div className="cmd-dias" role="tablist">
              {DIAS_MD.map(d => {
                const lleno = partes.some(p => (md.semana?.[d.k]?.[p.id] || []).length)
                return (
                  <button key={d.k} role="tab" aria-selected={diaSel === d.k}
                    className={`cmd-dia ${diaSel === d.k ? 'on' : ''} ${lleno ? 'lleno' : ''} ${d.k === ahora.dia ? 'hoy' : ''}`}
                    onClick={() => setDiaSel(d.k)}>
                    {d.c}
                  </button>
                )
              })}
            </div>
            <div className="cmd-partes-dia">
              {partes.map(p => (
                <EditorOpciones
                  key={`${diaSel}-${p.id}`}
                  parte={p}
                  opciones={md.semana?.[diaSel]?.[p.id] || []}
                  onCambiar={ops => cambiar(m => ({ ...m, semana: { ...m.semana, [diaSel]: { ...(m.semana?.[diaSel] || {}), [p.id]: ops } } }))}
                  onCopiarSemana={() => cambiar(m => {
                    const ops = m.semana?.[diaSel]?.[p.id] || []
                    const semana = { ...m.semana }
                    for (const d of DIAS_MD) semana[d.k] = { ...(semana[d.k] || {}), [p.id]: ops.map(o => ({ ...o, id: idOpcion() })) }
                    return { ...m, semana }
                  }, true)}
                />
              ))}
            </div>
          </section>

          <PrecioYHorario md={md} cambiar={cambiar} onSubirFoto={onSubirFoto} />
          <Partes md={md} cambiar={cambiar} />
        </>
      )}
    </div>
  )
}

// ─────────────────────────── Estado de hoy ───────────────────────────

const NOMBRE_DIA = Object.fromEntries(DIAS_MD.map(d => [d.k, d.full.toLowerCase()]))

function EstadoHoy({ md, ahora }) {
  if (!md.activo) return null
  const motivo = motivoSinAlmuerzo(md, ahora)
  const parte = motivo?.startsWith('falta:') ? md.partes.find(p => `falta:${p.id}` === motivo) : null
  const [txt, tono] = !motivo ? ['✅ Se está vendiendo ahora mismo.', 'ok']
    : motivo === 'fuera-de-franja' ? [`⏰ Hoy está listo. Sale de ${hora12(md.franja.desde)} a ${hora12(md.franja.hasta)}.`, 'info']
      : motivo === 'sin-precio' ? ['⚠️ Ponle precio abajo, en «Precio y horario».', 'aviso']
        : parte ? [`⚠️ Falta ${parte.nombre.toLowerCase()} para hoy (${NOMBRE_DIA[ahora.dia]}). Sin eso no sale.`, 'aviso']
          : [`⚠️ Hoy (${NOMBRE_DIA[ahora.dia]}) no hay nada cargado.`, 'aviso']
  return <p className={`cmd-estado ${tono}`}>{txt}</p>
}

// ─────────────────────────── Hoy: qué hay y qué se acabó ───────────────────────────

function Hoy({ md, ahora, cambiar }) {
  const partes = partesActivas(md)
  const ops = opcionesDelDia(md, ahora.dia, ahora.fecha)
  const cambiado = md.hoy?.fecha === ahora.fecha
  const agotadas = new Set(md.agotadas?.fecha === ahora.fecha ? md.agotadas.ids || [] : [])
  const hayAlgo = partes.some(p => (ops[p.id] || []).length)

  function alternarAgotada(id) {
    const s = new Set(agotadas)
    s.has(id) ? s.delete(id) : s.add(id)
    cambiar({ agotadas: { fecha: ahora.fecha, ids: [...s] } }, true)
  }
  const cambiarSoloHoy = () => cambiar(m => ({
    ...m,
    hoy: { fecha: ahora.fecha, opciones: JSON.parse(JSON.stringify(m.semana?.[ahora.dia] || {})) },
  }), true)
  const volverASemana = () => cambiar({ hoy: null }, true)

  return (
    <section className="ac-sec cmd-hoy">
      <div className="cmd-hoy-cab">
        <h3>🍽️ Hoy, {NOMBRE_DIA[ahora.dia]}</h3>
        {cambiado
          ? <button className="cmd-link" onClick={volverASemana}>Volver a lo de la semana</button>
          : <button className="cmd-link" onClick={cambiarSoloHoy}>Cambiar solo hoy</button>}
      </div>

      {cambiado ? (
        <>
          <p className="ac-hint cmd-hint-top">Estás cambiando solo el menú de hoy. Mañana vuelve lo de la semana.</p>
          <div className="cmd-partes-dia">
            {partes.map(p => (
              <EditorOpciones
                key={`hoy-${p.id}`}
                parte={p}
                opciones={md.hoy.opciones?.[p.id] || []}
                onCambiar={lista => cambiar(m => ({ ...m, hoy: { ...m.hoy, opciones: { ...m.hoy.opciones, [p.id]: lista } } }))}
              />
            ))}
          </div>
        </>
      ) : !hayAlgo ? (
        <p className="ac-hint">Todavía no hay nada para hoy. Cárgalo en la semana tipo, aquí abajo.</p>
      ) : (
        <>
          <p className="ac-hint cmd-hint-top">¿Se acabó algo? Tócalo y desaparece de tu menú y de la pantalla. Mañana vuelve solo.</p>
          <div className="cmd-hoy-partes">
            {partes.filter(p => (ops[p.id] || []).length).map(p => (
              <div key={p.id} className="cmd-hoy-parte">
                <span className="cmd-hoy-nombre">{p.emoji} {p.nombre}</span>
                <div className="cmd-chips">
                  {ops[p.id].map(o => (
                    <button key={o.id} className={`cmd-chip ${agotadas.has(o.id) ? 'agotada' : ''}`} onClick={() => alternarAgotada(o.id)} aria-pressed={agotadas.has(o.id)}>
                      {o.nombre}{Number(o.recargo) > 0 && <small> +{cop(o.recargo)}</small>}
                      {agotadas.has(o.id) && <b>Se acabó</b>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// ─────────────────────────── Opciones de una parte ───────────────────────────

function EditorOpciones({ parte, opciones, onCambiar, onCopiarSemana }) {
  const [nuevo, setNuevo] = useState('')
  const conRecargo = parte.id === 'proteina'
  const agregar = e => {
    e.preventDefault()
    const n = nuevo.trim()
    if (!n) return
    onCambiar([...opciones, { id: idOpcion(), nombre: n }])
    setNuevo('')
  }
  const editar = (id, k, v) => onCambiar(opciones.map(o => (o.id === id ? { ...o, [k]: v } : o)))
  const quitar = id => onCambiar(opciones.filter(o => o.id !== id))

  return (
    <div className={`cmd-parte ${conRecargo ? 'ancha' : ''}`}>
      <div className="cmd-parte-cab">
        <strong>{parte.emoji} {parte.nombre}</strong>
        {parte.obligatoria && <span className="cmd-oblig">obligatoria</span>}
        {onCopiarSemana && opciones.length > 0 && (
          <button className="cmd-link" onClick={onCopiarSemana} title="Pone esto mismo en los 7 días">Copiar a toda la semana</button>
        )}
      </div>
      {opciones.map(o => (
        <div key={o.id} className="cmd-op">
          <input value={o.nombre} onChange={e => editar(o.id, 'nombre', e.target.value)} aria-label={`${parte.nombre}: nombre`} />
          {conRecargo && (
            <label className="cmd-recargo" title="Lo que cuesta de más esta proteína (vacío = nada)">
              <span>+$</span>
              <input inputMode="numeric" value={o.recargo || ''} placeholder="0"
                onChange={e => editar(o.id, 'recargo', Number(e.target.value.replace(/\D/g, '')) || 0)} aria-label="Recargo" />
            </label>
          )}
          <button className="cmd-x" onClick={() => quitar(o.id)} aria-label={`Quitar ${o.nombre}`}>✕</button>
        </div>
      ))}
      <form className="cmd-op cmd-op-nueva" onSubmit={agregar}>
        <input value={nuevo} onChange={e => setNuevo(e.target.value)} placeholder={EJEMPLO[parte.id] || 'Agregar opción'} aria-label={`Agregar a ${parte.nombre}`} />
        <button className="btn btn-ghost" disabled={!nuevo.trim()}>＋</button>
      </form>
    </div>
  )
}

const EJEMPLO = {
  sopa: 'Ej. Ajiaco', principio: 'Ej. Fríjoles', proteina: 'Ej. Pechuga a la plancha',
  acompanante: 'Ej. Arroz blanco', ensalada: 'Ej. Ensalada fresca', jugo: 'Ej. Limonada', extra: 'Ej. Gelatina',
}

// ─────────────────────────── Precio, horario y foto ───────────────────────────

function PrecioYHorario({ md, cambiar, onSubirFoto }) {
  const [subiendo, setSubiendo] = useState(false)
  const archivo = useRef(null)
  const num = v => Number(String(v).replace(/\D/g, '')) || 0
  async function elegirFoto(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setSubiendo(true)
    try { cambiar({ foto: await onSubirFoto(f) }, true) } catch (err) {
      console.error(err); alert('No se pudo subir la foto. Prueba de nuevo.')
    } finally { setSubiendo(false) }
  }
  return (
    <section className="ac-sec">
      <h3>💲 Precio y horario</h3>
      <label className="cmd-campo">
        <span>Nombre en el menú</span>
        <input value={md.nombre} maxLength={40} onChange={e => cambiar({ nombre: e.target.value })} placeholder="Almuerzo del día" />
      </label>
      <div className="cmd-fila2">
        <label className="cmd-campo">
          <span>Precio para comer aquí</span>
          <input inputMode="numeric" value={md.precioMesa || ''} placeholder="15000" onChange={e => cambiar({ precioMesa: num(e.target.value) })} />
        </label>
        <label className="cmd-campo">
          <span>Para llevar <small>(si cambia)</small></span>
          <input inputMode="numeric" value={md.precioLlevar || ''} placeholder="Igual" onChange={e => cambiar({ precioLlevar: num(e.target.value) })} />
        </label>
      </div>
      <p className="ac-hint">Por la app y para llevar vale lo de llevar; en la mesa, lo de comer aquí. La caja y el mesero escogen.</p>

      <span className="ac-sub">Horario del almuerzo</span>
      <div className="ac-horas">
        <label>Desde<input type="time" value={md.franja?.desde || ''} onChange={e => cambiar({ franja: { ...md.franja, desde: e.target.value } })} /></label>
        <label>Hasta<input type="time" value={md.franja?.hasta || ''} onChange={e => cambiar({ franja: { ...md.franja, hasta: e.target.value } })} /></label>
      </div>
      <p className="ac-hint">Fuera de este horario no se puede pedir y no sale en el Menú en Pantalla.</p>

      <span className="ac-sub">Foto <small>(opcional: con foto pasa en grande por el Menú en Pantalla)</small></span>
      <div className="cmd-foto">
        {md.foto && <img src={md.foto} alt="" />}
        <button type="button" className="btn btn-ghost" onClick={() => archivo.current?.click()} disabled={subiendo}>
          {subiendo ? 'Subiendo…' : md.foto ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {md.foto && <button type="button" className="cmd-link" onClick={() => cambiar({ foto: '' }, true)}>Quitar</button>}
        <input ref={archivo} type="file" accept="image/*" hidden onChange={elegirFoto} />
      </div>
    </section>
  )
}

// ─────────────────────────── Partes del almuerzo ───────────────────────────

function Partes({ md, cambiar }) {
  const editar = (id, k, v, ya = false) => cambiar(m => ({ ...m, partes: m.partes.map(p => (p.id === id ? { ...p, [k]: v } : p)) }), ya)
  return (
    <section className="ac-sec">
      <h3>🧩 Qué trae el almuerzo</h3>
      <p className="ac-hint cmd-hint-top">Apaga lo que no das. Debajo de cada parte dices si el cliente la puede quitar o cambiar por otra cosa.</p>
      <div className="cmd-lista-partes">
        {md.partes.map(p => (
          <div key={p.id} className={`cmd-pp ${p.activa ? '' : 'off'}`}>
            <label className="cmd-pp-cab">
              <input type="checkbox" checked={p.activa} onChange={e => editar(p.id, 'activa', e.target.checked, true)} />
              {p.id === 'extra'
                ? <input className="cmd-pp-nombre" value={p.nombre} maxLength={24} onChange={e => editar(p.id, 'nombre', e.target.value)} aria-label="Nombre de la parte extra" />
                : <strong>{p.emoji} {p.nombre}</strong>}
            </label>
            {p.activa && (
              <div className="cmd-pp-cuerpo">
                {p.id !== 'proteina' && (
                  <label className="cmd-check">
                    <input type="checkbox" checked={!!p.obligatoria} onChange={e => editar(p.id, 'obligatoria', e.target.checked, true)} />
                    Sin esto no sale el almuerzo
                  </label>
                )}
                {p.id !== 'proteina' && !(p.reemplazos || []).length && (
                  <label className="cmd-check">
                    <input type="checkbox" checked={!!p.sePuedeQuitar} onChange={e => editar(p.id, 'sePuedeQuitar', e.target.checked, true)} />
                    El cliente puede pedirlo sin esto (mismo precio)
                  </label>
                )}
                {p.id === 'principio' && (
                  <label className="cmd-check">
                    <input type="checkbox" checked={Number(p.max) === 2} onChange={e => editar(p.id, 'max', e.target.checked ? 2 : 1, true)} />
                    Puede escoger dos
                  </label>
                )}
                {p.id !== 'proteina' && (
                  <Reemplazos parte={p} onCambiar={lista => editar(p.id, 'reemplazos', lista, true)} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function Reemplazos({ parte, onCambiar }) {
  const [txt, setTxt] = useState('')
  const lista = parte.reemplazos || []
  const agregar = e => {
    e.preventDefault()
    const t = txt.trim()
    if (t && !lista.includes(t)) onCambiar([...lista, t])
    setTxt('')
  }
  return (
    <div className="cmd-reemp">
      <span>En vez de {parte.nombre.toLowerCase()} puede pedir:</span>
      <div className="cmd-chips">
        {lista.map(r => (
          <span key={r} className="cmd-chip fija">{r}<button onClick={() => onCambiar(lista.filter(x => x !== r))} aria-label={`Quitar ${r}`}>✕</button></span>
        ))}
        <form onSubmit={agregar} className="cmd-reemp-form">
          <input value={txt} onChange={e => setTxt(e.target.value)} placeholder={lista.length ? 'Otro…' : 'Ej. Huevo frito'} aria-label={`Reemplazo para ${parte.nombre}`} />
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────── Utilidades ───────────────────────────

// Lo guardado + lo que falte de un menú nuevo (partes nuevas que no existían, etc.).
function normalizar(guardado) {
  const base = menuDelDiaNuevo()
  if (!guardado) return base
  const partes = base.partes.map(pb => ({ ...pb, ...(guardado.partes || []).find(p => p.id === pb.id) }))
  return { ...base, ...guardado, partes, franja: { ...base.franja, ...(guardado.franja || {}) }, semana: { ...base.semana, ...(guardado.semana || {}) } }
}

function hora12(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`
}
