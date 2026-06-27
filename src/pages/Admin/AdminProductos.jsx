import { useState } from 'react'
import { cop } from '../../utils/money'

export default function AdminProductos({ local, productos, onAdd, onUpdate, onDelete, onFoto }) {
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
              {p.foto ? <img src={p.foto} alt="" /> : <span>🍽️</span>}
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
        />
      )}
    </div>
  )
}

function EditorProducto({ producto, categorias, onCerrar, onGuardar, onBorrar }) {
  const [nombre, setNombre] = useState(producto.nombre || '')
  const [descripcion, setDescripcion] = useState(producto.descripcion || '')
  const [categoria, setCategoria] = useState(producto.categoria || categorias[0]?.id || '')
  const [precio, setPrecio] = useState(producto.precio || '')
  const [variantes, setVariantes] = useState(producto.variantes ? producto.variantes.map(v => ({ ...v })) : null)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(producto.foto || '')
  const [guardando, setGuardando] = useState(false)

  const tieneVariantes = Array.isArray(variantes) && variantes.length > 0

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
    await onGuardar(data, fotoFile)
    setGuardando(false)
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
