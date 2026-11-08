import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { TRANSICIONES, transicionDe } from '../../utils/pantallaTV'
import { menuUrl } from '../../utils/compartir'
import { PanelHero, PanelCuerpo, PanelLado, PanelTarjeta, PanelSwitch, useEntrar } from './PanelPagina'
import { Ventana } from './CatalogoCategorias'
import './ConfigPantalla.css'

// 📺 Configuración → Pantalla de TV (D3, D18 de la guía «Pantalla de TV»).
// Todo se guarda al tocar, salvo el anuncio que se está escribiendo (ese tiene su «Guardar»).
// La vista previa es la misma pantalla del TV, con lo que hay en este momento.
// Diseño (guía «Diseño de pantallas del panel», 8-nov): el link del TV va en el encabezado; a la
// izquierda Vista · Transición · Categorías · Pedidos listos · Anuncios; los anuncios se editan en una
// ventana aparte. Todo se sigue guardando al tocar.

const VistaTV = lazy(() => import('../TV/PantallaTV').then(m => ({ default: m.VistaTV })))

const DIAS = [
  { k: 'lun', l: 'L', c: 'Lun' }, { k: 'mar', l: 'M', c: 'Mar' }, { k: 'mie', l: 'M', c: 'Mié' },
  { k: 'jue', l: 'J', c: 'Jue' }, { k: 'vie', l: 'V', c: 'Vie' }, { k: 'sab', l: 'S', c: 'Sáb' },
  { k: 'dom', l: 'D', c: 'Dom' },
]
const ANUNCIO_VACIO = { titulo: '', texto: '', imagen: '', activo: true, dias: [], desde: '', hasta: '' }

// El link que se abre en el TV. En la vista previa apunta a esta misma máquina, para probarlo.
export function linkDelTV(slug) {
  const preview = new URLSearchParams(window.location.search).has('preview')
  if (preview || import.meta.env.DEV) return `${window.location.origin}/${slug}/tv${preview ? '?preview=1' : ''}`
  return `${menuUrl(slug)}/tv`
}

