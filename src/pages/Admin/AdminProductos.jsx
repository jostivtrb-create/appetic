import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { copRango, rangoPrecio } from '../../utils/money'
import ImagenApp from '../../components/Imagen/ImagenApp'
import { construirPromptImagenIA } from '../../utils/promptIA'
import { avisarDemo } from '../../components/Demo/eventosDemo'
import './Catalogo.css'

// 🗂️ CATÁLOGO (Configuración → Catálogo), armado como un panel profesional según la maqueta que
// mandó el usuario (8-nov): «no los botones, sino el orden».
//   • Encabezado grande: Configuración › Catálogo, el título y, en el PC, fotos de sus propios platos.
//   • Barra: «Nuevo producto», el buscador y dos filtros (estado y orden).
//   • Izquierda: el recuadro de CATEGORÍAS (foto, nombre y cuántos productos tiene) y un consejo.
//   • Derecha: los PRODUCTOS de la categoría elegida en tarjetas, con los mismos botones de siempre
//     (Editar y Disponible/Agotado) y una tarjeta para agregar uno ahí mismo.
//   En el celular las categorías pasan a ser una fila de pastillas que se desliza.
//   Al buscar, la derecha muestra lo que coincide de TODAS las categorías.
const ORDENES = [
  { id: 'menu', nombre: 'Como en el menú' },
  { id: 'az', nombre: 'Nombre A-Z' },
  { id: 'barato', nombre: 'Precio: menor a mayor' },
  { id: 'caro', nombre: 'Precio: mayor a menor' },
]
const ESTADOS = [
  { id: 'todos', nombre: 'Todos los estados' },
  { id: 'disponibles', nombre: 'Disponibles' },
  { id: 'agotados', nombre: 'Agotados' },
]
const CONSEJO = 'appetic_catalogo_consejo_visto'
const leerConsejo = () => { try { return localStorage.getItem(CONSEJO) === '1' } catch { return false } }

