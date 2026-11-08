import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { construirPromptImagenIA } from '../../utils/promptIA'
import { cop } from '../../utils/money'
import { adicionesDe, grupoNuevo, opcionDesde, textoReglas, usosDe } from '../../utils/adiciones'
import { Ventana } from './CatalogoCategorias'
import './EditorProducto.css'

// ✏️ EDITOR DE PRODUCTO (guía «Editar el catálogo» D1, D2, D4, D9–D11, S9, S13–S14).
// Un panel que se desliza desde la derecha (pantalla completa en el celular), con PESTAÑAS:
//   General     foto, nombre, descripción, categoría y ⭐ fuerte
//   Precios     un solo precio o precios por tamaño
//   Adiciones   grupos («Adiciones», «Elige tu salsa»…) armados con la BIBLIOTECA del local
//   Dónde sale  disponible y Menú en Pantalla
// Abajo: Borrar, Duplicar y Guardar. Si cierras con cambios sin guardar, pregunta antes.

const PESTANAS = [
  { id: 'general', nombre: 'General', ico: '📝' },
  { id: 'precios', nombre: 'Precios', ico: '💲' },
  { id: 'adiciones', nombre: 'Adiciones', ico: '➕' },
  { id: 'sale', nombre: 'Dónde sale', ico: '👁️' },
]

const copiaGrupos = gs => (gs ? gs.map(g => ({ ...g, opciones: (g.opciones || []).map(o => ({ ...o })) })) : [])

