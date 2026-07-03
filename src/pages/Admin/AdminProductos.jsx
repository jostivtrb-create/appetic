import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cop } from '../../utils/money'
import ImagenApp from '../../components/Imagen/ImagenApp'

export default function AdminProductos({ local, slug, productos, onAdd, onUpdate, onDelete, onFoto, onFotoOpcion, onAddCategoria, onReorderCategorias }) {
  const [editando, setEditando] = useState(null) // producto o { nuevo:true }
  const [menuCatOrden, setMenuCatOrden] = useState(null) // id de la categoría con el menú Subir/Bajar abierto
  const [expandidas, setExpandidas] = useState(() => new Set()) // ids desplegadas (por defecto: todas minimizadas)
  const [query, setQuery] = useState('')

  function toggleCategoria(id) {
    setExpandidas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const categorias = local.categorias || []

  function moverCategoria(i, dir) {
    const j = i + dir
    if (j < 0 || j >= categorias.length) return
    const nuevas = categorias.slice()
    ;[nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]]
    onReorderCategorias?.(nuevas)
  }

  // 🔎 Buscador: filtra por nombre o descripción (igual que en el menú).
  const q = query.trim().toLowerCase()
  const buscando = q.length > 0
  const productosFiltrados = useMemo(() => {
    if (!buscando) return productos
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q)
    )
  }, [buscando, q, productos])

  // 🗂️ Agrupados por categoría en el MISMO orden del menú. Los productos cuya
  // categoría ya no existe (o que no tienen) caen al final en "Sin categoría".
  const grupos = useMemo(() => {
    const secciones = categorias
      .map(cat => ({ cat, items: productosFiltrados.filter(p => p.categoria === cat.id) }))
      .filter(g => g.items.length > 0)
    const idsValidos = new Set(categorias.map(c => c.id))
    const sueltos = productosFiltrados.filter(p => !idsValidos.has(p.categoria))
    if (sueltos.length) secciones.push({ cat: { id: '__sin__', nombre: 'Sin categoría' }, items: sueltos })
    return secciones
  }, [categorias, productosFiltrados])

  return (
    <div className="ap">
      {slug && (
        <Link to={`/${slug}`} className="ap-ver-menu">
          <span className="ap-ver-menu-icon" aria-hidden="true">👁️</span>
          Ver mi menú
          <span className="ap-ver-menu-arrow" aria-hidden="true">→</span>
        </Link>
      )}

      <button className="btn btn-primary ap-add" onClick={() => setEditando({ nuevo: true, categoria: categorias[0]?.id })}>
        + Agregar producto
      </button>

      {productos.length > 0 && (
        <div className="ap-buscar">
          <svg className="ap-buscar-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            className="ap-buscar-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar producto…"
            aria-label="Buscar producto"
          />
          {query && (
            <button className="ap-buscar-clear" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">✕</button>
          )}
        </div>
      )}

      {productos.length === 0 && <p className="ap-vacio">Aún no hay productos. Agrega el primero.</p>}

      {productos.length > 0 && grupos.length === 0 && (
        <p className="ap-vacio">No encontramos “<strong>{query}</strong>”.</p>
      )}

      {grupos.map(({ cat, items }) => {
        // Índice real de la categoría (para Subir/Bajar). "Sin categoría" (__sin__)
        // no es una categoría de verdad: no se puede reordenar.
        const idx = categorias.findIndex(c => c.id === cat.id)
        const reordenable = onReorderCategorias && categorias.length > 1 && idx >= 0
        // Por defecto minimizada; se despliega si está en `expandidas`. Al buscar,
        // se ignora el minimizado para no esconder resultados.
        const colapsada = !expandidas.has(cat.id) && !buscando
        return (
        <section key={cat.id} className="ap-grupo-cat">
          <div className="ap-grupo-cat-head">
            <button
              className="ap-grupo-cat-title"
              onClick={() => toggleCategoria(cat.id)}
              aria-expanded={!colapsada}
              title={colapsada ? 'Desplegar' : 'Minimizar'}
            >
              <span className={`ap-grupo-cat-chevron ${colapsada ? 'col' : ''}`}>⌄</span>
              {cat.emoji ? `${cat.emoji} ` : ''}{cat.nombre} <span className="ap-grupo-cat-count">· {items.length}</span>
            </button>
            {reordenable && (
              <div className="ap-cat-orden">
                <button
                  className="ap-cat-orden-btn"
                  onClick={() => setMenuCatOrden(menuCatOrden === cat.id ? null : cat.id)}
                  aria-haspopup="true"
                  aria-expanded={menuCatOrden === cat.id}
                  aria-label="Ordenar categoría"
                >
                  ⇅
                </button>
                {menuCatOrden === cat.id && (
                  <div className="ap-cat-orden-menu">
                    {idx > 0 && (
                      <button onClick={() => { moverCategoria(idx, -1); setMenuCatOrden(null) }}>↑ Subir</button>
                    )}
                    {idx < categorias.length - 1 && (
                      <button onClick={() => { moverCategoria(idx, 1); setMenuCatOrden(null) }}>↓ Bajar</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {!colapsada && (
          <div className="ap-lista">
            {items.map(p => (
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
          )}
        </section>
        )
      })}

      {editando && (
        <EditorProducto
          producto={editando}
          categorias={categorias}
          onAddCategoria={onAddCategoria}
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

function EditorProducto({ producto, categorias, onAddCategoria, onCerrar, onGuardar, onBorrar, onFotoOpcion }) {
  const [nombre, setNombre] = useState(producto.nombre || '')
  const [descripcion, setDescripcion] = useState(producto.descripcion || '')
  const [categoria, setCategoria] = useState(producto.categoria || categorias[0]?.id || '')
  const [destacado, setDestacado] = useState(!!producto.destacado)
  const [nuevaCat, setNuevaCat] = useState('')          // nombre de categoría nueva
  const [nuevaCatEmoji, setNuevaCatEmoji] = useState('')
  const creandoCat = categoria === '__nueva__'
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
    if (creandoCat && !nuevaCat.trim()) { alert('Escribe el nombre de la nueva categoría.'); return }
    setGuardando(true)
    // Si eligió "crear categoría nueva", créala primero y usa su id.
    let categoriaFinal = categoria
    if (creandoCat) {
      try {
        const id = await onAddCategoria(nuevaCat, nuevaCatEmoji)
        if (!id) { setGuardando(false); return }
        categoriaFinal = id
      } catch (err) {
        console.error('No se pudo crear la categoría:', err)
        alert('No se pudo crear la categoría. Intenta de nuevo.')
        setGuardando(false)
        return
      }
    }
    const data = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria: categoriaFinal,
      destacado,
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
            {onAddCategoria && <option value="__nueva__">➕ Crear categoría nueva…</option>}
          </select>
          {creandoCat && (
            <div className="ap-nueva-cat">
              <input
                className="co-input"
                value={nuevaCat}
                onChange={e => setNuevaCat(e.target.value)}
                placeholder="Nombre de la categoría (ej: Postres)"
                autoFocus
              />
              <input
                className="co-input ap-cat-emoji"
                value={nuevaCatEmoji}
                onChange={e => setNuevaCatEmoji(e.target.value)}
                placeholder="🍮"
                maxLength={2}
                aria-label="Emoji (opcional)"
              />
            </div>
          )}

          <label className="ac-switch ap-fuerte">
            <span>⭐ Nuestro fuerte</span>
            <input type="checkbox" checked={destacado} onChange={e => setDestacado(e.target.checked)} />
          </label>
          <p className="ac-hint">Resáltalo como el plato estrella de su categoría. Solo uno por categoría: al marcar este, se quita el de los demás.</p>

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
          <button className="btn btn-primary pm-add" onClick={guardar} disabled={guardando || !nombre.trim() || (creandoCat && !nuevaCat.trim())}>
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
