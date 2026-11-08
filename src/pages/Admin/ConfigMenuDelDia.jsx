import { useEffect, useRef, useState } from 'react'
import {
  DIAS_MD, menuDelDiaNuevo, partesActivas, opcionesDelDia, motivoSinAlmuerzo,
  ahoraBogota, idOpcion,
} from '../../utils/menuDelDia'
import { cop } from '../../utils/money'
import { PanelHero, PanelCuerpo, PanelLado, PanelTarjeta, PanelSwitch } from './PanelPagina'
import './ConfigMenuDelDia.css'

// 🍲 Configuración → Menú del día (el corrientazo). Guía «Pantalla de TV», Etapa B.
//
// Se guarda solo, un momento después de dejar de escribir.
// Diseño (guía «Diseño de pantallas del panel», 8-nov): encabezado grande con el interruptor y el
// resumen; a la izquierda la lista Hoy · los 7 días de la semana tipo · Precio y horario · Qué trae;
// a la derecha solo lo elegido, en tarjetas. La lógica de guardado no cambió.

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
  const [vista, setVista] = useState('hoy') // 'hoy' | 'lun'…'dom' | 'precio' | 'partes'
  const partes = partesActivas(md)
  const dia = DIAS_MD.find(d => d.k === vista)
  const llenas = k => partes.filter(p => (md.semana?.[k]?.[p.id] || []).length).length
  const estadoHoy = textoEstado(md, ahora)
  const precio = Number(md.precioMesa) || 0
  const llevar = Number(md.precioLlevar) || 0

  const chips = md.activo ? [
    { t: estadoHoy.corto, tono: estadoHoy.tono },
    precio ? { t: llevar && llevar !== precio ? `${cop(precio)} aquí · ${cop(llevar)} para llevar` : `${cop(precio)}` } : { t: 'Sin precio', tono: 'aviso' },
    md.franja?.desde && md.franja?.hasta ? { t: `🕒 ${hora12(md.franja.desde)} – ${hora12(md.franja.hasta)}` } : null,
  ] : [{ t: 'Apagado', tono: 'off' }]

  return (
    <div className="cmd">
      <PanelHero icono="🍲" titulo="Menú del día" sub="El almuerzo a precio fijo: qué hay hoy, la semana y el precio" chips={chips}
        derecha={<div className="cmd-hero-der">
          <PanelSwitch grande titulo="Ofrecer menú del día" texto={md.activo ? 'Sale en tu menú, la caja, el mesero y el Menú en Pantalla' : 'Apagado: no sale en ninguna parte'}
            checked={md.activo} onChange={v => cambiar({ activo: v }, true)} />
          <p className={`pp-guardado ${estado}`} role="status">
            {estado === 'pendiente' || estado === 'guardando' ? 'Guardando…' : estado === 'ok' ? '✓ Guardado' : estado === 'error' ? '⚠️ No se pudo guardar. Revisa el internet.' : 'Se guarda solo'}
          </p>
        </div>} />

      {!md.activo ? (
        <PanelCuerpo>
          <div className="pp-vacio">
            <span aria-hidden="true">🍲</span>
            <b>El menú del día está apagado</b>
            <p className="pp-ayuda">Un almuerzo armado a precio fijo (sopa, principio, proteína…). Sale de primero en tu menú, en la caja, con el mesero y en el Menú en Pantalla, solo en su horario.</p>
            <button type="button" className="btn btn-primary" onClick={() => cambiar({ activo: true }, true)}>Ofrecer menú del día</button>
          </div>
        </PanelCuerpo>
      ) : (
        <PanelCuerpo lado={
          <PanelLado icono="🍲" titulo="Menú del día" sel={vista} onSel={setVista} grupos={[
            { items: [{ id: 'hoy', icono: '⚡', nombre: `Hoy, ${NOMBRE_DIA[ahora.dia]}`, nota: estadoHoy.corto, tono: estadoHoy.tono === 'ok' ? 'ok' : estadoHoy.tono === 'aviso' ? 'aviso' : null }] },
            { titulo: 'Semana tipo', items: DIAS_MD.map(d => {
              const n = llenas(d.k)
              return { id: d.k, icono: d.c, nombre: d.full, nota: d.k === ahora.dia ? 'Hoy' : null, n: `${n}/${partes.length}`, tono: n === partes.length ? 'ok' : n ? 'aviso' : 'off' }
            }) },
            { titulo: 'Ajustes', items: [
              { id: 'precio', icono: '💲', nombre: 'Precio y horario', nota: precio ? cop(precio) : 'Falta el precio', tono: precio ? null : 'aviso' },
              { id: 'partes', icono: '🧩', nombre: 'Qué trae el almuerzo', nota: `${partes.length} partes` },
            ] },
          ]} />
        }>
          {vista === 'hoy' && <Hoy md={md} ahora={ahora} cambiar={cambiar} estadoHoy={estadoHoy} onIrADia={() => setVista(ahora.dia)} />}

          {dia && (
            <PanelTarjeta icono="📅" titulo={<>Semana tipo: <em>{dia.full}</em></>}
              sub={`Lo que das los ${dia.full.toLowerCase()}. Se repite sola cada semana; si un día cambia algo, usa «Cambiar solo hoy» en Hoy.`}
              acciones={<ul className="pp-chips"><li className={llenas(dia.k) === partes.length ? 't-ok' : 't-aviso'}>{llenas(dia.k)}/{partes.length} partes</li></ul>}>
              <div className="pp-grid">
                {partes.map(p => (
                  <EditorOpciones
                    key={`${dia.k}-${p.id}`}
                    parte={p}
                    opciones={md.semana?.[dia.k]?.[p.id] || []}
                    onCambiar={ops => cambiar(m => ({ ...m, semana: { ...m.semana, [dia.k]: { ...(m.semana?.[dia.k] || {}), [p.id]: ops } } }))}
                    onCopiarSemana={() => cambiar(m => {
                      const ops = m.semana?.[dia.k]?.[p.id] || []
                      const semana = { ...m.semana }
                      for (const d of DIAS_MD) semana[d.k] = { ...(semana[d.k] || {}), [p.id]: ops.map(o => ({ ...o, id: idOpcion() })) }
                      return { ...m, semana }
                    }, true)}
                  />
                ))}
              </div>
            </PanelTarjeta>
          )}

          {vista === 'precio' && <PrecioYHorario md={md} cambiar={cambiar} onSubirFoto={onSubirFoto} />}
          {vista === 'partes' && <Partes md={md} cambiar={cambiar} />}
        </PanelCuerpo>
      )}
    </div>
  )
}

