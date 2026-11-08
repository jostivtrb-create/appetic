import { useState } from 'react'
import { createPortal } from 'react-dom'
import { DIAS_CAT, ICONOS_CAT, horarioValido } from '../../utils/categorias'

// 🗂️ Ventanas del panel de categorías del Catálogo (guía «Editar el catálogo» D3, D7, D8, D12).
//   <CategoriaHoja>      crear o editar: nombre, ícono, pausar y horario.
//   <EliminarCategoria>  eliminar: si tiene productos, moverlos a otra o borrarlos.
//   <Ventana>            el marco común (centrado en el PC, desde abajo en el celular).

export function Ventana({ titulo, onCerrar, children, pie, ancho = 480 }) {
  return createPortal(
    <div className="cm-fondo" onClick={onCerrar}>
      <div className="cm-ventana" role="dialog" aria-modal="true" aria-label={titulo} style={{ '--cm-ancho': `${ancho}px` }} onClick={e => e.stopPropagation()}>
        <header className="cm-cab">
          <h2>{titulo}</h2>
          <button type="button" className="cm-x" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </header>
        <div className="cm-cuerpo">{children}</div>
        {pie && <footer className="cm-pie">{pie}</footer>}
      </div>
    </div>, document.body)
}

const HORARIO_INICIAL = { dias: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'], de: '06:00', a: '11:00' }

export function CategoriaHoja({ categoria, onGuardar, onCerrar }) {
  const nueva = !categoria
  const [nombre, setNombre] = useState(categoria?.nombre || '')
  const [emoji, setEmoji] = useState(categoria?.emoji || '')
  const [pausada, setPausada] = useState(!!categoria?.pausada)
  const [conHorario, setConHorario] = useState(horarioValido(categoria?.horario))
  const [horario, setHorario] = useState(horarioValido(categoria?.horario) ? { ...categoria.horario, dias: categoria.horario.dias?.length ? categoria.horario.dias : HORARIO_INICIAL.dias } : HORARIO_INICIAL)
  const [estado, setEstado] = useState('')
  const horarioOk = !conHorario || (horarioValido(horario) && horario.dias.length > 0)
  const listo = nombre.trim() && horarioOk

  function dia(id) {
    setHorario(h => ({ ...h, dias: h.dias.includes(id) ? h.dias.filter(d => d !== id) : DIAS_CAT.map(d => d.id).filter(d => d === id || h.dias.includes(d)) }))
  }
  async function guardar() {
    if (!listo) return
    setEstado('guardando')
    try {
      await onGuardar({
        nombre: nombre.trim(), emoji,
        pausada,
        horario: conHorario ? { dias: horario.dias.length === 7 ? [] : horario.dias, de: horario.de, a: horario.a } : null,
      })
      onCerrar()
    } catch (e) {
      console.error('categoría:', e)
      setEstado('error')
    }
  }

  return (
    <Ventana titulo={nueva ? 'Nueva categoría' : 'Editar categoría'} onCerrar={onCerrar} pie={<>
      {estado === 'error' && <span className="cm-error">No se pudo guardar. Revisa el internet.</span>}
      <button type="button" className="cm-btn" onClick={onCerrar}>Cancelar</button>
      <button type="button" className="cm-btn primario" disabled={!listo || estado === 'guardando'} onClick={guardar}>
        {estado === 'guardando' ? 'Guardando…' : nueva ? 'Crear categoría' : 'Guardar'}
      </button>
    </>}>
      <label className="cm-campo">
        <span>Nombre</span>
        <div className="cm-nombre">
          <span className="cm-nombre-ico" aria-hidden="true">{emoji || '🍽️'}</span>
          <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={40} placeholder="Ej: Postres" autoFocus={nueva} />
        </div>
      </label>

      <div className="cm-campo">
        <span>Ícono</span>
        <div className="cm-iconos" role="radiogroup" aria-label="Ícono de la categoría">
          <button type="button" role="radio" aria-checked={!emoji} className={!emoji ? 'on' : ''} onClick={() => setEmoji('')} title="Sin ícono">∅</button>
          {ICONOS_CAT.map(i => (
            <button type="button" role="radio" aria-checked={emoji === i} key={i} className={emoji === i ? 'on' : ''} onClick={() => setEmoji(i)}>{i}</button>
          ))}
        </div>
      </div>

      <label className="cm-switch">
        <span><b>⏸️ Pausar categoría</b><small>No sale en el menú ni en el Menú en Pantalla hasta que la vuelvas a prender. No se borra nada.</small></span>
        <input type="checkbox" checked={pausada} onChange={e => setPausada(e.target.checked)} />
      </label>

      <label className="cm-switch">
        <span><b>🕒 Solo a ciertas horas</b><small>Ej.: «Desayunos» de 6 a 11 a. m. Fuera de ese horario se esconde sola.</small></span>
        <input type="checkbox" checked={conHorario} onChange={e => setConHorario(e.target.checked)} />
      </label>
      {conHorario && (
        <div className="cm-horario">
          <div className="cm-dias" role="group" aria-label="Días">
            {DIAS_CAT.map(d => (
              <button type="button" key={d.id} aria-pressed={horario.dias.includes(d.id)} className={horario.dias.includes(d.id) ? 'on' : ''} onClick={() => dia(d.id)}>{d.corto}</button>
            ))}
          </div>
          <div className="cm-horas">
            <label>Desde<input type="time" value={horario.de} onChange={e => setHorario(h => ({ ...h, de: e.target.value }))} /></label>
            <label>Hasta<input type="time" value={horario.a} onChange={e => setHorario(h => ({ ...h, a: e.target.value }))} /></label>
          </div>
          {!horarioOk && <p className="cm-error">Marca al menos un día y dos horas distintas.</p>}
        </div>
      )}
    </Ventana>
  )
}

export function EliminarCategoria({ categoria, cuantos, otras, demo, onEliminar, onCerrar }) {
  const [modo, setModo] = useState(otras.length ? 'mover' : 'borrar')
  const [destino, setDestino] = useState(otras[0]?.id || '')
  const [estado, setEstado] = useState('')
  async function eliminar() {
    setEstado('borrando')
    try {
      await onEliminar(cuantos && modo === 'mover' ? { moverA: destino } : {})
      onCerrar()
    } catch (e) {
      console.error('eliminar categoría:', e)
      setEstado(demo || e?.code === 'permission-denied' ? 'demo' : 'error')
    }
  }
  return (
    <Ventana titulo={`Eliminar «${categoria.nombre}»`} onCerrar={onCerrar} ancho={440} pie={<>
      <button type="button" className="cm-btn" onClick={onCerrar}>Cancelar</button>
      <button type="button" className="cm-btn peligro" disabled={estado === 'borrando' || (cuantos > 0 && modo === 'mover' && !destino)} onClick={eliminar}>
        {estado === 'borrando' ? 'Eliminando…' : 'Eliminar categoría'}
      </button>
    </>}>
      {cuantos === 0
        ? <p className="cm-texto">La categoría está vacía. Se quita del menú.</p>
        : <>
          <p className="cm-texto">Tiene <b>{cuantos} {cuantos === 1 ? 'producto' : 'productos'}</b>. ¿Qué hacemos con {cuantos === 1 ? 'él' : 'ellos'}?</p>
          <div className="cm-opciones">
            {otras.length > 0 && (
              <label className={`cm-opcion${modo === 'mover' ? ' on' : ''}`}>
                <input type="radio" name="modo" checked={modo === 'mover'} onChange={() => setModo('mover')} />
                <span><b>Moverlos a otra categoría</b>
                  <select value={destino} onChange={e => { setDestino(e.target.value); setModo('mover') }} aria-label="Categoría de destino">
                    {otras.map(c => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.nombre}</option>)}
                  </select>
                </span>
              </label>
            )}
            <label className={`cm-opcion peligro${modo === 'borrar' ? ' on' : ''}`}>
              <input type="radio" name="modo" checked={modo === 'borrar'} onChange={() => setModo('borrar')} />
              <span><b>Borrar {cuantos === 1 ? 'el producto' : `los ${cuantos} productos`}</b><small>No se puede deshacer.</small></span>
            </label>
          </div>
        </>}
      {estado === 'demo' && <p className="cm-error">En la demo no se pueden borrar categorías ni productos.</p>}
      {estado === 'error' && <p className="cm-error">No se pudo eliminar. Revisa el internet.</p>}
    </Ventana>
  )
}