export default function AdminProductos({ local, slug, productos, onAdd, onUpdate, onDelete, onFoto, onFotoOpcion, onAddCategoria, onReorderCategorias }) {
  const [editando, setEditando] = useState(null) // producto o { nuevo:true }
  const [sel, setSel] = useState(null)           // id de la categoría elegida (null = la primera con productos)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [orden, setOrden] = useState('menu')
  const [consejoVisto, setConsejoVisto] = useState(leerConsejo)
  const categorias = local.categorias || []

  // 🖥️ La barra lateral (PC) lleva a …/catalogo#cat-<id>: se elige esa categoría y se limpia la
  // búsqueda para que no la esconda un filtro viejo.
  const { hash, key: navKey } = useLocation()
  useEffect(() => {
    if (!hash.startsWith('#cat-')) return
    setQuery('')
    setSel(decodeURIComponent(hash.slice(5)))
    requestAnimationFrame(() => document.getElementById('ck-productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [hash, navKey]) // navKey: tocar otra vez la misma categoría vuelve a bajar

  function moverCategoria(i, dir) {
    const j = i + dir
    if (j < 0 || j >= categorias.length) return
    const nuevas = categorias.slice()
    ;[nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]]
    onReorderCategorias?.(nuevas)
  }
  function cerrarConsejo() {
    setConsejoVisto(true)
    try { localStorage.setItem(CONSEJO, '1') } catch { /* sin almacenamiento: vuelve a salir */ }
  }

  // Las categorías en el MISMO orden del menú, con sus productos. Los que no tienen categoría (o
  // la suya ya no existe) van al final en «Sin categoría». Se listan también las vacías: así se ve
  // dónde falta montar productos.
  const grupos = useMemo(() => {
    const l = categorias.map(cat => ({ cat, items: productos.filter(p => p.categoria === cat.id) }))
    const ids = new Set(categorias.map(c => c.id))
    const sueltos = productos.filter(p => !ids.has(p.categoria))
    if (sueltos.length) l.push({ cat: { id: '__sin__', nombre: 'Sin categoría' }, items: sueltos })
    return l
  }, [categorias, productos])
  const actual = grupos.find(g => g.cat.id === sel) || grupos.find(g => g.items.length) || grupos[0]
  const idx = actual ? categorias.findIndex(c => c.id === actual.cat.id) : -1
  const reordenable = onReorderCategorias && categorias.length > 1 && idx >= 0
  const nombreCat = id => categorias.find(c => c.id === id)?.nombre || 'Sin categoría'

  // 🔎 Buscador (nombre o descripción, igual que en el menú) + filtro de estado + orden.
  const q = query.trim().toLowerCase()
  const buscando = q.length > 0
  const lista = useMemo(() => {
    let l = buscando
      ? productos.filter(p => p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q))
      : (actual?.items || [])
    if (estado === 'disponibles') l = l.filter(p => p.disponible !== false)
    if (estado === 'agotados') l = l.filter(p => p.disponible === false)
    const precio = p => rangoPrecio(p).min || 0
    if (orden === 'az') l = [...l].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    if (orden === 'barato') l = [...l].sort((a, b) => precio(a) - precio(b))
    if (orden === 'caro') l = [...l].sort((a, b) => precio(b) - precio(a))
    return l
  }, [buscando, q, productos, actual, estado, orden])
  const agotados = productos.filter(p => p.disponible === false).length
  // Las fotos de sus propios platos adornan el encabezado (en el PC).
  const adorno = useMemo(() => productos.filter(p => p.foto && p.disponible !== false).slice(0, 3).map(p => p.foto), [productos])
  const nuevo = categoria => setEditando({ nuevo: true, categoria: categoria && categoria !== '__sin__' ? categoria : categorias[0]?.id })

  return (
    <div className="ap ck">
      {/* ── Encabezado ── */}
      <header className="ck-hero">
        <div className="ck-hero-txt">
          <p className="ck-miga">Configuración <span aria-hidden="true">›</span> <b>Catálogo</b></p>
          <div className="ck-hero-tit">
            <span className="ck-hero-ico" aria-hidden="true">🍔</span>
            <div>
              <h2>Catálogo del menú</h2>
              <p>Organiza tus productos, categorías y precios</p>
            </div>
          </div>
          <ul className="ck-resumen" aria-label="Resumen del catálogo">
            <li><b>{productos.length}</b> productos</li>
            <li><b>{categorias.length}</b> categorías</li>
            {agotados > 0 && <li className="ck-resumen-off"><b>{agotados}</b> {agotados === 1 ? 'agotado' : 'agotados'}</li>}
          </ul>
        </div>
        {adorno.length > 0 && (
          <div className="ck-hero-fotos" aria-hidden="true">
            {adorno.map((f, i) => <span key={f} className={`ck-hero-foto f${i}`}><ImagenApp className="ap-item-foto-img" src={f} alt="" /></span>)}
          </div>
        )}
      </header>

      {/* ── Barra de herramientas ── */}
      <div className="ck-barra">
        <button className="btn btn-primary ck-add" onClick={() => nuevo(actual?.cat.id)}><span aria-hidden="true">+</span> Nuevo producto</button>
        <div className="ap-buscar ck-buscar">
          <svg className="ap-buscar-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input type="search" className="ap-buscar-input" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar producto…" aria-label="Buscar producto" />
          {query && <button className="ap-buscar-clear" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">✕</button>}
        </div>
        <label className={`ck-filtro ck-filtro-estado e-${estado}`}>
          <span className="ck-punto" aria-hidden="true" />
          <select value={estado} onChange={e => setEstado(e.target.value)} aria-label="Filtrar por estado">
            {ESTADOS.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </label>
        <label className="ck-filtro">
          <span className="ck-filtro-lbl">Ordenar:</span>
          <select value={orden} onChange={e => setOrden(e.target.value)} aria-label="Ordenar productos">
            {ORDENES.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </label>
      </div>

      {productos.length === 0 && !categorias.length
        ? <p className="ap-vacio">Aún no hay productos. Agrega el primero.</p>
        : (
          <div className="ck-cuerpo">
            {/* ── Categorías ── */}
            <div className="ck-lado">
              <aside className="ck-cats" aria-label="Categorías">
                <header className="ck-cats-cab">
                  <span className="ck-tile" aria-hidden="true">🗂️</span>
                  <b>Categorías</b>
                  <span className="ck-num">{grupos.length}</span>
                </header>
                <ul className="ck-cats-lista">
                  {grupos.map(({ cat, items }) => {
                    const foto = items.find(p => p.foto)?.foto
                    const on = !buscando && actual?.cat.id === cat.id
                    return (
                      <li key={cat.id}>
                        <button id={`cat-${cat.id}`} className={`ck-cat${on ? ' on' : ''}${items.length ? '' : ' vacia'}`}
                          onClick={() => { setSel(cat.id); setQuery('') }} aria-current={on ? 'true' : undefined}>
                          <span className="ck-cat-foto" aria-hidden="true">
                            {foto ? <ImagenApp className="ap-item-foto-img" src={foto} alt="" /> : <i>{cat.emoji || '🍽️'}</i>}
                          </span>
                          <span className="ck-cat-nom">{cat.nombre}</span>
                          <span className="ck-cat-n">{items.length}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </aside>
              {!consejoVisto && (
                <div className="ck-consejo">
                  <span className="ck-consejo-ico" aria-hidden="true">💡</span>
                  <p>Toca una categoría para ver sus productos. Con las flechas <b>↑ ↓</b> la subes o la bajas en tu menú.</p>
                  <button type="button" onClick={cerrarConsejo} aria-label="Cerrar consejo">✕</button>
                </div>
              )}
            </div>

            {/* ── Productos ── */}
            <section id="ck-productos" className="ck-prods">
              <header className="ck-prods-cab">
                <span className="ck-tile" aria-hidden="true">🍽️</span>
                <h3>{buscando
                  ? <>Resultados para <em>“{query.trim()}”</em></>
                  : <>Productos de la categoría: <em>{actual?.cat.nombre}</em></>}</h3>
                <div className="ck-prods-der">
                  {!buscando && reordenable && (
                    <span className="ck-mover" role="group" aria-label="Mover la categoría en el menú">
                      <button disabled={idx === 0} onClick={() => moverCategoria(idx, -1)} title="Subir la categoría en el menú" aria-label="Subir la categoría">↑</button>
                      <button disabled={idx === categorias.length - 1} onClick={() => moverCategoria(idx, 1)} title="Bajar la categoría en el menú" aria-label="Bajar la categoría">↓</button>
                    </span>
                  )}
                  <span className="ck-num ck-num-gris">{lista.length} {lista.length === 1 ? 'producto' : 'productos'}</span>
                </div>
              </header>

              {!lista.length && (buscando || estado !== 'todos') && (
                <p className="ap-vacio">{buscando ? <>No encontramos “<strong>{query}</strong>”.</> : `No hay productos ${estado} aquí.`}</p>
              )}
              <div className="ck-grid">
                {lista.map(p => {
                  const off = p.disponible === false
                  return (
                    <article key={p.id} className={`ck-prod${off ? ' off' : ''}`}>
                      <div className="ck-prod-top">
                        <div className="ck-prod-foto"><ImagenApp className="ap-item-foto-img" src={p.foto} alt="" /></div>
                        <div className="ck-prod-info">
                          <h4>{p.nombre}</h4>
                          {/* El dueño ve el mismo rango que ve su cliente en el menú. */}
                          <span className="ck-prod-precio">{(() => { const { min, max } = rangoPrecio(p); return copRango(min, max) })()}</span>
                          <span className={`ck-chip ${off ? 'off' : 'on'}`}>{off ? 'Agotado' : 'Disponible'}</span>
                          {buscando && <small className="ck-prod-cat">{nombreCat(p.categoria)}</small>}
                        </div>
                      </div>
                      <div className="ck-prod-acc">
                        <button className="ck-editar" onClick={() => { setEditando(p); avisarDemo('editar-producto') }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
                          Editar
                        </button>
                        <button type="button" role="switch" aria-checked={!off} className={`ck-switch${off ? '' : ' on'}`}
                          onClick={() => onUpdate(p.id, { disponible: off })}
                          title={off ? 'Agotado: toca para volver a ofrecerlo' : 'Disponible: toca para marcarlo agotado'}
                          aria-label={`${p.nombre}: ${off ? 'agotado' : 'disponible'}`}>
                          <span />
                        </button>
                      </div>
                    </article>
                  )
                })}
                {!buscando && actual && estado === 'todos' && (
                  <button className="ck-nuevo" onClick={() => nuevo(actual.cat.id)}>
                    <span aria-hidden="true">+</span>
                    <b>Agregar producto</b>
                    <small>Crear un nuevo producto<br />en {actual.cat.nombre}</small>
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

      {editando && (
        <EditorProducto
          producto={editando}
          local={local}
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

function EditorProducto({ producto, local, categorias, onAddCategoria, onCerrar, onGuardar, onBorrar, onFotoOpcion }) {
  const [nombre, setNombre] = useState(producto.nombre || '')
  const [descripcion, setDescripcion] = useState(producto.descripcion || '')
  const [categoria, setCategoria] = useState(producto.categoria || categorias[0]?.id || '')
  const [destacado, setDestacado] = useState(!!producto.destacado)
  const [enTV, setEnTV] = useState(!producto.ocultoTV)
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
  // Aviso del flujo "Crear con IA": guarda el prompt para mostrar instrucciones + re-copiar.
  const [avisoIA, setAvisoIA] = useState(null) // null | { prompt }
  // Candado a prueba de doble-toque: evita crear productos duplicados si se
  // pulsa "Guardar" muy rápido, antes de que el botón alcance a deshabilitarse.
  const guardandoRef = useRef(false)

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

  // --- Cuántas opciones del grupo puede elegir el cliente SEGÚN el tamaño ---
  // Ej.: pizza familiar → 3 sabores; personal → 1. Se guarda por id de tamaño,
  // así que renombrar un tamaño no rompe la regla.
  function setMaxVariante(gi, varianteId, valor) {
    const n = Math.max(0, Number(String(valor).replace(/\D/g, '')) || 0)
    setGrupos(gs => gs.map((g, j) => {
      if (j !== gi) return g
      const mapa = { ...(g.maxPorVariante || {}) }
      if (n > 0) mapa[varianteId] = n
      else delete mapa[varianteId]   // vacío = sin regla propia, vale el tope general
      return { ...g, maxPorVariante: mapa }
    }))
  }

  // --- Edición de "precios por tamaño" (variantes) ---
  // id único para un tamaño nuevo (v1, v2, … evitando choques).
  function nuevoVarianteId(vs) {
    const usados = new Set((vs || []).map(v => v.id))
    let n = (vs?.length || 0) + 1
    let id = `v${n}`
    while (usados.has(id)) { n++; id = `v${n}` }
    return id
  }
  function setVariante(i, cambios) {
    setVariantes(vs => vs.map((x, j) => j === i ? { ...x, ...cambios } : x))
  }
  function agregarVariante() {
    setVariantes(vs => [...(vs || []), { id: nuevoVarianteId(vs), nombre: '', precio: '' }])
  }
  function quitarVariante(i) {
    // Al quitar el último tamaño, el producto vuelve a "un solo precio".
    setVariantes(vs => {
      const next = (vs || []).filter((_, j) => j !== i)
      return next.length ? next : null
    })
  }
  function activarVariantes() {
    // Convierte "un solo precio" en "precios por tamaño": siembra el 1er tamaño con el precio actual.
    setVariantes([{ id: 'v1', nombre: '', precio: precio || '' }])
  }
  function usarPrecioUnico() {
    // Vuelve a un solo precio; conserva el menor de los tamaños como base.
    const precios = (variantes || []).map(v => Number(v.precio) || 0).filter(Boolean)
    if (precios.length) setPrecio(String(Math.min(...precios)))
    setVariantes(null)
  }

  function elegirFoto(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFotoFile(f)
    setFotoPreview(URL.createObjectURL(f))
  }

  // ✨ Crear foto con IA: arma el prompt (foto realista + colores del local), lo copia al
  // portapapeles y abre Gemini en otra pestaña. El dueño pega, genera, descarga y la sube
  // con "Del dispositivo". Sirve para la foto del producto (tipo 'producto') y de cada
  // opción/topping (tipo 'opcion').
  function crearFotoConIA({ nombre: n, descripcion: d = '', tipo = 'producto' }) {
    if (!n || !n.trim()) {
      alert(tipo === 'opcion'
        ? 'Escribe primero el nombre de la opción para crear su foto.'
        : 'Escribe primero el nombre del producto para crear su foto.')
      return
    }
    const prompt = construirPromptImagenIA({ nombre: n, descripcion: d, tipo, local })
    // Copiar al portapapeles (sin bloquear) y abrir Gemini en el MISMO gesto del click.
    try { navigator.clipboard?.writeText(prompt) } catch { /* fallback: botón "Copiar" del aviso */ }
    window.open('https://gemini.google.com/app', '_blank', 'noopener')
    setAvisoIA({ prompt })
  }

  async function guardar() {
    if (guardandoRef.current) return // ya hay un guardado en curso: no dupliques
    if (!nombre.trim()) return
    if (creandoCat && !nuevaCat.trim()) { alert('Escribe el nombre de la nueva categoría.'); return }
    guardandoRef.current = true
    setGuardando(true)
    // Si eligió "crear categoría nueva", créala primero y usa su id.
    let categoriaFinal = categoria
    if (creandoCat) {
      try {
        const id = await onAddCategoria(nuevaCat, nuevaCatEmoji)
        if (!id) { guardandoRef.current = false; setGuardando(false); return }
        categoriaFinal = id
      } catch (err) {
        console.error('No se pudo crear la categoría:', err)
        alert('No se pudo crear la categoría. Intenta de nuevo.')
        guardandoRef.current = false
        setGuardando(false)
        return
      }
    }
    const data = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria: categoriaFinal,
      destacado,
      ocultoTV: !enTV,
    }
    if (tieneVariantes) {
      // Descarta tamaños sin nombre; guarda el resto con precio numérico.
      const limpias = variantes.filter(v => v.nombre.trim())
        .map(v => ({ ...v, nombre: v.nombre.trim(), precio: Number(v.precio) || 0 }))
      if (limpias.length) {
        data.variantes = limpias
        data.precio = null // limpia el precio único viejo para que no reaparezca
      } else {
        // Todos los tamaños quedaron vacíos → guarda como precio único.
        data.variantes = null
        data.precio = Number(precio) || 0
      }
    } else {
      data.precio = Number(precio) || 0
      data.variantes = null // limpia tamaños viejos al pasar a precio único
    }
    if (tieneGrupos) {
      // Los topes por tamaño se limpian contra los tamaños que quedaron guardados:
      // si el dueño borró un tamaño (o volvió a precio único), su regla se va con él
      // y no queda basura apuntando a un id que ya no existe.
      const idsVigentes = new Set((data.variantes || []).map(v => v.id))
      data.gruposOpciones = grupos.map(g => {
        const mapa = {}
        for (const [vid, n] of Object.entries(g.maxPorVariante || {})) {
          if (idsVigentes.has(vid) && Number(n) > 0) mapa[vid] = Number(n)
        }
        return {
          ...g,
          maxPorVariante: mapa,
          opciones: g.opciones
            .filter(o => o.nombre.trim()) // descarta opciones sin nombre
            .map(o => ({ ...o, nombre: o.nombre.trim(), precioExtra: Number(o.precioExtra) || 0 })),
        }
      })
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
      guardandoRef.current = false
      setGuardando(false)
    }
  }

  return (
    <div className="pm-overlay" onClick={guardando ? undefined : onCerrar}>
      <div className="pm-sheet" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onCerrar} disabled={guardando}>✕</button>
        <div className="pm-body">
          <h2 className="pm-nombre">{producto.nuevo ? 'Nuevo producto' : 'Editar producto'}</h2>

          <div className="ap-foto-bloque">
            <div className="ap-foto-preview">
              {fotoPreview ? <img src={fotoPreview} alt="" /> : <span>📷</span>}
            </div>
            <div className="ap-foto-acciones">
              <label className="ap-foto-btn">
                📱 Del dispositivo
                <input type="file" accept="image/*" onChange={elegirFoto} hidden />
              </label>
              <button
                type="button"
                className="ap-foto-btn ap-foto-btn-ia"
                onClick={() => crearFotoConIA({ nombre, descripcion, tipo: 'producto' })}
              >
                ✨ Crear con IA
              </button>
            </div>
          </div>

          {avisoIA && (
            <div className="ap-ia-aviso">
              <button className="ap-ia-aviso-x" onClick={() => setAvisoIA(null)} aria-label="Cerrar">✕</button>
              <p className="ap-ia-aviso-tit">✨ Abrimos <strong>Gemini</strong> en otra pestaña</p>
              <ol className="ap-ia-aviso-pasos">
                <li>Pega el prompt (ya copiado) con <strong>Ctrl/Cmd + V</strong> y envía.</li>
                <li>Cuando Gemini genere la imagen, <strong>descárgala</strong>.</li>
                <li>Vuelve aquí y súbela con <strong>📱 Del dispositivo</strong>.</li>
              </ol>
              <button
                type="button"
                className="ap-ia-aviso-copiar"
                onClick={() => { try { navigator.clipboard?.writeText(avisoIA.prompt) } catch {} }}
              >
                📋 Copiar el prompt de nuevo
              </button>
            </div>
          )}

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

          <label className="ac-switch">
            <span>📺 Mostrar en el Menú en Pantalla</span>
            <input type="checkbox" checked={enTV} onChange={e => setEnTV(e.target.checked)} />
          </label>

          {tieneVariantes ? (
            <>
              <div className="ap-precio-head">
                <label className="ap-label">Precios por tamaño</label>
                <button type="button" className="ap-precio-modo" onClick={usarPrecioUnico}>
                  Usar un solo precio
                </button>
              </div>
              {variantes.map((v, i) => (
                <div key={v.id} className="ap-variante">
                  <input
                    className="co-input ap-variante-nombre"
                    value={v.nombre}
                    onChange={e => setVariante(i, { nombre: e.target.value })}
                    placeholder="Tamaño (ej: 350 ml)"
                  />
                  <input
                    className="co-input ap-variante-precio"
                    inputMode="numeric"
                    value={v.precio}
                    onChange={e => setVariante(i, { precio: e.target.value.replace(/\D/g, '') })}
                    placeholder="4000"
                  />
                  <button
                    type="button"
                    className="ap-opcion-quitar"
                    onClick={() => quitarVariante(i)}
                    aria-label={`Quitar tamaño ${v.nombre || ''}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="ap-add-opcion" onClick={agregarVariante}>
                + Agregar tamaño
              </button>
            </>
          ) : (
            <>
              <label className="ap-label">Precio</label>
              <input className="co-input" inputMode="numeric" value={precio} onChange={e => setPrecio(e.target.value.replace(/\D/g, ''))} placeholder="14000" />
              <button type="button" className="ap-add-opcion ap-precio-tamano" onClick={activarVariantes}>
                + Usar precios por tamaño
              </button>
            </>
          )}

          {/* Grupos de opciones (toppings / salsas) con su foto */}
          {tieneGrupos && grupos.map((g, gi) => (
            <div key={g.id} className="ap-grupo">
              <label className="ap-label">{g.emoji} {g.nombre}</label>

              {/* 🍕 Cuántas puede elegir el cliente SEGÚN el tamaño.
                  Solo aparece con precios por tamaño: sin tamaños no hay nada que
                  diferenciar. Dejarlo vacío = vale el tope de siempre del grupo. */}
              {tieneVariantes && (
                <div className="ap-topes">
                  <p className="ap-topes-titulo">¿Cuántas puede elegir el cliente?</p>
                  <p className="ap-topes-ayuda">
                    Una por cada tamaño. Ej.: la familiar lleva 3 sabores y la personal 1.
                    En blanco, el cliente elige {g.max ?? 1}.
                  </p>
                  {variantes.filter(v => v.nombre.trim()).map(v => (
                    <div key={v.id} className="ap-tope">
                      <span className="ap-tope-nombre">{v.nombre}</span>
                      <input
                        className="co-input ap-tope-num"
                        inputMode="numeric"
                        value={g.maxPorVariante?.[v.id] ?? ''}
                        onChange={e => setMaxVariante(gi, v.id, e.target.value)}
                        placeholder={String(g.max ?? 1)}
                        aria-label={`Cuántas ${g.nombre.toLowerCase()} puede elegir en ${v.nombre}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="ap-opciones">
                {g.opciones.map((o, oi) => (
                  <OpcionEditor
                    key={o.id}
                    opcion={o}
                    onNombre={val => setOpcion(gi, oi, { nombre: val })}
                    onQuitar={() => quitarOpcion(gi, oi)}
                    onCrearIA={() => crearFotoConIA({ nombre: o.nombre, tipo: 'opcion' })}
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

        {/* Indicador de carga bloqueante: cubre el formulario mientras se guarda
            (y sube la foto), para que se vea que está trabajando y no se pulse
            "Guardar" de nuevo ni se cierre la app —evita productos duplicados. */}
        {guardando && (
          <div className="pm-loading" role="status" aria-live="polite">
            <div className="local-spinner" />
            <p className="pm-loading-txt">{fotoFile ? 'Subiendo foto y guardando…' : 'Guardando…'}</p>
            <p className="pm-loading-sub">No cierres la app. Con fotos grandes puede tardar unos segundos.</p>
            <div className="pm-loading-bar"><span /></div>
          </div>
        )}
      </div>
    </div>
  )
}

// Una opción (topping/salsa): mini-foto + nombre editable + crear con IA + quitar.
function OpcionEditor({ opcion, onNombre, onQuitar, onCrearIA, onFoto }) {
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
      {onCrearIA && (
        <button type="button" className="ap-opcion-ia" onClick={onCrearIA} title="Crear foto con IA" aria-label="Crear foto con IA">✨</button>
      )}
      <button type="button" className="ap-opcion-quitar" onClick={onQuitar} aria-label="Quitar">✕</button>
    </div>
  )
}
