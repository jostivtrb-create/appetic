import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getApps, initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth'
import { getFirestore, collection, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import app, { db } from '../../config/firebase'
import { getLocalBySlug } from '../../services/locales'
import { comandasDe, ms } from '../../services/comandas'
import { coloresComanda, umbralesDe, nivelTiempo, minutosSeg, claseDestino, palabraDestino, useAhora } from '../Admin/comandaUtils'
import { activarSonido, tocar } from '../../utils/sonido'
import { RedTV } from './PantallaTV'
import './PantallaTV.css'
import './CocinaTV.css'

// 🍳📺 TV DE COMANDAS: appetic.vercel.app/<slug>/cocina?k=<clave>
//
// Igual que el TV del menú (link fijo, sin iniciar sesión, se deja abierto todo el día), pero muestra
// SOLO las comandas que van saliendo, en orden de llegada, grandes para leerlas desde el fogón.
// El TV solo MIRA: tachar y entregar se hace desde los celulares (pantalla de Comandas), y el TV se
// entera en vivo. Pensado para restaurantes sin tablet en la cocina (la grasa) que ya tienen un TV.
//
// Las comandas no son públicas: la clave del link se cambia por una sesión de Firebase que solo lee
// las comandas de ESTE local (api/tv-cocina.js · firestore.rules → esTVCocina). La sesión vive en una
// app de Firebase APARTE ('tv-cocina'), así no se mezcla con la sesión de Google del navegador.
//
// Con ?preview=1 lee las comandas de PRUEBA del navegador (las mismas de la pantalla de Comandas en
// la vista previa), para probarla sin tocar la base.

const APP_TV = 'tv-cocina'
function firebaseTV() {
  const a = getApps().find(x => x.name === APP_TV) || initializeApp(app.options, APP_TV)
  return { auth: getAuth(a), db: getFirestore(a) }
}

// La primera respuesta de la sesión guardada en el aparato (o null).
function sesionGuardada(auth) {
  return new Promise(res => { const off = onAuthStateChanged(auth, u => { off(); res(u) }) })
}

async function entrar(auth, slug, k) {
  let r
  try {
    r = await fetch('/api/tv-cocina', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'entrar', slug, k }) })
  } catch { throw new Error('red') }
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.motivo || (r.status >= 500 ? 'red' : 'clave'))
  await signInWithCustomToken(auth, d.token)
  return d.localId
}

export default function CocinaTV() {
  return <RedTV recargar><CocinaTVInterna /></RedTV>
}