export default function EditorProducto({
  producto, local, productos, categorias, onAddCategoria, onCerrar, onGuardar, onBorrar, onDuplicar,
  onFotoOpcion, onGuardarAdicion,
}) {
  const [pestana, setPestana] = useState('general')
  const [nombre, setNombre] = useState(producto.nombre || '')
  const [descripcion, setDescripcion] = useState(producto.descripcion || '')
  const [categoria, setCategoria] = useState(producto.categoria || categorias[0]?.id || '')
  const [destacado, setDestacado] = useState(!!producto.destacado)
  const [enTV, setEnTV] = useState(!producto.ocultoTV)
  const [disponible, setDisponible] = useState(producto.disponible !== false)
  const [nuevaCat, setNuevaCat] = useState('')
  const creandoCat = categoria === '__nueva__'
  const [precio, setPrecio] = useState(producto.precio ?? '')
  const [variantes, setVariantes] = useState(producto.variantes?.length ? producto.variantes.map(v => ({ ...v })) : null)
  const [grupos, setGrupos] = useState(() => copiaGrupos(producto.gruposOpciones))
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(producto.foto || '')
  const [guardando, setGuardando] = useState(false)
  const [avisoIA, setAvisoIA] = useState(null)
  const [salir, setSalir] = useState(false)          // ¿preguntando si sale sin guardar?
  const [borrar, setBorrar] = useState(false)        // ¿confirmando borrar?
  const [eligiendo, setEligiendo] = useState(null)   // índice del grupo al que se le agregan adicionales
  const guardandoRef = useRef(false)

  const tieneVariantes = Array.isArray(variantes) && variantes.length > 0

  // 📝 ¿Hay cambios sin guardar? Se compara contra cómo estaba al abrir (D10).
  const foto = () => JSON.stringify({ nombre, descripcion, categoria, destacado, enTV, disponible, precio: String(precio ?? ''), variantes, grupos, f: !!fotoFile, nuevaCat })
  const inicial = useRef(null)
  if (inicial.current === null) inicial.current = foto()
  const cambiado = foto() !== inicial.current

  function intentarCerrar() {
    if (guardando) return
    if (cambiado) setSalir(true)
    else onCerrar()
  }
  useEffect(() => {
    const tecla = e => { if (e.key === 'Escape' && !eligiendo && !salir && !borrar) intentarCerrar() }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  // ── Precios por tamaño ──
  function nuevoVarianteId(vs) {
    const usados = new Set((vs || []).map(v => v.id))
    let n = (vs?.length || 0) + 1
    while (usados.has(`v${n}`)) n++
    return `v${n}`
  }
  const setVariante = (i, c) => setVariantes(vs => vs.map((x, j) => (j === i ? { ...x, ...c } : x)))
  const agregarVariante = () => setVariantes(vs => [...(vs || []), { id: nuevoVarianteId(vs), nombre: '', precio: '' }])
  const quitarVariante = i => setVariantes(vs => { const n = (vs || []).filter((_, j) => j !== i); return n.length ? n : null })
  const activarVariantes = () => setVariantes([{ id: 'v1', nombre: '', precio: precio || '' }])
  function usarPrecioUnico() {
    const ps = (variantes || []).map(v => Number(v.precio) || 0).filter(Boolean)
    if (ps.length) setPrecio(String(Math.min(...ps)))
    setVariantes(null)
  }

  // ── Grupos de adiciones (S14) ──
  const setGrupo = (gi, c) => setGrupos(gs => gs.map((g, j) => (j === gi ? { ...g, ...c } : g)))
  function reglas(gi, { obligatorio, max }) {
    setGrupos(gs => gs.map((g, j) => {
      if (j !== gi) return g
      const ob = obligatorio ?? g.min > 0
      const mx = Math.max(1, Math.min(20, Number(max ?? g.max) || 1))
      const min = ob ? 1 : 0
      return { ...g, min, max: mx, tipo: mx === 1 ? 'unica' : 'multiple', subtitulo: textoReglas({ min, max: mx }) }
    }))
  }
  const agregarGrupo = obligatorio => setGrupos(gs => [...gs, grupoNuevo(gs, obligatorio ? { nombre: 'Elige tu opción', obligatorio: true, max: 1 } : {})])
  const quitarGrupo = gi => setGrupos(gs => gs.filter((_, j) => j !== gi))
  const quitarOpcion = (gi, oi) => setGrupos(gs => gs.map((g, j) => (j !== gi ? g : { ...g, opciones: g.opciones.filter((_, k) => k !== oi) })))
  function moverGrupo(gi, d) {
    setGrupos(gs => { const n = [...gs]; const [x] = n.splice(gi, 1); n.splice(gi + d, 0, x); return n })
  }
  // Marca o desmarca un adicional de la biblioteca en un grupo.
  function alternar(gi, ad) {
    setGrupos(gs => gs.map((g, j) => {
      if (j !== gi) return g
      const ya = g.opciones.some(o => o.ref === ad.id)
      if (ya) return { ...g, opciones: g.opciones.filter(o => o.ref !== ad.id) }
      const usados = new Set(g.opciones.map(o => o.id))
      let id = ad.id, n = 2
      while (usados.has(id)) id = `${ad.id}-${n++}`
      return { ...g, opciones: [...g.opciones, opcionDesde(ad, id)] }
    }))
  }
  // Cambió un adicional de la biblioteca (precio, nombre o foto): las copias de ESTE editor también.
  function copiarCambio(ad) {
    setGrupos(gs => gs.map(g => ({
      ...g,
      opciones: g.opciones.map(o => (o.ref === ad.id ? { ...o, nombre: ad.nombre, precioExtra: Number(ad.precio) || 0, foto: ad.foto || '', emoji: ad.emoji || '' } : o)),
    })))
  }
  // Para que el cambio de la biblioteca no cuente como «cambio sin guardar» de este producto.
  function cambioDeBiblioteca(ad) {
    copiarCambio(ad)
    const antes = JSON.parse(inicial.current)
    antes.grupos = (antes.grupos || []).map(g => ({ ...g, opciones: g.opciones.map(o => (o.ref === ad.id ? { ...o, nombre: ad.nombre, precioExtra: Number(ad.precio) || 0, foto: ad.foto || '', emoji: ad.emoji || '' } : o)) }))
    inicial.current = JSON.stringify(antes)
  }

  // ── Foto ──
  function elegirFoto(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFotoFile(f)
    setFotoPreview(URL.createObjectURL(f))
  }
  function crearFotoConIA() {
    if (!nombre.trim()) { alert('Escribe primero el nombre del producto para crear su foto.'); return }
    const prompt = construirPromptImagenIA({ nombre, descripcion, tipo: 'producto', local })
    try { navigator.clipboard?.writeText(prompt) } catch { /* queda el botón Copiar */ }
    window.open('https://gemini.google.com/app', '_blank', 'noopener')
    setAvisoIA({ prompt })
  }

  // ── Guardar ──
  function datos() {
    const data = {
      nombre: nombre.trim(), descripcion: descripcion.trim(), categoria, destacado, ocultoTV: !enTV, disponible,
    }
    if (tieneVariantes) {
      const limpias = variantes.filter(v => v.nombre.trim()).map(v => ({ ...v, nombre: v.nombre.trim(), precio: Number(v.precio) || 0 }))
      if (limpias.length) { data.variantes = limpias; data.precio = null }
      else { data.variantes = null; data.precio = Number(precio) || 0 }
    } else {
      data.precio = Number(precio) || 0
      data.variantes = null
    }
    const idsTam = new Set((data.variantes || []).map(v => v.id))
    const gs = grupos.map(g => {
      const mapa = {}
      for (const [vid, n] of Object.entries(g.maxPorVariante || {})) if (idsTam.has(vid) && Number(n) > 0) mapa[vid] = Number(n)
      return { ...g, nombre: String(g.nombre || '').trim() || 'Adiciones', maxPorVariante: mapa, opciones: g.opciones.filter(o => String(o.nombre || '').trim()) }
    }).filter(g => g.opciones.length)
    data.gruposOpciones = gs.length ? gs : null
    return data
  }
  async function conCategoria(data) {
    if (!creandoCat) return data
    const id = await onAddCategoria(nuevaCat, '')
    if (!id) throw new Error('Escribe el nombre de la nueva categoría')
    setCategoria(id)
    return { ...data, categoria: id }
  }
  async function guardar() {
    if (guardandoRef.current || !nombre.trim()) return
    if (creandoCat && !nuevaCat.trim()) { setPestana('general'); return }
    guardandoRef.current = true
    setGuardando(true)
    try {
      await onGuardar(await conCategoria(datos()), fotoFile)
    } catch (err) {
      const cod = err?.code || err?.message || String(err)
      console.error('No se pudo guardar el producto:', cod, err)
      alert(`No se pudo guardar.\n\nDetalle: ${cod}`)
      guardandoRef.current = false
      setGuardando(false)
    }
  }
  async function duplicar() {
    if (guardandoRef.current || !nombre.trim()) return
    guardandoRef.current = true
    setGuardando(true)
    try {
      const data = await conCategoria(datos())
      await onDuplicar({ ...data, nombre: `${data.nombre} (copia)`, foto: producto.foto || '', destacado: false }, fotoFile)
    } catch (err) {
      alert(`No se pudo duplicar.\n\nDetalle: ${err?.code || err?.message || err}`)
      guardandoRef.current = false
      setGuardando(false)
    }
  }

  const cuentaAdiciones = grupos.reduce((s, g) => s + g.opciones.length, 0)
  const faltaNombre = !nombre.trim()

  return createPortal(
    <div className="ed-fondo" onClick={intentarCerrar}>
      <aside className="ed" role="dialog" aria-modal="true" aria-label={producto.nuevo ? 'Nuevo producto' : `Editar ${producto.nombre}`} onClick={e => e.stopPropagation()}>
        <header className="ed-cab">
          <div className="ed-cab-foto" aria-hidden="true">{fotoPreview ? <img src={fotoPreview} alt="" /> : <span>🍽️</span>}</div>
          <div className="ed-cab-txt">
            <small>{producto.nuevo ? 'Nuevo producto' : 'Editar producto'}</small>
            <h2>{nombre.trim() || 'Sin nombre'}</h2>
          </div>
          <button type="button" className="ed-x" onClick={intentarCerrar} aria-label="Cerrar" disabled={guardando}>✕</button>
        </header>

        <nav className="ed-tabs" role="tablist" aria-label="Partes del producto">
          {PESTANAS.map(t => (
            <button type="button" key={t.id} role="tab" aria-selected={pestana === t.id} className={pestana === t.id ? 'on' : ''} onClick={() => setPestana(t.id)}>
              <span aria-hidden="true">{t.ico}</span>{t.nombre}
              {t.id === 'adiciones' && cuentaAdiciones > 0 && <i className="ed-tab-n">{cuentaAdiciones}</i>}
            </button>
          ))}
        </nav>

        <div className="ed-cuerpo">
          {/* ─────────── General ─────────── */}
          {pestana === 'general' && <>
            <section className="ed-sec">
              <h3>Foto</h3>
              <div className="ed-foto">
                <div className="ed-foto-ver">{fotoPreview ? <img src={fotoPreview} alt="" /> : <span>📷<small>Sin foto</small></span>}</div>
                <div className="ed-foto-acc">
                  <label className="ed-btn">📱 Subir del dispositivo<input type="file" accept="image/*" onChange={elegirFoto} hidden /></label>
                  <button type="button" className="ed-btn ed-btn-ia" onClick={crearFotoConIA}>✨ Crear con IA</button>
                  <small>Cuadrada y bien iluminada se ve mejor en el menú.</small>
                </div>
              </div>
              {avisoIA && (
                <div className="ap-ia-aviso">
                  <button className="ap-ia-aviso-x" onClick={() => setAvisoIA(null)} aria-label="Cerrar">✕</button>
                  <p className="ap-ia-aviso-tit">✨ Abrimos <strong>Gemini</strong> en otra pestaña</p>
                  <ol className="ap-ia-aviso-pasos">
                    <li>Pega el prompt (ya copiado) con <strong>Ctrl/Cmd + V</strong> y envía.</li>
                    <li>Cuando Gemini genere la imagen, <strong>descárgala</strong>.</li>
                    <li>Vuelve aquí y súbela con <strong>📱 Subir del dispositivo</strong>.</li>
                  </ol>
                  <button type="button" className="ap-ia-aviso-copiar" onClick={() => { try { navigator.clipboard?.writeText(avisoIA.prompt) } catch { /* nada */ } }}>📋 Copiar el prompt de nuevo</button>
                </div>
              )}
            </section>

            <section className="ed-sec">
              <h3>Datos</h3>
              <label className="ed-campo"><span>Nombre</span>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Hamburguesa Clásica" maxLength={80} className={faltaNombre ? 'falta' : ''} />
              </label>
              <label className="ed-campo"><span>Descripción <em>(opcional)</em></span>
                <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Qué trae, en una o dos líneas" maxLength={300} />
              </label>
              <label className="ed-campo"><span>Categoría</span>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.nombre}</option>)}
                  {onAddCategoria && <option value="__nueva__">➕ Crear categoría nueva…</option>}
                </select>
              </label>
              {creandoCat && (
                <label className="ed-campo"><span>Nombre de la nueva categoría</span>
                  <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} placeholder="Ej: Postres" autoFocus maxLength={40} />
                </label>
              )}
            </section>

            <section className="ed-sec">
              <label className="ed-switch">
                <span><b>⭐ Nuestro fuerte</b><small>El plato estrella de su categoría. Solo uno por categoría: al marcar este, se quita el de los demás.</small></span>
                <input type="checkbox" checked={destacado} onChange={e => setDestacado(e.target.checked)} />
              </label>
            </section>
          </>}

          {/* ─────────── Precios ─────────── */}
          {pestana === 'precios' && <>
            <section className="ed-sec">
              <div className="ed-modo" role="radiogroup" aria-label="Cómo se cobra">
                <button type="button" role="radio" aria-checked={!tieneVariantes} className={!tieneVariantes ? 'on' : ''} onClick={() => tieneVariantes && usarPrecioUnico()}>
                  <b>Un solo precio</b><small>Ej.: Hamburguesa $15.000</small>
                </button>
                <button type="button" role="radio" aria-checked={tieneVariantes} className={tieneVariantes ? 'on' : ''} onClick={() => !tieneVariantes && activarVariantes()}>
                  <b>Precio por tamaño</b><small>Ej.: Personal, Mediana, Familiar</small>
                </button>
              </div>
            </section>
            {!tieneVariantes ? (
              <section className="ed-sec">
                <label className="ed-campo"><span>Precio</span>
                  <div className="ed-plata"><i>$</i><input inputMode="numeric" value={precio} onChange={e => setPrecio(e.target.value.replace(/\D/g, ''))} placeholder="15000" /></div>
                </label>
                {Number(precio) > 0 && <p className="ed-ayuda">El cliente lo ve como <b>{cop(Number(precio))}</b>.</p>}
              </section>
            ) : (
              <section className="ed-sec">
                <h3>Tamaños</h3>
                <div className="ed-tamanos">
                  {variantes.map((v, i) => (
                    <div key={v.id} className="ed-tamano">
                      <input value={v.nombre} onChange={e => setVariante(i, { nombre: e.target.value })} placeholder="Tamaño (ej: Familiar)" aria-label="Nombre del tamaño" />
                      <div className="ed-plata"><i>$</i><input inputMode="numeric" value={v.precio} onChange={e => setVariante(i, { precio: e.target.value.replace(/\D/g, '') })} placeholder="40000" aria-label={`Precio de ${v.nombre || 'este tamaño'}`} /></div>
                      <button type="button" className="ed-quitar" onClick={() => quitarVariante(i)} aria-label={`Quitar ${v.nombre || 'tamaño'}`}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="ed-agregar" onClick={agregarVariante}>+ Agregar tamaño</button>
              </section>
            )}
          </>}

          {/* ─────────── Adiciones ─────────── */}
          {pestana === 'adiciones' && <>
            <p className="ed-ayuda ed-ayuda-top">
              Lo que el cliente le puede agregar o escoger. Salen de tu <b>biblioteca de adicionales</b>: lo que crees aquí queda guardado para usarlo en otros productos, y si cambias un precio, cambia en todos.
            </p>
            {!grupos.length && (
              <div className="ed-vacio">
                <span aria-hidden="true">➕</span>
                <b>Este producto no tiene adiciones</b>
                <small>Ej.: queso, tocineta o papas extra; o que el cliente escoja la salsa.</small>
              </div>
            )}
            {grupos.map((g, gi) => (
              <section key={g.id} className="ed-sec ed-grupo">
                <header className="ed-grupo-cab">
                  <input className="ed-grupo-nombre" value={g.nombre} onChange={e => setGrupo(gi, { nombre: e.target.value })} aria-label="Nombre del grupo" placeholder="Adiciones" />
                  <div className="ed-grupo-acc">
                    <button type="button" disabled={gi === 0} onClick={() => moverGrupo(gi, -1)} aria-label="Subir grupo">↑</button>
                    <button type="button" disabled={gi === grupos.length - 1} onClick={() => moverGrupo(gi, 1)} aria-label="Bajar grupo">↓</button>
                    <button type="button" className="peligro" onClick={() => quitarGrupo(gi)} aria-label={`Quitar el grupo ${g.nombre}`}>🗑</button>
                  </div>
                </header>
                <div className="ed-reglas">
                  <label className="ed-chip-switch">
                    <input type="checkbox" checked={g.min > 0} onChange={e => reglas(gi, { obligatorio: e.target.checked })} />
                    <span>{g.min > 0 ? 'Obligatorio' : 'Opcional'}</span>
                  </label>
                  <label className="ed-cuantas">
                    <span>Puede elegir hasta</span>
                    <input inputMode="numeric" value={g.max ?? 1} onChange={e => reglas(gi, { max: e.target.value.replace(/\D/g, '') || 1 })} aria-label="Cuántas puede elegir" />
                  </label>
                  <small className="ed-reglas-txt">El cliente ve: «{textoReglas(g)}»</small>
                </div>
                {tieneVariantes && variantes.some(v => v.nombre.trim()) && (
                  <details className="ed-topes">
                    <summary>Cambiar cuántas según el tamaño</summary>
                    {variantes.filter(v => v.nombre.trim()).map(v => (
                      <label key={v.id}><span>{v.nombre}</span>
                        <input inputMode="numeric" value={g.maxPorVariante?.[v.id] ?? ''} placeholder={String(g.max ?? 1)}
                          onChange={e => {
                            const n = Number(e.target.value.replace(/\D/g, '')) || 0
                            const mapa = { ...(g.maxPorVariante || {}) }
                            if (n > 0) mapa[v.id] = n; else delete mapa[v.id]
                            setGrupo(gi, { maxPorVariante: mapa })
                          }} />
                      </label>
                    ))}
                  </details>
                )}
                <ul className="ed-ops">
                  {g.opciones.map((o, oi) => (
                    <FilaOpcion key={o.id} opcion={o} usos={o.ref ? usosDe(productos, o.ref) : 0}
                      ad={o.ref ? adicionesDe(local).find(a => a.id === o.ref) : null}
                      onGuardarAdicion={async ad => { const n = await onGuardarAdicion(ad); cambioDeBiblioteca(n); return n }}
                      onLocal={c => setGrupos(gs => gs.map((x, j) => (j !== gi ? x : { ...x, opciones: x.opciones.map((y, k) => (k === oi ? { ...y, ...c } : y)) })))}
                      onFoto={onFotoOpcion ? file => onFotoOpcion('biblioteca', o.ref || o.id, file) : null}
                      onQuitar={() => quitarOpcion(gi, oi)} />
                  ))}
                </ul>
                <button type="button" className="ed-agregar" onClick={() => setEligiendo(gi)}>+ Agregar a «{g.nombre || 'Adiciones'}»</button>
              </section>
            ))}
            <div className="ed-nuevo-grupo">
              <button type="button" className="ed-btn" onClick={() => agregarGrupo(false)}>➕ Grupo de adiciones<small>Opcional · ej.: queso, tocineta</small></button>
              <button type="button" className="ed-btn" onClick={() => agregarGrupo(true)}>👉 Algo que debe escoger<small>Obligatorio · ej.: la salsa, el término</small></button>
            </div>
          </>}

          {/* ─────────── Dónde sale ─────────── */}
          {pestana === 'sale' && <>
            <section className="ed-sec">
              <label className="ed-switch">
                <span><b>✅ Disponible</b><small>Apágalo cuando se acabe. Sale como «Agotado» y no se puede pedir.</small></span>
                <input type="checkbox" checked={disponible} onChange={e => setDisponible(e.target.checked)} />
              </label>
              <label className="ed-switch">
                <span><b>📺 Mostrar en el Menú en Pantalla</b><small>Si lo apagas, sigue en el menú del celular pero no pasa por el televisor.</small></span>
                <input type="checkbox" checked={enTV} onChange={e => setEnTV(e.target.checked)} />
              </label>
            </section>
          </>}
        </div>

        <footer className="ed-pie">
          <div className="ed-pie-izq">
            {onBorrar && <button type="button" className="ed-link peligro" onClick={() => setBorrar(true)} disabled={guardando}>🗑 Borrar</button>}
            {!producto.nuevo && onDuplicar && <button type="button" className="ed-link" onClick={duplicar} disabled={guardando || faltaNombre}>⧉ Duplicar</button>}
          </div>
          <button type="button" className="ed-btn" onClick={intentarCerrar} disabled={guardando}>Cancelar</button>
          <button type="button" className="ed-btn primario" onClick={guardar} disabled={guardando || faltaNombre || (creandoCat && !nuevaCat.trim())}>
            {guardando ? 'Guardando…' : producto.nuevo ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </footer>

        {guardando && (
          <div className="pm-loading" role="status" aria-live="polite">
            <div className="local-spinner" />
            <p className="pm-loading-txt">{fotoFile ? 'Subiendo foto y guardando…' : 'Guardando…'}</p>
            <p className="pm-loading-sub">No cierres la app. Con fotos grandes puede tardar unos segundos.</p>
            <div className="pm-loading-bar"><span /></div>
          </div>
        )}
      </aside>

      {eligiendo !== null && grupos[eligiendo] && (
        <ElegirAdicionales grupo={grupos[eligiendo]} local={local} productos={productos}
          onAlternar={ad => alternar(eligiendo, ad)}
          onCrear={async ad => { const n = await onGuardarAdicion(ad); alternar(eligiendo, n); return n }}
          onCerrar={() => setEligiendo(null)} />
      )}
      {salir && (
        <Ventana titulo="¿Salir sin guardar?" onCerrar={() => setSalir(false)} ancho={420} pie={<>
          <button type="button" className="cm-btn" onClick={() => { setSalir(false); onCerrar() }}>Salir sin guardar</button>
          <button type="button" className="cm-btn primario" onClick={() => { setSalir(false); guardar() }} disabled={faltaNombre}>Guardar cambios</button>
        </>}>
          <p className="cm-texto">Hiciste cambios en <b>{nombre.trim() || 'este producto'}</b> que todavía no se han guardado.</p>
        </Ventana>
      )}
      {borrar && (
        <Ventana titulo={`¿Borrar «${producto.nombre}»?`} onCerrar={() => setBorrar(false)} ancho={420} pie={<>
          <button type="button" className="cm-btn" onClick={() => setBorrar(false)}>Cancelar</button>
          <button type="button" className="cm-btn peligro" onClick={() => { setBorrar(false); onBorrar() }}>Sí, borrar</button>
        </>}>
          <p className="cm-texto">Sale del menú, de la caja y del Menú en Pantalla. No se puede deshacer.</p>
          <p className="cm-texto">Si solo se acabó por hoy, mejor apaga <b>Disponible</b> en «Dónde sale».</p>
        </Ventana>
      )}
    </div>, document.body)
}

// Una opción de un grupo. Si viene de la biblioteca, el nombre y el precio se cambian EN la
// biblioteca (al salir del campo) y se avisa en cuántos productos está.
function FilaOpcion({ opcion, ad, usos, onGuardarAdicion, onLocal, onFoto, onQuitar }) {
  const [nombre, setNombre] = useState(opcion.nombre || '')
  const [precio, setPrecio] = useState(String(opcion.precioExtra ?? 0))
  const [estado, setEstado] = useState('')
  const [preview, setPreview] = useState(opcion.foto || '')
  useEffect(() => { setNombre(opcion.nombre || ''); setPrecio(String(opcion.precioExtra ?? 0)); setPreview(opcion.foto || '') }, [opcion.nombre, opcion.precioExtra, opcion.foto])

  async function confirmar(cambios) {
    if (!ad) { onLocal(cambios.precio != null ? { precioExtra: Number(cambios.precio) || 0 } : cambios); return }
    const n = { ...ad, ...(cambios.nombre != null ? { nombre: cambios.nombre } : {}), ...(cambios.precio != null ? { precio: Number(cambios.precio) || 0 } : {}), ...(cambios.foto != null ? { foto: cambios.foto } : {}) }
    if (n.nombre === ad.nombre && Number(n.precio) === Number(ad.precio) && (n.foto || '') === (ad.foto || '')) return
    setEstado('guardando')
    try { await onGuardarAdicion(n); setEstado('ok'); setTimeout(() => setEstado(''), 1500) } catch { setEstado('error') }
  }
  async function elegirFoto(e) {
    const f = e.target.files?.[0]
    if (!f || !onFoto) return
    setPreview(URL.createObjectURL(f))
    setEstado('guardando')
    try { const url = await onFoto(f); await confirmar({ foto: url }); if (!ad) onLocal({ foto: url }) } catch { setEstado('error'); setPreview(opcion.foto || '') }
  }
  return (
    <li className="ed-op">
      <label className="ed-op-foto" title="Cambiar foto">
        {preview ? <img src={preview} alt="" /> : <span>{opcion.emoji || '📷'}</span>}
        <input type="file" accept="image/*" hidden onChange={elegirFoto} disabled={!onFoto} />
      </label>
      <input className="ed-op-nombre" value={nombre} onChange={e => setNombre(e.target.value)}
        onBlur={() => nombre.trim() && nombre.trim() !== opcion.nombre && confirmar({ nombre: nombre.trim() })} aria-label="Nombre" />
      <div className="ed-plata ed-op-precio"><i>+$</i>
        <input inputMode="numeric" value={precio} onChange={e => setPrecio(e.target.value.replace(/\D/g, ''))}
          onBlur={() => Number(precio) !== Number(opcion.precioExtra || 0) && confirmar({ precio })} aria-label={`Precio de ${opcion.nombre}`} />
      </div>
      <button type="button" className="ed-quitar" onClick={onQuitar} aria-label={`Quitar ${opcion.nombre} de este producto`} title="Quitar de este producto">✕</button>
      <small className={`ed-op-nota ${estado}`}>
        {estado === 'guardando' ? 'Guardando…' : estado === 'ok' ? '✓ Guardado en la biblioteca' : estado === 'error' ? 'No se pudo guardar' : ad ? (usos > 1 ? `En ${usos} productos` : 'De tu biblioteca') : 'Solo de este producto'}
      </small>
    </li>
  )
}

// La biblioteca, para escoger qué adicionales lleva el grupo, o crear uno nuevo ahí mismo (D11).
function ElegirAdicionales({ grupo, local, productos, onAlternar, onCrear, onCerrar }) {
  const [q, setQ] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [estado, setEstado] = useState('')
  const lista = adicionesDe(local)
  const marcados = new Set(grupo.opciones.map(o => o.ref).filter(Boolean))
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return [...lista].filter(a => !t || a.nombre.toLowerCase().includes(t)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [lista, q])
  async function crear(e) {
    e.preventDefault()
    if (!(nombre.trim() || q.trim())) return
    setEstado('creando')
    try {
      await onCrear({ nombre: (nombre.trim() || q.trim()), precio: Number(precio) || 0 })
      setNombre(''); setPrecio(''); setQ(''); setEstado('')
    } catch { setEstado('error') }
  }
  return (
    <Ventana titulo={`Agregar a «${grupo.nombre || 'Adiciones'}»`} onCerrar={onCerrar} ancho={520}
      pie={<button type="button" className="cm-btn primario" onClick={onCerrar}>Listo{marcados.size ? ` · ${marcados.size} ${marcados.size === 1 ? 'elegido' : 'elegidos'}` : ''}</button>}>
      <p className="cm-texto">Marca los que lleva este producto. Están en tu biblioteca y sirven para todos tus productos.</p>
      {lista.length > 6 && <input className="ea-buscar" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar adicional…" aria-label="Buscar adicional" />}
      {lista.length === 0 && <p className="ea-vacio">Tu biblioteca está vacía. Crea el primero abajo 👇</p>}
      <ul className="ea-lista">
        {filtrados.map(a => {
          const on = marcados.has(a.id)
          return (
            <li key={a.id}>
              <button type="button" className={`ea-item${on ? ' on' : ''}`} aria-pressed={on} onClick={() => onAlternar(a)}>
                <span className="ea-check" aria-hidden="true">{on ? '✓' : ''}</span>
                <span className="ea-foto" aria-hidden="true">{a.foto ? <img src={a.foto} alt="" /> : (a.emoji || '➕')}</span>
                <span className="ea-nombre">{a.nombre}<small>{usosDe(productos, a.id) ? `En ${usosDe(productos, a.id)} productos` : 'Sin usar todavía'}</small></span>
                <b className="ea-precio">{a.precio ? `+${cop(a.precio)}` : 'Gratis'}</b>
              </button>
            </li>
          )
        })}
      </ul>
      <form className="ea-nuevo" onSubmit={crear}>
        <p><b>¿No está?</b> Créalo y queda en tu biblioteca:</p>
        <div>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder={q.trim() || 'Ej: Queso extra'} maxLength={50} aria-label="Nombre del adicional nuevo" />
          <div className="ed-plata"><i>+$</i><input inputMode="numeric" value={precio} onChange={e => setPrecio(e.target.value.replace(/\D/g, ''))} placeholder="0" aria-label="Precio del adicional nuevo" /></div>
          <button type="submit" className="cm-btn primario" disabled={!(nombre.trim() || q.trim()) || estado === 'creando'}>{estado === 'creando' ? 'Creando…' : 'Crear y agregar'}</button>
        </div>
        {estado === 'error' && <p className="cm-error">No se pudo crear. Revisa el internet.</p>}
      </form>
    </Ventana>
  )
}
