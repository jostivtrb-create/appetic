import { useState } from 'react'
import { cop } from '../../utils/money'
import ImagenApp from '../../components/Imagen/ImagenApp'

export default function AdminProductos({ local, productos, onAdd, onUpdate, onDelete, onFoto, onFotoOpcion }) {
  const [editando, setEditando] = useState(null) // producto o { nuevo:true }

  const categorias = local.categorias || []

  return (
    <div className="ap">
      <button className="btn btn-primary ap-add" onClick={() => setEditando({ nuevo: true, categoria: categorias[0]?.id })}>
        + Agregar producto
      </button>

      {productos.length === 0 && <p className="ap-vacio">Aún no hay productos. Agrega el primero.</p>}

      <div className="ap-lista">
        {productos.map(p => (
          <div key={p.id} className={`ap-item ${p.disponible === false ? 'ap-item-off' : ''}`}>
            <div className="ap-item-foto">
              <ImagenApp className="ap-item-foto-img" src={p.foto} alt="" />
            </div>
            <div className="ap-item-info">
              <h4>{p.nombre}</h4>
              <span className="ap-item-precio">
                {p.variantes?.length ? `desde ${cop(Math.min(...p.variantes.map(v => v.precio)))}` : cop(p.precio)}
              </span>
            </div>
            <div className="ap-item-actions">
              <button
                className={`ap-toggle ${p.disponible === false ? 'off' : 'on'}`}
                onClick={() => onUpdate(p.id, { disponible: p.disponible === false })}
                title={p.disponible === false ? 'Agotado' : 'Disponible'}
              >
                {p.disponible === false ? 'Agotado' : 'Disponible'}
              </button>
              <button className="ap-edit" onClick={() => setEditando(p)}>Editar</button>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <EditorProducto
          producto={editando}
          categorias={categorias}
          onCerrar={() => setEditando(null)}
          onGuardar={async (data, fotoFile) => {
            if (editando.nuevo) {
              const nuevoId = await onAdd({ disponible: true, ...data })
              if (fotoFile && nuevoId) await onFoto(nuevoId, fotoFile)
            } else {
              await onUpdate(editando.id, data)
              if (fotoFile) await onFoto(editando.id, fotoFile)
            }
            setEditando(null)
          }}
          onBorrar={editando.nuevo ? null : async () => { await onDelete(editando.id); setEditando(null) }}
          onFotoNueva={onFoto}
          onFotoOpcion={onFotoOpcion}
        />
      )}
    </div>
  )
}

function EditorProducto({ producto, categorias, onCerrar, onGuardar, onBorrar, onFotoOpcion }) {
  const [nombre, setNombre] = useState(producto.nombre || '')
  const [descripcion, setDescripcion] = useState(producto.descripcion || '')
  const [categoria, setCategoria] = useState(producto.categoria || categorias[0]?.id || '')
  const [precio, setPrecio] = useState(producto.precio || '')
  const [variantes, setVariantes] = useState(producto.variantes ? producto.variantes.map(v => ({ ...v })) : null)
  // Copia editable de los grupos de opciones (toppings/salsas) con sus fotos.
  const [grupos, setGrupos] = useState(
    producto.gruposOpciones
      ? producto.gruposOpciones.map(g => ({ ...g, opciones: (g.opciones || []).map(o => ({ ...o })) }))
      : null
  )
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(producto.foto || '')
  const [guardando, setGuardando] = useState(false)

  const tieneVariantes = Array.isArray(variantes) && variantes.length > 0
  const tieneGrupos = Array.isArray(grupos) && grupos.length > 0

  // --- Edición de opciones (toppings/salsas) dentro de un grupo ---
  function setOpcion(gi, oi, cambios) {
    setGrupos(gs => gs.map((g, j) => j !== gi ? g
      : { ...g, opciones: g.opciones.map((o, k) => k === oi ? { ...o, ...cambios } : o) }))
  }
  function quitarOpcion(gi, oi) {
    setGrupos(gs => gs.map((g, j) => j !== gi ? g
      : { ...g, opciones: g.opciones.filter((_, k) => k !== oi) }))
  }
  function agregarOpcion(gi) {
    setGrupos(gs => gs.map((g, j) => {
      if (j !== gi) return g
      const usados = g.opciones.map(o => o.id)
      let n = g.opciones.length + 1
      const prefijo = g.id.includes('salsa') ? 's' : (g.id.includes('topping') ? 't' : 'o')
      let nuevoId = `${prefijo}${n}`
      while (usados.includes(nuevoId)) { n++; nuevoId = `${prefijo}${n}` }
      return { ...g, opciones: [...g.opciones, { id: nuevoId, nombre: '', precioExtra: 0, emoji: '', foto: '' }] }
    }))
  }

  function elegirFoto(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFotoFile(f)
    setFotoPreview(URL.createObjectURL(f))
  }

  async function guardar() {
    if (!nombre.trim()) return
    setGuardando(true)
    const data = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria,
    }
    if (tieneVariantes) data.variantes = variantes.map(v => ({ ...v, precio: Number(v.precio) || 0 }))
    else data.precio = Number(precio) || 0
    if (tieneGrupos) {
      data.gruposOpciones = grupos.map(g => ({
        ...g,
        opciones: g.opciones
          .filter(o => o.nombre.trim()) // descarta opciones sin nombre
          .map(o => ({ ...o, nombre: o.nombre.trim(), precioExtra: Number(o.precioExtra) || 0 })),
      }))
    }
    try {
      await onGuardar(data, fotoFile)
      // En éxito, el editor se cierra (onGuardar hace setEditando(null)); no
      // reseteamos guardando aquí para evitar tocar un componente desmontado.
    } catch (err) {
      // Si algo falla (subir foto, guardar), no dejar el botón pegado en "Guardando…".
      const cod = err?.code || err?.message || String(err)
      console.error('No se pudo guardar el producto:', cod, err)
      alert(`No se pudo guardar.\n\nDetalle: ${cod}\n\nMándame este detalle si se repite.`)
      setGuardando(false)
    }
  }

  return (
    <div className="pm-overlay" onClick={onCerrar}>
      <div className="pm-sheet" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onCerrar}>✕</button>
        <div className="pm-body">
          <h2 className="pm-nombre">{producto.nuevo ? 'Nuevo producto' : 'Editar producto'}</h2>

          <label className="ap-foto-pick">
            {fotoPreview ? <img src={fotoPreview} alt="" /> : <span>📷 Agregar foto</span>}
            <input type="file" accept="image/*" onChange={elegirFoto} hidden />
          </label>

          <label className="ap-label">Nombre</label>
          <input className="co-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Hamburguesa Clásica" />

          <label className="ap-label">Descripción</label>
          <textarea className="co-input co-textarea" rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} />

          <label className="ap-label">Categoría</label>
          <select className="co-input" value={categoria} onChange={e => setCategoria(e.target.value)}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          {tieneVariantes ? (
            <>
              <label className="ap-label">Precios por tamaño</label>
              {variantes.map((v, i) => (
                <div key={v.id} className="ap-variante">
                  <span>{v.nombre}</span>
                  <input
                    className="co-input"
                    inputMode="numeric"
                    value={v.precio}
                    onChange={e => setVariantes(vs => vs.map((x, j) => j === i ? { ...x, precio: e.target.value.replace(/\D/g, '') } : x))}
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              <label className="ap-label">Precio</label>
              <input className="co-input" inputMode="numeric" value={precio} onChange={e => setPrecio(e.target.value.replace(/\D/g, ''))} placeholder="14000" />
            </>
          )}

          {/* Grupos de opciones (toppings / salsas) con su foto */}
          {tieneGrupos && grupos.map((g, gi) => (
            <div key={g.id} className="ap-grupo">
              <label className="ap-label">{g.emoji} {g.nombre}</label>
              <div className="ap-opciones">
                {g.opciones.map((o, oi) => (
                  <OpcionEditor
                    key={o.id}
                    opcion={o}
                    onNombre={val => setOpcion(gi, oi, { nombre: val })}
                    onQuitar={() => quitarOpcion(gi, oi)}
                    onFoto={onFotoOpcion
                      ? async file => {
                          const url = await onFotoOpcion(g.id, o.id, file)
                          setOpcion(gi, oi, { foto: url })
                        }
                      : null}
                  />
                ))}
              </div>
              <button type="button" className="ap-add-opcion" onClick={() => agregarOpcion(gi)}>
                + Agregar a {g.nombre.toLowerCase()}
              </button>
            </div>
          ))}

          {onBorrar && (
            <button className="ap-borrar" onClick={onBorrar}>Borrar producto</button>
          )}
        </div>
        <div className="pm-footer">
          <button className="btn btn-primary pm-add" onClick={guardar} disabled={guardando || !nombre.trim()}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Una opción (topping/salsa): mini-foto + nombre editable + quitar.
function OpcionEditor({ opcion, onNombre, onQuitar, onFoto }) {
  const [preview, setPreview] = useState(opcion.foto || '')
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(false)

  async function elegir(e) {
    const f = e.target.files?.[0]
    if (!f || !onFoto) return
    const anterior = preview
    setError(false)
    setPreview(URL.createObjectURL(f))
    setSubiendo(true)
    try {
      await onFoto(f) // sube a Storage y guarda la URL real en la opción
    } catch (err) {
      // Si falla la subida, revierte la vista previa y avisa (no guardar en falso).
      console.warn('No se pudo subir la foto de la opción:', err?.code || err)
      setPreview(anterior)
      setError(true)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="ap-opcion">
      <label className={`ap-opcion-foto ${error ? 'ap-opcion-foto-error' : ''}`} title={error ? 'No se pudo subir, intenta de nuevo' : 'Cambiar foto'}>
        {preview ? <img src={preview} alt="" /> : <span>{error ? '⚠️' : (opcion.emoji || '📷')}</span>}
        {subiendo && <span className="ap-opcion-subiendo">…</span>}
        <input type="file" accept="image/*" onChange={elegir} hidden disabled={!onFoto} />
      </label>
      <input
        className="co-input ap-opcion-nombre"
        value={opcion.nombre}
        onChange={e => onNombre(e.target.value)}
        placeholder="Nombre"
      />
      <button type="button" className="ap-opcion-quitar" onClick={onQuitar} aria-label="Quitar">✕</button>
    </div>
  )
}
