import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { copRango, rangoPrecio } from '../../utils/money'
import ImagenApp from '../../components/Imagen/ImagenApp'
import { avisarDemo } from '../../components/Demo/eventosDemo'
import { categoriaActiva, textoHorarioCat } from '../../utils/categorias'
import EditorProducto from './EditorProducto'
import { CategoriaHoja, EliminarCategoria } from './CatalogoCategorias'
import { useArrastre } from './useArrastre'
import { useEntrar } from './PanelPagina'
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

export default function AdminProductos({
  local, productos, onAdd, onUpdate, onDelete, onFoto, onFotoOpcion, onAddCategoria, onReorderCategorias,
  onEditCategoria, onDeleteCategoria, onReorderProductos, onGuardarAdicion, demo,
}) {
  const [editando, setEditando] = useState(null) // producto o { nuevo:true }
  const [sel, setSel] = useState(null)           // id de la categoría elegida (null = la primera con productos)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [orden, setOrden] = useState('menu')
  const [consejoVisto, setConsejoVisto] = useState(leerConsejo)
  const [hojaCat, setHojaCat] = useState(null)   // null | { nueva: true } | { categoria }
  const [borrarCat, setBorrarCat] = useState(null)
  const [menuCat, setMenuCat] = useState(null)   // id de la categoría con el menú ⋯ abierto
  // 📱 Celular: lista de categorías → se entra a sus productos con «‹ Categorías» (sin burbujas).
  const entrar = useEntrar()
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

  // ✋ Arrastrar (D3, D5): las categorías por su manija; los productos solo viendo una categoría
  // en el orden del menú (con filtros u otro orden, «arrastrar» no tendría sentido).
  const arrCats = useArrastre('cats', ids => onReorderCategorias?.(ids.map(id => categorias.find(c => c.id === id)).filter(Boolean)))
  const arrProds = useArrastre('prods', ids => onReorderProductos?.(ids))
  // Cerrar el menú ⋯ al tocar fuera.
  useEffect(() => {
    if (!menuCat) return
    const cerrar = () => setMenuCat(null)
    window.addEventListener('pointerdown', cerrar)
    return () => window.removeEventListener('pointerdown', cerrar)
  }, [menuCat])

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
  const sePuedeArrastrar = !buscando && estado === 'todos' && orden === 'menu' && !!onReorderProductos && actual?.cat.id !== '__sin__'
  const listaVista = sePuedeArrastrar ? arrProds.ordenar(lista.map(p => p.id)).map(id => lista.find(p => p.id === id)).filter(Boolean) : lista
  const catActual = categorias.find(c => c.id === actual?.cat.id)
  const accionesCat = cat => [
    { t: '✏️ Editar', f: () => setHojaCat({ categoria: cat }) },
    { t: cat.pausada ? '▶️ Reanudar' : '⏸️ Pausar', f: () => onEditCategoria?.(cat.id, { pausada: !cat.pausada }) },
    { t: '🗑 Eliminar', f: () => setBorrarCat(cat), peligro: true },
  ]
  const nuevo = categoria => setEditando({ nuevo: true, categoria: categoria && categoria !== '__sin__' ? categoria : categorias[0]?.id })

  const movil = !entrar.esPC
  const verLista = !movil || (!entrar.abierto && !buscando)
  const verProds = !movil || entrar.abierto || buscando

  return (
    <div className={`ap ck${entrar.abierto ? ' ck-dentro' : ''}`}>
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
            {verLista && <div className="ck-lado">
              <aside className="ck-cats" aria-label="Categorías">
                <header className="ck-cats-cab">
                  <span className="ck-tile" aria-hidden="true">🗂️</span>
                  <b>Categorías</b>
                  <span className="ck-num">{grupos.length}</span>
                </header>
                <ul className="ck-cats-lista">
                  {(() => {
                    const ids = grupos.filter(g => g.cat.id !== '__sin__').map(g => g.cat.id)
                    const vistos = [...arrCats.ordenar(ids).map(id => grupos.find(g => g.cat.id === id)), ...grupos.filter(g => g.cat.id === '__sin__')]
                    return vistos.map(({ cat, items }) => {
                      const foto = items.find(p => p.foto)?.foto
                      const on = !buscando && actual?.cat.id === cat.id
                      const real = cat.id !== '__sin__' && onEditCategoria
                      const apagada = real && !categoriaActiva(cat)
                      const nota = real ? textoHorarioCat(cat) : ''
                      return (
                        <li key={cat.id} data-arr="cats" data-id={cat.id} className={`${arrCats.agarrado === cat.id ? 'ck-agarrado' : ''}${menuCat === cat.id ? ' ck-menu-abierto' : ''}`}>
                          <button id={`cat-${cat.id}`} className={`ck-cat${on ? ' on' : ''}${items.length ? '' : ' vacia'}${apagada ? ' apagada' : ''}`}
                            onClick={() => { setSel(cat.id); setQuery(''); entrar.abrir() }} aria-current={on ? 'true' : undefined}>
                            <span className="ck-cat-foto" aria-hidden="true">
                              {foto ? <ImagenApp className="ap-item-foto-img" src={foto} alt="" /> : <i>{cat.emoji || '🍽️'}</i>}
                            </span>
                            <span className="ck-cat-nom">{cat.nombre}{nota && <small className={cat.pausada ? 'pausa' : ''}>{cat.pausada ? '⏸️ ' : '🕒 '}{nota}</small>}</span>
                            <span className="ck-cat-n">{items.length}</span>
                            <span className="ck-cat-flecha" aria-hidden="true">›</span>
                          </button>
                          {real && <>
                            <button className="ck-cat-mas" aria-label={`Opciones de ${cat.nombre}`} aria-haspopup="menu" aria-expanded={menuCat === cat.id}
                              onPointerDown={e => e.stopPropagation()} onClick={() => setMenuCat(menuCat === cat.id ? null : cat.id)}>⋯</button>
                            {onReorderCategorias && !buscando && <button className="ck-manija" {...arrCats.manija(cat.id, ids)}>⠿</button>}
                            {menuCat === cat.id && (
                              <div className="ck-menu" role="menu" onPointerDown={e => e.stopPropagation()}>
                                {accionesCat(cat).map(a => <button key={a.t} role="menuitem" className={a.peligro ? 'peligro' : ''} onClick={() => { setMenuCat(null); a.f() }}>{a.t}</button>)}
                              </div>
                            )}
                          </>}
                        </li>
                      )
                    })
                  })()}
                </ul>
                {onEditCategoria && <button type="button" className="ck-cat-nueva" onClick={() => setHojaCat({ nueva: true })}><span aria-hidden="true">+</span> Nueva categoría</button>}
              </aside>
              {!consejoVisto && (
                <div className="ck-consejo">
                  <span className="ck-consejo-ico" aria-hidden="true">💡</span>
                  <p>Toca una categoría para ver sus productos. Con las flechas <b>↑ ↓</b> la subes o la bajas en tu menú.</p>
                  <button type="button" onClick={cerrarConsejo} aria-label="Cerrar consejo">✕</button>
                </div>
              )}
            </div>}

            {/* ── Productos ── */}
            {verProds && <section id="ck-productos" className="ck-prods">
              {movil && entrar.abierto && !buscando && (
                <div className="pp-volver">
                  <button type="button" onClick={entrar.volver}>‹ Categorías</button>
                  <b>{actual?.cat.nombre}</b>
                </div>
              )}
              <header className="ck-prods-cab">
                <span className="ck-tile" aria-hidden="true">🍽️</span>
                <h3>{buscando
                  ? <>Resultados para <em>“{query.trim()}”</em></>
                  : <>Productos de la categoría: <em>{actual?.cat.nombre}</em></>}</h3>
                <div className="ck-prods-der">
                  {!buscando && catActual && onEditCategoria && (
                    <span className="ck-cat-acc">
                      <button type="button" onClick={() => setHojaCat({ categoria: catActual })}>✏️ <span>Editar categoría</span></button>
                      <button type="button" className="peligro" onClick={() => setBorrarCat(catActual)} aria-label={`Eliminar ${catActual.nombre}`}>🗑</button>
                    </span>
                  )}
                  {!buscando && reordenable && (
                    <span className="ck-mover" role="group" aria-label="Mover la categoría en el menú">
                      <button disabled={idx === 0} onClick={() => moverCategoria(idx, -1)} title="Subir la categoría en el menú" aria-label="Subir la categoría">↑</button>
                      <button disabled={idx === categorias.length - 1} onClick={() => moverCategoria(idx, 1)} title="Bajar la categoría en el menú" aria-label="Bajar la categoría">↓</button>
                    </span>
                  )}
                  <span className="ck-num ck-num-gris">{lista.length} {lista.length === 1 ? 'producto' : 'productos'}</span>
                </div>
              </header>

              {!buscando && catActual && !categoriaActiva(catActual) && (
                <div className="ck-aviso-pausa">
                  <span>{catActual.pausada ? '⏸️' : '🕒'}</span>
                  <p>{catActual.pausada
                    ? <><b>Esta categoría está pausada.</b> No sale en el menú ni en el Menú en Pantalla.</>
                    : <><b>Ahora está fuera de su horario</b> ({textoHorarioCat(catActual)}). Se muestra sola cuando llegue la hora.</>}</p>
                  {catActual.pausada && <button type="button" onClick={() => onEditCategoria?.(catActual.id, { pausada: false })}>▶️ Reanudar</button>}
                </div>
              )}
              {!buscando && actual && !actual.items.length && estado === 'todos' && (
                <p className="ck-vacia">Esta categoría todavía no tiene productos.</p>
              )}
              {!lista.length && (buscando || estado !== 'todos') && (
                <p className="ap-vacio">{buscando ? <>No encontramos “<strong>{query}</strong>”.</> : `No hay productos ${estado} aquí.`}</p>
              )}
              <div className="ck-grid">
                {listaVista.map(p => {
                  const off = p.disponible === false
                  return (
                    <article key={p.id} data-arr="prods" data-id={p.id} className={`ck-prod${off ? ' off' : ''}${arrProds.agarrado === p.id ? ' ck-agarrado' : ''}`}>
                      {sePuedeArrastrar && lista.length > 1 && <button className="ck-manija ck-manija-prod" {...arrProds.manija(p.id, lista.map(x => x.id))}>⠿</button>}
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
            </section>}
          </div>
        )}

      {editando && (
        <EditorProducto
          key={editando.id || 'nuevo'}
          producto={editando}
          local={local}
          productos={productos}
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
          onDuplicar={async (data, fotoFile) => {
            const nuevoId = await onAdd(data)
            if (fotoFile && nuevoId) await onFoto(nuevoId, fotoFile)
            setSel(data.categoria)
            setEditando({ ...data, id: nuevoId })
          }}
          onBorrar={editando.nuevo ? null : async () => { await onDelete(editando.id); setEditando(null) }}
          onFotoOpcion={onFotoOpcion}
          onGuardarAdicion={onGuardarAdicion}
        />
      )}
      {hojaCat && (
        <CategoriaHoja categoria={hojaCat.categoria} onCerrar={() => setHojaCat(null)}
          onGuardar={async c => {
            if (hojaCat.categoria) { await onEditCategoria(hojaCat.categoria.id, c); return }
            const id = await onAddCategoria(c.nombre, c.emoji, { ...(c.pausada ? { pausada: true } : {}), ...(c.horario ? { horario: c.horario } : {}) })
            if (id) { setSel(id); setQuery(''); entrar.abrir() }
          }} />
      )}
      {borrarCat && (
        <EliminarCategoria categoria={borrarCat} demo={demo}
          cuantos={productos.filter(p => p.categoria === borrarCat.id).length}
          otras={categorias.filter(c => c.id !== borrarCat.id)}
          onCerrar={() => setBorrarCat(null)}
          onEliminar={async op => { await onDeleteCategoria(borrarCat.id, op); if (op.moverA) setSel(op.moverA); else { setSel(null); if (entrar.abierto) entrar.volver() } }} />
      )}
    </div>
  )
}