// ─────────────────────────── Estado de hoy ───────────────────────────

const NOMBRE_DIA = Object.fromEntries(DIAS_MD.map(d => [d.k, d.full.toLowerCase()]))

function textoEstado(md, ahora) {
  const motivo = motivoSinAlmuerzo(md, ahora)
  const parte = motivo?.startsWith('falta:') ? md.partes.find(p => `falta:${p.id}` === motivo) : null
  if (!motivo) return { largo: '✅ Se está vendiendo ahora mismo.', corto: '● Vendiéndose ahora', tono: 'ok' }
  if (motivo === 'fuera-de-franja') return { largo: `⏰ Hoy está listo. Sale de ${hora12(md.franja.desde)} a ${hora12(md.franja.hasta)}.`, corto: '⏰ Listo para su horario', tono: 'info' }
  if (motivo === 'sin-precio') return { largo: '⚠️ Ponle precio en «Precio y horario».', corto: '⚠️ Falta el precio', tono: 'aviso' }
  if (parte) return { largo: `⚠️ Falta ${parte.nombre.toLowerCase()} para hoy (${NOMBRE_DIA[ahora.dia]}). Sin eso no sale.`, corto: `⚠️ Falta ${parte.nombre.toLowerCase()}`, tono: 'aviso' }
  return { largo: `⚠️ Hoy (${NOMBRE_DIA[ahora.dia]}) no hay nada cargado.`, corto: '⚠️ Hoy no hay nada', tono: 'aviso' }
}

// ─────────────────────────── Hoy: qué hay y qué se acabó ───────────────────────────

