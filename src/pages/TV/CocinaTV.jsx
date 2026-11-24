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

  // Las filas que no caben no se cortan a la mitad: se esconden y se cuentan («+3 más en fila»).
  const caja = useRef(null)
  const [ocultas, setOcultas] = useState(0)
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) { setOcultas(0); return }
    const alto = el.clientHeight
    let n = 0
    for (const t of el.children) {
      const fuera = t.offsetTop + t.offsetHeight > alto + 2
      t.style.visibility = fuera ? 'hidden' : ''
      if (fuera) n++
    }
    setOcultas(n)
  })

  const estados = comandas.map(estadoDe)
  const cuenta = k => estados.filter(e => e.k === k).length
  const fecha = new Date(ahora)
  const hora = fecha.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  const dia = fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
  const logo = local.icono || local.logo
  return (
    <div className={`tv ktv ${vertical ? 'ktv-vertical' : ''}`} style={colores.vars}>
      <header className="ktv-cab">
        <div className="ktv-marcaLocal">
          {logo ? <img className="ktv-logo" src={logo} alt="" /> : null}
          <strong className="ktv-nombre">{local.nombre}</strong>
        </div>
        <span className="ktv-sep" />
        <div className="ktv-titulo"><Ico n="campana" /> Comandas en cocina</div>
        <div className="ktv-dia"><Ico n="calendario" /> {dia.charAt(0).toUpperCase() + dia.slice(1)}</div>
        <span className="ktv-sep" />
        <div className="ktv-hora">{hora}</div>
      </header>
      {sinRed && <div className="ktv-aviso">⚠️ Sin conexión: puede que falten comandas. Se reconecta sola.</div>}
      {!sonido.activo && <div className="ktv-sonido">Pulsa <b>OK</b> o toca la pantalla para que suene cuando llegue una comanda</div>}

      {comandas.length === 0 ? (
        <div className="ktv-vacio">
          <Ico n="campana" />
          <p>No hay comandas pendientes</p>
          <small>Las nuevas aparecen aquí solas, en orden de llegada.</small>
        </div>
      ) : (
        <div className="ktv-filas" ref={caja}>
          {comandas.map((c, i) => <Comanda key={c.id} c={c} n={i + 1} estado={estados[i]} ahora={ahora} umbrales={umbrales} nueva={nuevas.has(c.id)} />)}
        </div>
      )}

      <footer className="ktv-pie">
        <span className="ktv-pie-total"><Ico n="lista" /> <b>{comandas.length}</b> {comandas.length === 1 ? 'comanda activa' : 'comandas activas'}</span>
        <span className="ktv-sep" />
        <span className="ktv-pie-item entregar"><Ico n="campana" /> <b>{cuenta('entregar')}</b> por entregar</span>
        <span className="ktv-pie-item prep"><Ico n="gorro" /> <b>{cuenta('prep')}</b> en preparación</span>
        <span className="ktv-pie-item avance"><Ico n="reloj" /> <b>{cuenta('avance')}</b> a medias</span>
        {ocultas > 0 && <span className="ktv-mas">+{ocultas} más en fila</span>}
      </footer>
      <div className="ktv-brasa" aria-hidden="true" />
    </div>
  )
}

// Cómo va la comanda, a la derecha de la fila (lo marca la cocina tachando desde el celular).
function estadoDe(c) {
  const vivos = (c.items || []).filter(i => !i.quitado)
  const hechos = vivos.filter(i => i.hecho).length
  if (c.cambioPendiente) return { k: 'cambio', txt: '⚠️ Cambió' }
  if (vivos.length && hechos === vivos.length) return { k: 'entregar', txt: 'Por entregar' }
  if (hechos > 0) return { k: 'avance', txt: `${hechos}/${vivos.length} ✓` }
  return { k: 'prep', txt: 'En preparación' }
}

const ICONO_TIPO = { mesa: 'mesa', llevar: 'moto', domicilio: 'casa' }

function Comanda({ c, n, estado, ahora, umbrales, nueva }) {
  const clase = claseDestino(c.destino)
  const seg = (ahora - (ms(c.creadaEn) || ahora)) / 1000
  const nivel = nivelTiempo(seg, umbrales)
  const vivos = (c.items || []).filter(i => !i.quitado)
  const mesa = clase === 'mesa' ? (c.destino?.mesa || '') : ''
  const nombre = c.destino?.nombre || ''
  return (
    <article className={`ktv-fila ${clase} ${nueva ? 'nueva' : ''}`}>
      <div className="ktv-tipo">
        <Ico n={ICONO_TIPO[clase]} />
        <span className="ktv-tipo-txt">{palabraDestino(c.destino)}</span>
        {mesa ? <span className="ktv-tipo-mesa">{mesa}</span> : null}
      </div>
      <div className="ktv-num">#{n}{c.turno ? <small>T{c.turno}</small> : null}</div>
      <div className="ktv-quien">{nombre}</div>
      <div className="ktv-platos">
        <Ico n="campana" />
        <ul>
          {vivos.map(it => (
            <li key={it.uid} className={it.hecho ? 'hecho' : ''}>
              <span className="ktv-plato"><b>{it.cantidad}×</b> {it.nombre}</span>
              {(it.opciones || it.comentario) && (
                <span className="ktv-op">
                  {it.opciones}
                  {it.comentario && <em className="ktv-nota">💬 {it.comentario}</em>}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className={`ktv-reloj ${nivel}`}><Ico n="reloj" /> {minutosSeg(seg)}</div>
      <div className={`ktv-estado ${estado.k}`}>{estado.k === 'entregar' && <Ico n="campana" />}{estado.txt}</div>
    </article>
  )
}

// Íconos de línea (SVG, se ven igual en cualquier TV; los emojis cambian según el aparato).
function Ico({ n }) {
  const p = {
    campana: <><path d="M3 18h18" /><path d="M5 18a7 7 0 0 1 14 0" /><path d="M12 9V7" /><path d="M10 7h4" /></>,
    calendario: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
    reloj: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M10 2h4" /></>,
    mesa: <><path d="M3 8h18" /><path d="M6 8v11M18 8v11" /><path d="M6 13h12" /></>,
    moto: <><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M9 17h6l-2-6h-3M15 11l3 6M13 11V7h3" /></>,
    casa: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
    lista: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 9h6M9 13h6M9 17h4" /></>,
    gorro: <><path d="M7 14a4 4 0 1 1 1.5-7.7A4.5 4.5 0 0 1 16.5 6.3 4 4 0 1 1 17 14" /><path d="M7 14v5h10v-5" /></>,
  }[n]
  return <svg className="ktv-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>
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
