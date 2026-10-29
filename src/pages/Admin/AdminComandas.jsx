import { useEffect, useMemo, useRef, useState } from 'react'
import { comandasDe, etiquetaDestino, ms, POR_PAGINA } from '../../services/comandas'
import AdminEquipo from './AdminEquipo'
import { notificarListo } from '../../services/notificaciones'
import { useAhora, minutosSeg, nivelTiempo, umbralesDe, coloresComanda, UMBRALES_DEFECTO, itemsTxt } from './comandaUtils'
import './Comandas.css'

// 🧾 PANTALLA DE COMANDAS (cocina) — guía «Mesero y Comandas», paso 1.
// Pensada para un celular o una tablet en la cocina: grande, clara y con pocos toques.
//   • Fila por ORDEN DE LLEGADA, en vivo. Cerrada muestra mesa/llevar + contador + cuántos ítems;
//     un toque la expande.
//   • Expandida: cada línea se tacha con un toque (salió por tandas) o «Tachar todo».
//     Con todo tachado aparece «Confirmar entregado», con una confirmación grande.
//   • El contador cambia de color con los minutos que elige el admin.
//   • CANCELADA se ve en grande hasta que la cocina dice «Entendido».
//   • «Entregadas»: lo último con Deshacer (error de dedo) + historial por partes.
//   • Suena al llegar una comanda y mantiene la pantalla encendida (tras «Empezar turno»).
export default function AdminComandas({ local, demo, esAdmin, onUpdateLocal }) {
  const api = useMemo(() => comandasDe(local.id, { demo }), [local.id, demo])
  const [activas, setActivas] = useState(null)
  const [recientes, setRecientes] = useState([])
  const [cursor, setCursor] = useState(null)
  const [error, setError] = useState('')
  const [abiertas, setAbiertas] = useState(() => new Set())
  const [confirmar, setConfirmar] = useState(null) // comanda por confirmar como entregada
  const [vista, setVista] = useState('fila')       // fila | entregadas
  const [nuevas, setNuevas] = useState(() => new Set())
  const turno = useTurno()
  const ahora = useAhora()
  const umbrales = umbralesDe(local)
  const colores = coloresComanda(local)

  useEffect(() => api.escucharActivas(setActivas, () => setError('Se perdió la conexión. Revisa el internet de este equipo.')), [api])
  useEffect(() => api.escucharRecientes((l, ult) => { setRecientes(l); setCursor(ult) }, () => {}), [api])

  // 🔔 Comanda nueva → sonido + resaltado unos segundos (no al cargar la pantalla).
  const vistas = useRef(null)
  useEffect(() => {
    if (!activas) return
    const ids = new Set(activas.map(c => c.id))
    if (vistas.current) {
      const llegaron = activas.filter(c => !vistas.current.has(c.id)).map(c => c.id)
      if (llegaron.length) {
        turno.sonar()
        setNuevas(n => new Set([...n, ...llegaron]))
        setTimeout(() => setNuevas(n => { const m = new Set(n); llegaron.forEach(id => m.delete(id)); return m }), 8000)
      }
    }
    vistas.current = ids
  }, [activas, turno])

  // Canceladas recientes que la cocina todavía no ha visto.
  const [entendidas, setEntendidas] = useState(() => leerLista(`appetic_cocina_entendidas_${local.id}`))
  const canceladas = recientes.filter(c => c.estado === 'cancelada' && !entendidas.includes(c.id)
    && (Date.now() - (ms(c.canceladaEn) || Date.now())) < 60 * 60000)
  function entender(id) {
    const n = [...entendidas, id].slice(-200)
    setEntendidas(n)
    guardarLista(`appetic_cocina_entendidas_${local.id}`, n)
  }

  function alternar(id) {
    setAbiertas(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function entregar(c) {
    setConfirmar(null)
    try {
      await api.entregar(c)
      // 🔔 Aviso con la app cerrada al mesero y al admin (no frena a la cocina si falla).
      if (!demo) notificarListo(local.id, c.id)
    } catch { setError('No se pudo marcar como entregada. Intenta de nuevo.') }
  }

  return (
    <div className="km" style={colores.vars}>
      <div className="km-barra">
        <div className="km-tabs" role="tablist">
          <button role="tab" aria-selected={vista === 'fila'} className={vista === 'fila' ? 'on' : ''} onClick={() => setVista('fila')}>
            En fila <span className="km-n">{activas?.length ?? 0}</span>
          </button>
          <button role="tab" aria-selected={vista === 'entregadas'} className={vista === 'entregadas' ? 'on' : ''} onClick={() => setVista('entregadas')}>
            Entregadas
          </button>
        </div>
        <div className="km-herr">
          {esAdmin && <AjusteTiempos local={local} onGuardar={cfg => onUpdateLocal({ comandasConfig: cfg })} />}
          {esAdmin && <AdminEquipo local={local} rol="cocina" demo={demo} />}
        </div>
      </div>

      {!turno.activo && (
        <button className="km-turno" onClick={turno.empezar}>
          <span aria-hidden="true">🔔</span>
          <span><strong>Empezar turno</strong><small>Activa el sonido de comandas nuevas y mantiene la pantalla encendida.</small></span>
        </button>
      )}

      {error && <p className="km-error" role="alert">{error} <button onClick={() => setError('')}>✕</button></p>}

      {canceladas.map(c => (
        <div key={c.id} className="km-cancelada" role="alert">
          <div>
            <strong>CANCELADA</strong>
            <span>{etiquetaDestino(c.destino)} · {itemsTxt(c.cantidadItems)}{c.canceladaPor?.nombre ? ` · la canceló ${c.canceladaPor.nombre.split(' ')[0]}` : ''}</span>
          </div>
          <button onClick={() => entender(c.id)}>Entendido</button>
        </div>
      ))}

      {vista === 'fila' ? (
        activas === null ? <p className="km-vacio">Cargando comandas…</p>
          : activas.length === 0 ? (
            <div className="km-vacio km-vacio--grande">
              <span aria-hidden="true">🍳</span>
              <p>No hay comandas pendientes.</p>
              <small>Las nuevas aparecen aquí solas, en orden de llegada.</small>
            </div>
          ) : (
            <div className="km-grid">
              {activas.map((c, i) => (
                <Comanda
                  key={c.id} c={c} n={i + 1} abierta={abiertas.has(c.id)} nueva={nuevas.has(c.id)}
                  ahora={ahora} umbrales={umbrales}
                  onAlternar={() => alternar(c.id)}
                  onTachar={(uid, hecho) => api.marcarItem(c, uid, hecho)}
                  onTacharTodo={hecho => api.marcarTodo(c, hecho)}
                  onEntregar={() => setConfirmar(c)}
                />
              ))}
            </div>
          )
      ) : (
        <Entregadas api={api} recientes={recientes} cursor={cursor} ahora={ahora} />
      )}

      {confirmar && (
        <div className="km-velo" onClick={() => setConfirmar(null)}>
          <div className={`km-confirma ${confirmar.destino?.tipo === 'llevar' ? 'llevar' : 'mesa'}`} role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <p className="km-confirma-dest">{etiquetaDestino(confirmar.destino)}</p>
            <h2>¿Ya se entregó todo?</h2>
            <p className="km-confirma-txt">{itemsTxt(confirmar.cantidadItems)} · lleva {minutosSeg((ahora - (ms(confirmar.creadaEn) || ahora)) / 1000)}</p>
            <button className="km-si" onClick={() => entregar(confirmar)}>✓ Sí, entregado</button>
            <button className="km-no" onClick={() => setConfirmar(null)}>No, volver</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Una comanda de la fila.
function Comanda({ c, n, abierta, nueva, ahora, umbrales, onAlternar, onTachar, onTacharTodo, onEntregar }) {
  const llevar = c.destino?.tipo === 'llevar'
  const seg = (ahora - (ms(c.creadaEn) || ahora)) / 1000
  const nivel = nivelTiempo(seg, umbrales)
  const hechos = c.items.filter(i => i.hecho).length
  const todo = hechos === c.items.length
  const [verLleva, setVerLleva] = useState(() => new Set()) // ítems con «¿Qué lleva?» abierto
  const alternarLleva = uid => setVerLleva(s => { const n = new Set(s); n.has(uid) ? n.delete(uid) : n.add(uid); return n })
  return (
    <article className={`km-com ${llevar ? 'llevar' : 'mesa'} ${abierta ? 'abierta' : ''} ${nueva ? 'nueva' : ''} t-${nivel}`}>
      <button className="km-com-cab" onClick={onAlternar} aria-expanded={abierta}>
        <span className="km-com-tipo">{llevar ? 'PARA LLEVAR' : 'MESA'}</span>
        <span className="km-com-dest">{llevar ? (c.destino?.nombre || '') : (c.destino?.mesa || c.destino?.nombre || '')}</span>
        <span className="km-com-orden">#{n}</span>
      </button>
      <button className="km-com-resumen" onClick={onAlternar} tabIndex={-1}>
        <span className={`km-reloj ${nivel}`}>⏱ {minutosSeg(seg)}</span>
        <span className="km-com-cuenta">{itemsTxt(c.cantidadItems)}</span>
        {hechos > 0 && <span className="km-com-prog">{hechos}/{c.items.length} ✓</span>}
        <span className="km-com-flecha" aria-hidden="true">{abierta ? '▲' : '▼'}</span>
      </button>

      {abierta && (
        <div className="km-com-cuerpo">
          <ul className="km-items">
            {c.items.map(it => (
              <li key={it.uid} className="km-item-li">
                <button className={`km-item ${it.hecho ? 'hecho' : ''}`} onClick={() => onTachar(it.uid, !it.hecho)} aria-pressed={it.hecho}>
                  <span className="km-item-check" aria-hidden="true">{it.hecho ? '✓' : ''}</span>
                  <span className="km-item-txt">
                    <span className="km-item-nombre"><b>{it.cantidad}×</b> {it.nombre}</span>
                    {it.opciones && <span className="km-item-op">{it.opciones}</span>}
                    {it.comentario && <span className="km-item-com">💬 {it.comentario}</span>}
                  </span>
                </button>
                {/* «¿Qué lleva?» va APARTE del botón de tachar: consultarlo nunca tacha nada. */}
                {it.descripcion && (
                  <>
                    <button className={`km-lleva ${verLleva.has(it.uid) ? 'on' : ''}`} onClick={() => alternarLleva(it.uid)} aria-expanded={verLleva.has(it.uid)}>
                      ⓘ ¿Qué lleva?
                    </button>
                    {verLleva.has(it.uid) && <p className="km-lleva-txt">{it.descripcion}</p>}
                  </>
                )}
              </li>
            ))}
          </ul>
          {todo ? (
            <button className="km-entregar" onClick={onEntregar}>✓ Confirmar entregado</button>
          ) : (
            <button className="km-tachar-todo" onClick={() => onTacharTodo(true)}>Tachar todo</button>
          )}
          {todo && <button className="km-destachar" onClick={() => onTacharTodo(false)}>Destachar todo</button>}
          {c.creadaPor?.nombre && <p className="km-quien">La tomó {c.creadaPor.nombre}</p>}
        </div>
      )}
    </article>
  )
}

// Entregadas: las últimas en vivo (con Deshacer los primeros minutos) + «Ver más» por partes.
const MIN_DESHACER = 15
function Entregadas({ api, recientes, cursor, ahora }) {
  const [mas, setMas] = useState([])
  const [cur, setCur] = useState(undefined) // undefined = aún no se pidió más
  const [hayMas, setHayMas] = useState(null) // null = se deduce de la primera página
  const [cargando, setCargando] = useState(false)
  const lista = [...recientes, ...mas.filter(m => !recientes.some(r => r.id === m.id))]
  const siguiente = cur === undefined ? cursor : cur
  // Solo hay «más antiguas» si la última página que llegó venía llena.
  const quedan = hayMas ?? recientes.length >= POR_PAGINA

  async function verMas() {
    if (!siguiente) return
    setCargando(true)
    try {
      const { lista: l, ultimo } = await api.historial(siguiente)
      setMas(m => [...m, ...l])
      setCur(ultimo)
      setHayMas(l.length >= POR_PAGINA)
    } finally { setCargando(false) }
  }

  if (!lista.length) return <p className="km-vacio">Todavía no hay comandas entregadas.</p>
  return (
    <div className="km-hist">
      <ul>
        {lista.map(c => {
          const fin = ms(c.cerradaEn)
          const dur = fin && ms(c.creadaEn) ? (fin - ms(c.creadaEn)) / 1000 : null
          const puedeDeshacer = c.estado === 'entregada' && fin && (ahora - fin) < MIN_DESHACER * 60000
          return (
            <li key={c.id} className={`km-hist-fila ${c.estado}`}>
              <div className="km-hist-txt">
                <strong>{etiquetaDestino(c.destino)}</strong>
                <span>
                  {c.estado === 'cancelada' ? 'Cancelada' : `Entregada en ${dur != null ? minutosSeg(dur) : '—'}`}
                  {' · '}{itemsTxt(c.cantidadItems)} · {hora(fin)}
                </span>
              </div>
              {puedeDeshacer && <button onClick={() => api.deshacer(c)}>↶ Deshacer</button>}
            </li>
          )
        })}
      </ul>
      {siguiente && quedan && (
        <button className="km-mas" onClick={verMas} disabled={cargando}>{cargando ? 'Cargando…' : 'Ver más antiguas'}</button>
      )}
    </div>
  )
}

// ⚙️ Minutos del contador (solo admin).
function AjusteTiempos({ local, onGuardar }) {
  const [abierto, setAbierto] = useState(false)
  const actual = umbralesDe(local)
  const [amarillo, setAmarillo] = useState(actual.amarillo)
  const [rojo, setRojo] = useState(actual.rojo)
  const valido = amarillo > 0 && rojo > amarillo
  return (
    <>
      <button className="eq-abrir" onClick={() => setAbierto(true)}>⏱ Tiempos</button>
      {abierto && (
        <div className="eq-velo" onClick={() => setAbierto(false)}>
          <div className="eq-ventana" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <header className="eq-cab">
              <div>
                <h2>Colores del contador</h2>
                <p>A los cuántos minutos la comanda se pone amarilla y roja.</p>
              </div>
              <button className="eq-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar">✕</button>
            </header>
            <div className="km-tiempos">
              <label><span className="km-reloj verde">Verde</span> desde que llega</label>
              <label><span className="km-reloj amarillo">Amarillo</span> a los
                <input type="number" min="1" max="120" value={amarillo} onChange={e => setAmarillo(Number(e.target.value))} /> min</label>
              <label><span className="km-reloj rojo">Rojo</span> a los
                <input type="number" min="2" max="240" value={rojo} onChange={e => setRojo(Number(e.target.value))} /> min</label>
            </div>
            {!valido && <p className="eq-error">El rojo tiene que ser después del amarillo.</p>}
            <div className="km-tiempos-acc">
              <button className="btn btn-ghost" onClick={() => { setAmarillo(UMBRALES_DEFECTO.amarillo); setRojo(UMBRALES_DEFECTO.rojo) }}>Por defecto</button>
              <button className="btn btn-primary" disabled={!valido} onClick={async () => { await onGuardar({ minAmarillo: amarillo, minRojo: rojo }); setAbierto(false) }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 🔔 Turno de cocina: el navegador solo deja sonar y mantener la pantalla encendida después de
// que alguien toca la pantalla. «Empezar turno» hace ese toque y deja todo listo.
function useTurno() {
  const ctx = useRef(null)
  const lock = useRef(null)
  const [activo, setActivo] = useState(false)

  const pedirPantalla = async () => {
    try { if ('wakeLock' in navigator) lock.current = await navigator.wakeLock.request('screen') } catch { /* sin permiso */ }
  }
  // Al volver a la pestaña, el navegador suelta el «no apagar»: se pide otra vez.
  useEffect(() => {
    if (!activo) return
    const f = () => { if (document.visibilityState === 'visible') pedirPantalla() }
    document.addEventListener('visibilitychange', f)
    return () => { document.removeEventListener('visibilitychange', f); lock.current?.release?.().catch(() => {}) }
  }, [activo])

  return useMemo(() => ({
    activo,
    async empezar() {
      try {
        ctx.current = ctx.current || new (window.AudioContext || window.webkitAudioContext)()
        await ctx.current.resume()
      } catch { /* sin audio */ }
      await pedirPantalla()
      setActivo(true)
      tono(ctx.current, 0.12)
    },
    sonar() { tono(ctx.current, 0.35) },
  }), [activo])
}

// «Ding-dong» corto con el sintetizador del navegador (sin archivos de audio).
function tono(ctx, volumen) {
  if (!ctx) return
  try {
    const t0 = ctx.currentTime
    ;[[880, 0], [660, 0.22]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + d)
      g.gain.exponentialRampToValueAtTime(volumen, t0 + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.45)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + d); o.stop(t0 + d + 0.5)
    })
  } catch { /* nada */ }
}

function hora(m) { return m ? new Date(m).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '' }
function leerLista(k) { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
function guardarLista(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* nada */ } }