function CocinaTVInterna() {
  const { slug } = useParams()
  const busqueda = new URLSearchParams(window.location.search)
  const preview = busqueda.has('preview')
  const k = busqueda.get('k') || ''
  const [local, setLocal] = useState(null)
  const [comandas, setComandas] = useState(null)
  const [error, setError] = useState(null) // no-existe | clave | plan | cortado | red

  // 🏪 El local (público): nombre, logo, colores y los minutos del contador.
  useEffect(() => {
    let vivo = true, off = () => {}
    ;(async () => {
      try {
        if (preview) {
          const { getPreviewLocal } = await import('../../preview')
          const p = await getPreviewLocal(slug)
          if (!vivo) return
          if (!p) { setError('no-existe'); return }
          setLocal(p.local)
          return
        }
        const l = await getLocalBySlug(slug)
        if (!vivo) return
        if (!l) { setError('no-existe'); return }
        setLocal(l)
        off = onSnapshot(doc(db, 'locales', l.id), s => { if (s.exists()) setLocal({ id: s.id, ...s.data() }) }, () => {})
      } catch { if (vivo) setError('red') }
    })()
    return () => { vivo = false; off() }
  }, [slug, preview])

  // 🧾 Las comandas en fila, en vivo.
  const localId = local?.id
  useEffect(() => {
    if (!localId) return
    if (preview) return comandasDe(localId, { demo: true }).escucharActivas(l => setComandas(l))
    if (!k) { setError('clave'); return }
    const { auth, db: dbTV } = firebaseTV()
    let vivo = true, off = () => {}, reintento = null, ultimaEntrada = 0
    const escuchar = () => {
      off()
      const q = query(collection(dbTV, 'locales', localId, 'comandas'), where('estado', '==', 'activa'), orderBy('creadaEn', 'asc'))
      off = onSnapshot(q, s => { setComandas(s.docs.map(d => ({ id: d.id, ...d.data() }))); setError(null) }, e => {
        // Sin permiso = el link cambió o la sesión venció: se vuelve a entrar con la clave (máx. 1 vez por minuto).
        if (e?.code === 'permission-denied' && Date.now() - ultimaEntrada > 60000) conectar(true)
        else { setError('red'); reintento = setTimeout(() => vivo && conectar(false), 30000) }
      })
    }
    async function conectar(forzar) {
      try {
        const u = await sesionGuardada(auth)
        const claims = u ? (await u.getIdTokenResult()).claims : {}
        if (forzar || claims.tvCocina !== localId) { ultimaEntrada = Date.now(); await entrar(auth, slug, k) }
        if (vivo) escuchar()
      } catch (e) {
        if (!vivo) return
        const motivo = e?.message || 'red'
        setError(['clave', 'plan', 'cortado', 'no-existe'].includes(motivo) ? motivo : 'red')
        if (motivo === 'red') reintento = setTimeout(() => vivo && conectar(forzar), 30000)
      }
    }
    conectar(false)
    return () => { vivo = false; off(); clearTimeout(reintento) }
  }, [localId, slug, k, preview])

  if (error === 'no-existe') return <Mensaje titulo="Este local no existe" texto={`Revisa el link: /${slug}/cocina`} />
  if (error === 'clave') return <Mensaje titulo="Este link de cocina ya no sirve" texto="Pide el link nuevo en el panel: Cocina → 📺 TV de cocina." />
  if (error === 'plan') return <Mensaje titulo="La TV de cocina no está en tu plan" texto="Necesita la pantalla de cocina. Escríbenos para activarla." />
  if (error === 'cortado') return <Mensaje titulo="El local está temporalmente fuera de servicio" texto="La pantalla vuelve sola apenas el local esté de nuevo en línea." />
  if (!local || comandas === null) {
    return error === 'red'
      ? <Mensaje titulo="No hay conexión" texto="Revisa el internet del TV. La pantalla vuelve sola." />
      : <div className="tv tv-cargando"><div className="tv-spinner" /></div>
  }
  return <Fila local={local} comandas={comandas} sinRed={error === 'red'} />
}

function Fila({ local, comandas, sinRed }) {
  const ahora = useAhora()
  const umbrales = umbralesDe(local)
  const colores = coloresComanda(local)
  const vertical = useVertical()
  const sonido = useSonido()

  // 🔔 Comanda nueva → «ding-dong» (si alguien ya tocó el TV una vez) y resaltada unos segundos.
  const vistas = useRef(null)
  const [nuevas, setNuevas] = useState(() => new Set())
  useEffect(() => {
    const ids = new Set(comandas.map(c => c.id))
    if (vistas.current) {
      const llegaron = comandas.filter(c => !vistas.current.has(c.id)).map(c => c.id)
      if (llegaron.length) {
        sonido.sonar()
        setNuevas(n => new Set([...n, ...llegaron]))
        setTimeout(() => setNuevas(n => { const m = new Set(n); llegaron.forEach(id => m.delete(id)); return m }), 10000)
      }
    }
    vistas.current = ids
  }, [comandas, sonido])

  // Las que no caben en la pantalla no se cortan a la mitad: se esconden y se cuentan («+3 en fila»).
  const caja = useRef(null)
  const [ocultas, setOcultas] = useState(0)
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const ancho = el.clientWidth
    let n = 0
    for (const t of el.children) {
      const fuera = t.offsetLeft >= ancho - 4
      t.style.visibility = fuera ? 'hidden' : ''
      if (fuera) n++
    }
    setOcultas(n)
  })

  const hora = new Date(ahora).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  return (
    <div className={`tv ktv ${vertical ? 'ktv-vertical' : ''}`} style={colores.vars}>
      <header className="ktv-cab">
        {local.icono || local.logo ? <img className="ktv-logo" src={local.icono || local.logo} alt="" /> : null}
        <div className="ktv-titulo">
          <strong>{local.nombre}</strong>
          <span>🍳 Comandas en orden de llegada</span>
        </div>
        <div className="ktv-cuenta">{comandas.length}<small>en fila</small></div>
        <div className="ktv-hora">{hora}</div>
      </header>
      {sinRed && <div className="ktv-aviso">⚠️ Sin conexión: puede que falten comandas. Se reconecta sola.</div>}
      {!sonido.activo && <div className="ktv-sonido">Pulsa <b>OK</b> o toca la pantalla para que suene cuando llegue una comanda</div>}

      {comandas.length === 0 ? (
        <div className="ktv-vacio">
          <span aria-hidden="true">🍳</span>
          <p>No hay comandas pendientes</p>
          <small>Las nuevas aparecen aquí solas, en orden de llegada.</small>
        </div>
      ) : (
        <div className="ktv-cols" ref={caja}>
          {comandas.map((c, i) => <Tarjeta key={c.id} c={c} n={i + 1} ahora={ahora} umbrales={umbrales} nueva={nuevas.has(c.id)} />)}
        </div>
      )}
      {ocultas > 0 && <div className="ktv-mas">+{ocultas} más en fila</div>}
      <span className="tv-marca ktv-marca">Hecho con <b>Appetic</b></span>
    </div>
  )
}

