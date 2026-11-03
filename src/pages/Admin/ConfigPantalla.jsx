import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { TRANSICIONES, transicionDe } from '../../utils/pantallaTV'
import { menuUrl } from '../../utils/compartir'
import './ConfigPantalla.css'

// 📺 Configuración → Pantalla de TV (D3, D18 de la guía «Pantalla de TV»).
// Todo se guarda al tocar, salvo el anuncio que se está escribiendo (ese tiene su «Guardar»).
// La vista previa es la misma pantalla del TV, con lo que hay en este momento.

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
  const guardar = cambios => onUpdate({ pantalla: { ...pantalla, ...cambios } })

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

  return (
    <div className="cpt">
      <section className="ac-sec">
        <h3>👀 Así se ve tu TV ahora</h3>
        <Suspense fallback={<div className="cpt-vista-cargando" />}>
          <VistaTV local={local} productos={productos} />
        </Suspense>
        <div className="cpt-link">
          <code>{link.replace(/^https?:\/\//, '')}</code>
          <div className="cpt-link-btns">
            <button className="btn btn-ghost" onClick={copiar}>{copiado ? '✓ Copiado' : 'Copiar link'}</button>
            <a className="btn btn-primary" href={link} target="_blank" rel="noreferrer">Abrir pantalla</a>
          </div>
        </div>
        <p className="ac-hint">Abre este link en el navegador del TV y déjalo como página de inicio o en favoritos. Siempre es el mismo y no hay que activar nada. En <b>Difundir</b> están los pasos para cada aparato.</p>
      </section>

      <section className="ac-sec">
        <h3>✨ Cómo pasan los platos grandes</h3>
        <p className="ac-hint cpt-hint-top">Por el lugar grande pasan tus platos ⭐ «Nuestro fuerte» que tengan foto.</p>
        <div className="cpt-trans">
          {TRANSICIONES.map(t => (
            <button
              key={t.id}
              className={`cpt-tr ${t.id === transicion ? 'on' : ''}`}
              onClick={() => guardar({ transicion: t.id })}
              aria-pressed={t.id === transicion}
            >
              <span className={`cpt-tr-ico cpt-tr-${t.id}`} aria-hidden="true"><i /><i /></span>
              <strong>{t.nombre}</strong>
              <small>{t.desc}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="ac-sec">
        <h3>🗂️ Categorías en el TV</h3>
        <p className="ac-hint cpt-hint-top">Toca una categoría para esconderla o mostrarla en el TV. En tu menú sigue igual.</p>
        <div className="cpt-cats">
          {(local.categorias || []).map(c => {
            const visible = !ocultas.has(c.id)
            return (
              <button key={c.id} className={`cpt-cat ${visible ? 'on' : ''}`} onClick={() => alternarCategoria(c.id)} aria-pressed={visible}>
                <span>{c.emoji} {c.nombre}</span>
                <b>{visible ? 'Se ve' : 'Escondida'}</b>
              </button>
            )
          })}
        </div>
        <p className="ac-hint">
          Para esconder un solo plato, ábrelo en <b>Catálogo</b> y apaga «Mostrar en la pantalla de TV».
          {platosOcultos > 0 && <> Ahora tienes <b>{platosOcultos} {platosOcultos === 1 ? 'plato escondido' : 'platos escondidos'}</b>.</>}
          {' '}Los agotados salen solos del TV.
        </p>
      </section>

      <section className="ac-sec">
        <h3>🔔 Pedidos listos</h3>
        {local.usaCocina === false ? (
          <p className="ac-hint cpt-hint-top">Para llamar los pedidos en el TV hace falta la pantalla de cocina: es la que dice cuándo sale cada uno. Prende <b>«Usamos la pantalla de cocina»</b> en Configuración → Cuentas y pagos.</p>
        ) : (
          <>
            <label className="ac-switch cpt-listos">
              <span>
                <b>Llamar los pedidos en el TV</b>
                <small>Cada pedido para llevar y cada pedido del QR de la mesa recibe un número de turno del día (1, 2, 3…). Cuando la cocina lo despacha, el número sale en grande en el TV y queda unos minutos en una franja abajo.</small>
              </span>
              <input type="checkbox" checked={!!pantalla.pedidosListos} onChange={e => guardar({ pedidosListos: e.target.checked })} />
            </label>
            {pantalla.pedidosListos && <p className="ac-hint">La caja y el mesero ven el turno en grande al mandar el pedido, para decírselo al cliente. Los pedidos de mesa que lleva el mesero no se llaman.</p>}
          </>
        )}
      </section>

      <section className="ac-sec">
        <h3>📢 Anuncios</h3>
        <p className="ac-hint cpt-hint-top">Entran a pantalla completa unos segundos, entre las categorías. Puedes decir qué días y a qué horas sale cada uno.</p>

        <div className="cpt-anuncios">
          {anuncios.map(a => (editando === a.id
            ? <EditorAnuncio key={a.id} inicial={a} onGuardar={guardarAnuncio} onCancelar={() => setEditando(null)} onSubirImagen={onSubirImagen} />
            : (
              <article key={a.id} className={`cpt-an ${a.activo === false ? 'off' : ''}`}>
                {a.imagen ? <img src={a.imagen} alt="" /> : <span className="cpt-an-sinimg">📢</span>}
                <div className="cpt-an-txt">
                  <strong>{a.titulo || 'Sin título'}</strong>
                  {a.texto && <span>{a.texto}</span>}
                  <small>{cuandoSale(a)}</small>
                </div>
                <div className="cpt-an-acc">
                  <label className="cpt-mini-sw" title={a.activo === false ? 'Apagado' : 'Prendido'}>
                    <input type="checkbox" checked={a.activo !== false} onChange={() => alternarAnuncio(a)} aria-label="Prender o apagar el anuncio" />
                  </label>
                  <button className="cpt-icon" onClick={() => setEditando(a.id)} aria-label="Editar">✏️</button>
                  <button className="cpt-icon" onClick={() => borrarAnuncio(a.id)} aria-label="Borrar">🗑️</button>
                </div>
              </article>
            )))}

          {editando === 'nuevo'
            ? <EditorAnuncio inicial={ANUNCIO_VACIO} onGuardar={guardarAnuncio} onCancelar={() => setEditando(null)} onSubirImagen={onSubirImagen} />
            : <button className="cpt-nuevo" onClick={() => setEditando('nuevo')}>＋ Nuevo anuncio</button>}
        </div>
      </section>
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