function Hoy({ md, ahora, cambiar, estadoHoy, onIrADia }) {
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
    <PanelTarjeta icono="🍽️" titulo={<>Hoy, <em>{NOMBRE_DIA[ahora.dia]}</em></>}
      sub={cambiado ? 'Estás cambiando solo el menú de hoy. Mañana vuelve lo de la semana.' : '¿Se acabó algo? Tócalo y desaparece de tu menú y de la pantalla. Mañana vuelve solo.'}
      acciones={cambiado
        ? <button className="pp-btn" onClick={volverASemana}>↩️ Volver a lo de la semana</button>
        : <button className="pp-btn" onClick={cambiarSoloHoy}>✏️ Cambiar solo hoy</button>}>
      <p className={`cmd-estado ${estadoHoy.tono}`}>{estadoHoy.largo}</p>

      {cambiado ? (
        <>
          <div className="pp-grid">
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
        <div className="pp-vacio"><span aria-hidden="true">📅</span><b>Todavía no hay nada para hoy</b>
          <button type="button" className="pp-btn" onClick={onIrADia}>Cargar el {NOMBRE_DIA[ahora.dia]} en la semana tipo</button></div>
      ) : (
        <>
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
    </PanelTarjeta>
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
    <div className={`cmd-parte pp-sub ${conRecargo ? 'ancha' : ''}`}>
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
    <PanelTarjeta icono="💲" titulo="Precio y horario" sub="Cómo se llama en el menú, cuánto vale y a qué hora se vende.">
      <div className="pp-grid cmd-precio">
        <div className="pp-sub">
          <h4 className="cmd-h4">🏷️ Nombre y precio</h4>
          <label className="pp-campo"><span>Nombre en el menú</span>
            <input value={md.nombre} maxLength={40} onChange={e => cambiar({ nombre: e.target.value })} placeholder="Almuerzo del día" />
          </label>
          <div className="pp-fila">
            <label className="pp-campo"><span>Para comer aquí</span>
              <div className="pp-plata"><i>$</i><input inputMode="numeric" value={md.precioMesa || ''} placeholder="15000" onChange={e => cambiar({ precioMesa: num(e.target.value) })} /></div>
            </label>
            <label className="pp-campo"><span>Para llevar <small>(si cambia)</small></span>
              <div className="pp-plata"><i>$</i><input inputMode="numeric" value={md.precioLlevar || ''} placeholder="Igual" onChange={e => cambiar({ precioLlevar: num(e.target.value) })} /></div>
            </label>
          </div>
          <p className="pp-ayuda">Por la app y para llevar vale lo de llevar; en la mesa, lo de comer aquí. La caja y el mesero escogen.</p>
        </div>
        <div className="pp-sub">
          <h4 className="cmd-h4">🕒 Horario del almuerzo</h4>
          <div className="pp-fila">
            <label className="pp-campo"><span>Desde</span><input type="time" value={md.franja?.desde || ''} onChange={e => cambiar({ franja: { ...md.franja, desde: e.target.value } })} /></label>
            <label className="pp-campo"><span>Hasta</span><input type="time" value={md.franja?.hasta || ''} onChange={e => cambiar({ franja: { ...md.franja, hasta: e.target.value } })} /></label>
          </div>
          <p className="pp-ayuda">Fuera de este horario no se puede pedir y no sale en el Menú en Pantalla.</p>
        </div>
        <div className="pp-sub">
          <h4 className="cmd-h4">📷 Foto <small>(opcional)</small></h4>
          <div className="cmd-foto">
            <div className="cmd-foto-ver">{md.foto ? <img src={md.foto} alt="" /> : <span>🍲</span>}</div>
            <div className="cmd-foto-acc">
              <button type="button" className="pp-btn" onClick={() => archivo.current?.click()} disabled={subiendo}>
                {subiendo ? 'Subiendo…' : md.foto ? '📱 Cambiar foto' : '📱 Subir foto'}
              </button>
              {md.foto && <button type="button" className="pp-link" onClick={() => cambiar({ foto: '' }, true)}>Quitar</button>}
            </div>
            <input ref={archivo} type="file" accept="image/*" hidden onChange={elegirFoto} />
          </div>
          <p className="pp-ayuda">Con foto, pasa en grande por el Menú en Pantalla.</p>
        </div>
      </div>
    </PanelTarjeta>
  )
}

// ─────────────────────────── Partes del almuerzo ───────────────────────────

function Partes({ md, cambiar }) {
  const editar = (id, k, v, ya = false) => cambiar(m => ({ ...m, partes: m.partes.map(p => (p.id === id ? { ...p, [k]: v } : p)) }), ya)
  return (
    <PanelTarjeta icono="🧩" titulo="Qué trae el almuerzo" sub="Apaga lo que no das. En cada parte dices si el cliente la puede quitar o cambiar por otra cosa.">
      <div className="pp-grid">
        {md.partes.map(p => (
          <div key={p.id} className={`cmd-pp pp-sub ${p.activa ? '' : 'off'}`}>
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
    </PanelTarjeta>
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