function Tarjeta({ c, n, ahora, umbrales, nueva }) {
  const clase = claseDestino(c.destino)
  const seg = (ahora - (ms(c.creadaEn) || ahora)) / 1000
  const nivel = nivelTiempo(seg, umbrales)
  const vivos = (c.items || []).filter(i => !i.quitado)
  const hechos = vivos.filter(i => i.hecho).length
  const quien = clase === 'mesa' ? (c.destino?.mesa || c.destino?.nombre || '') : (c.destino?.nombre || '')
  return (
    <article className={`ktv-com ${clase} t-${nivel} ${nueva ? 'nueva' : ''}`}>
      <div className="ktv-com-cab">
        <span className="ktv-com-tipo">{palabraDestino(c.destino)}</span>
        <span className="ktv-com-dest">{quien}</span>
        {c.turno ? <span className="ktv-com-turno">T{c.turno}</span> : null}
        <span className="ktv-com-n">#{n}</span>
      </div>
      <div className="ktv-com-meta">
        <span className={`ktv-reloj ${nivel}`}>⏱ {minutosSeg(seg)}</span>
        {hechos > 0 && <span className="ktv-prog">{hechos}/{vivos.length} ✓</span>}
        {c.cambioPendiente && <span className="ktv-cambio">⚠️ CAMBIÓ</span>}
      </div>
      <ul className="ktv-items">
        {vivos.map(it => (
          <li key={it.uid} className={it.hecho ? 'hecho' : ''}>
            <span className="ktv-item-nombre"><b>{it.cantidad}×</b> {it.nombre}</span>
            {it.opciones && <span className="ktv-item-op">{it.opciones}</span>}
            {it.comentario && <span className="ktv-item-com">💬 {it.comentario}</span>}
          </li>
        ))}
      </ul>
    </article>
  )
}

function Mensaje({ titulo, texto }) {
  return (
    <div className="tv tv-mensaje">
      <div><h1>{titulo}</h1><p>{texto}</p></div>
      <span className="tv-marca">Hecho con <b>Appetic</b></span>
    </div>
  )
}

function useVertical() {
  const leer = () => window.innerHeight > window.innerWidth
  const [v, setV] = useState(leer)
  useEffect(() => {
    const f = () => setV(leer())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return v
}

// El navegador solo deja sonar después de un toque o una tecla (el OK del control del TV).
function useSonido() {
  const [activo, setActivo] = useState(false)
  useEffect(() => {
    if (activo) return
    const prender = () => activarSonido().then(() => { setActivo(true); tocar([[880, 0], [660, 0.22]], 0.12, 0.45) }).catch(() => {})
    window.addEventListener('click', prender)
    window.addEventListener('keydown', prender)
    return () => { window.removeEventListener('click', prender); window.removeEventListener('keydown', prender) }
  }, [activo])
  return useMemo(() => ({ activo, sonar: () => { if (activo) tocar([[880, 0], [660, 0.22]], 0.4, 0.45) } }), [activo])
}