export default function ConfigPantalla({ local, productos, slug, onUpdate, onSubirImagen }) {
  const pantalla = local.pantalla || {}
  const [errorGuardar, setErrorGuardar] = useState('')
  // Campo por campo ('pantalla.anuncios'…): dos aparatos editando a la vez no se pisan lo demás.
  // Si no se guardó, se dice (antes se veía guardado y el TV nunca se enteraba).
  const guardar = cambios => {
    setErrorGuardar('')
    const campos = Object.fromEntries(Object.entries(cambios).map(([k, v]) => [`pantalla.${k}`, v]))
    return Promise.resolve(onUpdate({ pantalla: { ...pantalla, ...cambios } }, campos))
      .catch(() => setErrorGuardar('No se guardó. Revisa el internet e intenta de nuevo.'))
  }

  const transicion = transicionDe(local)
  const ocultas = new Set(pantalla.categoriasOcultas || [])
  const anuncios = pantalla.anuncios || []
  const platosOcultos = useMemo(() => productos.filter(p => p.ocultoTV).length, [productos])

  const [editando, setEditando] = useState(null) // null | 'nuevo' | id
  const [copiado, setCopiado] = useState(false)
  const link = linkDelTV(slug)

  function alternarCategoria(id) {
    const s = new Set(ocultas)
    s.has(id) ? s.delete(id) : s.add(id)
    guardar({ categoriasOcultas: [...s] })
  }

  function guardarAnuncio(a) {
    const lista = a.id && anuncios.some(x => x.id === a.id)
      ? anuncios.map(x => (x.id === a.id ? a : x))
      : [...anuncios, { ...a, id: a.id || `an-${Date.now().toString(36)}` }]
    guardar({ anuncios: lista })
    setEditando(null)
  }
  const borrarAnuncio = id => guardar({ anuncios: anuncios.filter(a => a.id !== id) })
  const alternarAnuncio = a => guardar({ anuncios: anuncios.map(x => (x.id === a.id ? { ...x, activo: x.activo === false } : x)) })

  async function copiar() {
    try { await navigator.clipboard.writeText(link) } catch {
      const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta)
      ta.select(); document.execCommand('copy'); ta.remove()
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  const entrar = useEntrar()
  const [parte, setParte] = useState('transicion')
  const elegir = id => { setParte(id); entrar.abrir() }
  const cats = local.categorias || []
  const visibles = cats.filter(c => !ocultas.has(c.id)).length
  const prendidos = anuncios.filter(a => a.activo !== false).length
  const sinCocina = local.usaCocina === false
  const items = [
    { id: 'transicion', icono: '✨', nombre: 'Cómo pasan los platos', nota: TRANSICIONES.find(t => t.id === transicion)?.nombre },
    { id: 'categorias', icono: '🗂️', nombre: 'Categorías', nota: `${visibles} de ${cats.length} se ven`, tono: visibles ? null : 'aviso' },
    { id: 'listos', icono: '🔔', nombre: 'Pedidos listos', nota: sinCocina ? 'Necesita la pantalla de cocina' : pantalla.pedidosListos ? 'Se llaman en el TV' : 'Apagado', tono: pantalla.pedidosListos && !sinCocina ? 'ok' : 'off' },
    { id: 'anuncios', icono: '📢', nombre: 'Anuncios', nota: anuncios.length ? `${prendidos} de ${anuncios.length} prendidos` : 'Ninguno todavía', n: anuncios.length || null },
  ]
  const actual = items.find(i => i.id === parte) || items[0]
  const anuncioEditado = editando === 'nuevo' ? ANUNCIO_VACIO : anuncios.find(a => a.id === editando)

  return (
    <div className={`cpt cpt2${entrar.abierto ? ' pp-dentro' : ''}`}>
      <PanelHero icono="📺" titulo="Menú en Pantalla" sub="Tu menú en vivo en el TV del local, con tus anuncios" chips={[
        { t: `🗂️ ${visibles} de ${cats.length} categorías`, tono: visibles ? null : 'aviso' },
        { t: `📢 ${prendidos} ${prendidos === 1 ? 'anuncio' : 'anuncios'}` },
        !sinCocina && pantalla.pedidosListos ? { t: '🔔 Llama los pedidos', tono: 'ok' } : null,
      ]} derecha={
        <div className="cpt2-link">
          <small>El link del TV</small>
          <code>{link.replace(/^https?:\/\//, '')}</code>
          <div>
            <button className="pp-btn" onClick={copiar}>{copiado ? '✓ Copiado' : '📋 Copiar'}</button>
            <a className="btn btn-primary" href={link} target="_blank" rel="noreferrer">Abrir pantalla</a>
          </div>
        </div>
      } />
      {errorGuardar && <p className="cpt2-error" role="alert">⚠️ {errorGuardar}</p>}

      <PanelCuerpo entrar={entrar} titulo={actual.nombre} lado={
        <PanelLado icono="📺" titulo="Menú en Pantalla" sel={actual.id} onSel={elegir} grupos={[{ items }]} />
      }>
        {/* La vista del TV siempre al lado (pequeña): se cambia algo y se ve al instante, sin ir y
            volver a otra parte (pedido del usuario, 8-nov). En el celular va arriba. */}
        <div className="cpt2-dos">
        <aside className="cpt2-vivo" aria-label="Así se ve tu Menú en Pantalla ahora">
          <div className="cpt2-vivo-cab"><span>👀 Así se ve ahora</span><a href={link} target="_blank" rel="noreferrer">Abrir ↗</a></div>
          <div className="cpt2-tv">
            <Suspense fallback={<div className="cpt-vista-cargando" />}>
              <VistaTV local={local} productos={productos} />
            </Suspense>
          </div>
          <p className="pp-ayuda">Abre el link en el navegador del TV y déjalo en favoritos. En <b>Difundir</b> están los pasos para cada aparato.</p>
        </aside>
        <div className="cpt2-opciones">
        {actual.id === 'transicion' && (
          <PanelTarjeta icono="✨" titulo="Cómo pasan los platos grandes" sub="Por el lugar grande pasan tus platos ⭐ «Nuestro fuerte» que tengan foto. Se guarda al tocar.">
            <div className="cpt-trans">
              {TRANSICIONES.map(t => (
                <button key={t.id} className={`cpt-tr ${t.id === transicion ? 'on' : ''}`} onClick={() => guardar({ transicion: t.id })} aria-pressed={t.id === transicion}>
                  <span className={`cpt-tr-ico cpt-tr-${t.id}`} aria-hidden="true"><i /><i /></span>
                  <strong>{t.nombre}</strong>
                  <small>{t.desc}</small>
                </button>
              ))}
            </div>
          </PanelTarjeta>
        )}

        {actual.id === 'categorias' && (
          <PanelTarjeta icono="🗂️" titulo="Categorías en el Menú en Pantalla" sub="Toca una para esconderla o mostrarla en el TV. En tu menú del celular sigue igual. Se guarda al tocar.">
            <div className="cpt2-cats">
              {cats.map(c => {
                const visible = !ocultas.has(c.id)
                return (
                  <button key={c.id} className={`cpt2-cat${visible ? ' on' : ''}`} onClick={() => alternarCategoria(c.id)} aria-pressed={visible}>
                    <span className="cpt2-cat-ico" aria-hidden="true">{c.emoji || '🍽️'}</span>
                    <span className="cpt2-cat-nom">{c.nombre}<small>{visible ? 'Se ve en el TV' : 'Escondida'}</small></span>
                    <i aria-hidden="true">{visible ? '👁' : '🚫'}</i>
                  </button>
                )
              })}
            </div>
            <p className="pp-ayuda">
              Para esconder un solo plato, ábrelo en <b>Catálogo</b> y apaga «Mostrar en el Menú en Pantalla».
              {platosOcultos > 0 && <> Ahora tienes <b>{platosOcultos} {platosOcultos === 1 ? 'plato escondido' : 'platos escondidos'}</b>.</>}
              {' '}Los agotados salen solos del TV.
            </p>
          </PanelTarjeta>
        )}

        {actual.id === 'listos' && (
          <PanelTarjeta icono="🔔" titulo="Pedidos listos" sub="Llamar por número los pedidos cuando la cocina los despacha.">
            <div className="pp-sub">
              {sinCocina ? (
                <p className="pp-ayuda">Para llamar los pedidos en el TV hace falta la pantalla de cocina: es la que dice cuándo sale cada uno. Prende <b>«Usamos la pantalla de cocina»</b> en Configuración → Cuentas y pagos.</p>
              ) : (
                <>
                  <PanelSwitch titulo="Llamar los pedidos en el Menú en Pantalla" checked={!!pantalla.pedidosListos} onChange={v => guardar({ pedidosListos: v })}
                    texto="Cada pedido para llevar y cada pedido del QR de la mesa recibe un número de turno del día (1, 2, 3…). Cuando la cocina lo despacha, el número sale en grande en el TV y queda unos minutos en una franja abajo." />
                  {pantalla.pedidosListos && <p className="pp-ayuda">La caja y el mesero ven el turno en grande al mandar el pedido, para decírselo al cliente. Los pedidos de mesa que lleva el mesero no se llaman.</p>}
                </>
              )}
            </div>
          </PanelTarjeta>
        )}

        {actual.id === 'anuncios' && (
          <PanelTarjeta icono="📢" titulo="Anuncios" sub="Entran a pantalla completa unos segundos, entre las categorías. Cada uno puede salir solo ciertos días y horas.">
            <div className="pp-grid cpt2-anuncios">
              {anuncios.map(a => (
                <article key={a.id} className={`cpt2-an${a.activo === false ? ' off' : ''}`}>
                  <div className="cpt2-an-img">{a.imagen ? <img src={a.imagen} alt="" /> : <span>📢</span>}</div>
                  <div className="cpt2-an-txt">
                    <strong>{a.titulo || 'Sin título'}</strong>
                    {a.texto && <span>{a.texto}</span>}
                    <small>🕒 {cuandoSale(a)}</small>
                  </div>
                  <div className="cpt2-an-acc">
                    <button className="pp-btn" onClick={() => setEditando(a.id)}>✏️ Editar</button>
                    <button className="pp-btn cpt2-borrar" onClick={() => borrarAnuncio(a.id)} aria-label={`Borrar ${a.titulo}`}>🗑</button>
                    <label className="pp-switch cpt2-sw" title={a.activo === false ? 'Apagado' : 'Prendido'}>
                      <input type="checkbox" checked={a.activo !== false} onChange={() => alternarAnuncio(a)} aria-label="Prender o apagar el anuncio" />
                    </label>
                  </div>
                </article>
              ))}
              <button className="cpt2-nuevo" onClick={() => setEditando('nuevo')}>
                <span aria-hidden="true">+</span><b>Nuevo anuncio</b><small>Ej.: «2×1 en perros los martes»</small>
              </button>
            </div>
          </PanelTarjeta>
        )}
        </div>
        </div>
      </PanelCuerpo>

      {editando && anuncioEditado && (
        <Ventana titulo={editando === 'nuevo' ? 'Nuevo anuncio' : 'Editar anuncio'} onCerrar={() => setEditando(null)} ancho={520}>
          <EditorAnuncio inicial={anuncioEditado} onGuardar={guardarAnuncio} onCancelar={() => setEditando(null)} onSubirImagen={onSubirImagen} />
        </Ventana>
      )}
    </div>
  )
}

function EditorAnuncio({ inicial, onGuardar, onCancelar, onSubirImagen }) {
  const [a, setA] = useState(() => ({ ...ANUNCIO_VACIO, ...inicial }))
  const [todoElDia, setTodoElDia] = useState(!inicial.desde || !inicial.hasta)
  const [subiendo, setSubiendo] = useState(false)
  const archivo = useRef(null)
  const id = useRef(inicial.id || `an-${Date.now().toString(36)}`)
  const set = (k, v) => setA(x => ({ ...x, [k]: v }))

  function alternarDia(k) {
    const s = new Set(a.dias || [])
    s.has(k) ? s.delete(k) : s.add(k)
    set('dias', DIAS.map(d => d.k).filter(x => s.has(x)))
  }

  async function elegirImagen(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setSubiendo(true)
    try { set('imagen', await onSubirImagen(id.current, f)) } catch (err) {
      console.error(err)
      alert('No se pudo subir la imagen. Prueba de nuevo.')
    } finally { setSubiendo(false) }
  }

  const listo = (a.titulo.trim() || a.imagen) && !subiendo
  function guardar(e) {
    e.preventDefault()
    if (!listo) return
    onGuardar({
      ...a,
      id: id.current,
      titulo: a.titulo.trim(),
      texto: a.texto.trim(),
      desde: todoElDia ? '' : (a.desde || '11:00'),
      hasta: todoElDia ? '' : (a.hasta || '15:00'),
    })
  }

  return (
    <form className="cpt-editor" onSubmit={guardar}>
      <label className="cpt-campo">
        <span>Título</span>
        <input value={a.titulo} maxLength={40} onChange={e => set('titulo', e.target.value)} placeholder="2×1 en perros" autoFocus />
      </label>
      <label className="cpt-campo">
        <span>Texto <small>(opcional)</small></span>
        <input value={a.texto} maxLength={90} onChange={e => set('texto', e.target.value)} placeholder="Todos los martes, en el local y para llevar" />
      </label>

      <div className="cpt-campo">
        <span>Imagen <small>(opcional, se ve a pantalla completa)</small></span>
        <div className="cpt-img">
          {a.imagen && <img src={a.imagen} alt="" />}
          <button type="button" className="btn btn-ghost" onClick={() => archivo.current?.click()} disabled={subiendo}>
            {subiendo ? 'Subiendo…' : a.imagen ? 'Cambiar' : 'Subir imagen'}
          </button>
          {a.imagen && <button type="button" className="cpt-quitar" onClick={() => set('imagen', '')}>Quitar</button>}
          <input ref={archivo} type="file" accept="image/*" hidden onChange={elegirImagen} />
        </div>
      </div>

      <span className="ac-sub">Qué días <small>(ninguno = todos los días)</small></span>
      <div className="ac-dias">
        {DIAS.map(d => (
          <button type="button" key={d.k} className={`ac-dia ${a.dias?.includes(d.k) ? 'on' : ''}`} onClick={() => alternarDia(d.k)} aria-label={d.c} aria-pressed={a.dias?.includes(d.k)}>{d.l}</button>
        ))}
      </div>

      <label className="ac-switch cpt-todo-dia">
        <span>Todo el día</span>
        <input type="checkbox" checked={todoElDia} onChange={e => setTodoElDia(e.target.checked)} />
      </label>
      {!todoElDia && (
        <div className="ac-horas">
          <label>Desde<input type="time" value={a.desde || '11:00'} onChange={e => set('desde', e.target.value)} /></label>
          <label>Hasta<input type="time" value={a.hasta || '15:00'} onChange={e => set('hasta', e.target.value)} /></label>
        </div>
      )}

      <div className="cpt-editor-btns">
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-primary" disabled={!listo}>Guardar anuncio</button>
      </div>
    </form>
  )
}

function cuandoSale(a) {
  const dias = a.dias?.length && a.dias.length < 7
    ? DIAS.filter(d => a.dias.includes(d.k)).map(d => d.c).join(', ')
    : 'Todos los días'
  const horas = a.desde && a.hasta ? `${hora12(a.desde)} a ${hora12(a.hasta)}` : 'todo el día'
  return `${dias} · ${horas}`
}

// '15:30' → '3:30 p. m.'
function hora12(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.'
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${sufijo}`
}
