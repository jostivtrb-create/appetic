import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/appetic-logo.png'
import { getLocalesExplorador, getLocalesDeAdmin } from '../../services/locales'
import { getHistorial } from '../../services/historial'
import { CATEGORIAS_LOCALES } from '../../config/categoriasLocales'
import { estaAbierto } from '../../utils/horario'
import { distanciaKm } from '../../utils/geo'
import { costoDomicilio } from '../../utils/delivery'
import { cop } from '../../utils/money'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { useNavUI } from '../../contexts/NavUIContext'
import './Home.css'

// ─────────────────────────────────────────────────────────────────────────────
// 🎲 Rotación DIARIA sin backend: barajamos con la fecha como semilla. El mismo
// día todos ven el mismo orden (estable), y al día siguiente cambia solo.
function semillaDelDia(extra = '') {
  const hoy = new Date()
  const s = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}-${extra}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
function barajarConSemilla(arr, semilla) {
  const a = [...arr]
  let s = semilla || 1
  for (let i = a.length - 1; i > 0; i--) {
    // mulberry32 compacto
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
    const j = Math.floor(r * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 🆕 ¿El local llegó hace menos de 14 días? (creadoEn lo pone el seed al crear)
function esNuevo(creadoEn) {
  try {
    const ms = creadoEn?.toMillis ? creadoEn.toMillis() : (creadoEn?.seconds ? creadoEn.seconds * 1000 : null)
    if (!ms) return false
    return Date.now() - ms < 14 * 86400000
  } catch { return false }
}

export default function Home() {
  const { user, cargando: authCargando } = useAuth()
  const { favoritos } = useFavoritos()
  const { irAOtroLocal } = useNavUI()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('cargando') // cargando | ok | error
  const [locales, setLocales] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [catActiva, setCatActiva] = useState(null) // id de etiqueta o null
  const [coord, setCoord] = useState(null)
  const [ubic, setUbic] = useState('idle') // idle | cargando | ok | error
  const [avatarFallo, setAvatarFallo] = useState(false)
  // 🔑 El dueño de un local NO ve el inicio: apenas entra va directo a su panel.
  const [verificandoAdmin, setVerificandoAdmin] = useState(true)

  useEffect(() => {
    if (authCargando) return
    if (!user) { setVerificandoAdmin(false); return }
    let activo = true
    getLocalesDeAdmin(user.email)
      .then(admin => {
        if (!activo) return
        if (admin.length === 1) { navigate(`/${admin[0].slug}/admin/catalogo`, { replace: true }); return }
        if (admin.length > 1) { navigate('/cuenta', { replace: true }); return }
        setVerificandoAdmin(false)
      })
      .catch(() => { if (activo) setVerificandoAdmin(false) })
    return () => { activo = false }
  }, [user, authCargando, navigate])

  // 👀 /?preview=1 arma el inicio desde el código (sin base de datos): para revisar
  // el diseño antes de sembrar, igual que el ?preview=1 de los menús.
  const enPreview = useMemo(() => new URLSearchParams(window.location.search).has('preview'), [])

  // 🧲 Marca que este visitante YA conoce el buscador (por sesión): quien llega a un
  // menú por link directo sin haber pasado por aquí recibe un aviso amable si intenta
  // salirse hacia el buscador (ver BottomNav → irABuscar).
  useEffect(() => {
    try { sessionStorage.setItem('appetic_conoce_buscador', '1') } catch { /* nada */ }
  }, [])

  useEffect(() => {
    let activo = true
    const cargar = enPreview
      ? import('../../preview').then(m => m.getPreviewLocales())
      : getLocalesExplorador()
    cargar
      .then(ls => { if (activo) { setLocales(ls); setEstado('ok') } })
      .catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [enPreview])

  function usarMiUbicacion() {
    if (!navigator.geolocation) { setUbic('error'); return }
    setUbic('cargando')
    navigator.geolocation.getCurrentPosition(
      pos => { setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setUbic('ok') },
      () => setUbic('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // 🧾 Señales personales (0 lecturas: historial del dispositivo + favoritos ya en memoria).
  const señales = useMemo(() => {
    const hist = getHistorial()
    const porSlug = {}
    for (const h of hist) {
      if (!h.localSlug) continue
      const s = porSlug[h.localSlug] || { veces: 0, ultima: 0 }
      s.veces += 1
      s.ultima = Math.max(s.ultima, h.fecha || 0)
      porSlug[h.localSlug] = s
    }
    const favIds = new Set((favoritos || []).map(f => f.id))
    return { porSlug, favIds }
  }, [favoritos])

  // Distancia + domicilio + abierto + puntaje de TODOS los locales (una sola pasada).
  const enriquecidos = useMemo(() => {
    return locales.map(l => {
      const distancia = coord ? distanciaKm(l.ubicacion, coord) : null
      const domi = coord ? costoDomicilio(distancia, l.domicilio) : null
      const abierto = estaAbierto(l.horario)
      const nuevo = esNuevo(l.creadoEn)
      // 🧠 Puntaje personal: favorito > pedidos previos > cercanía > prioridad comercial.
      const s = señales.porSlug[l.slug]
      let score = 0
      if (señales.favIds.has(l.id)) score += 50
      if (s) {
        score += Math.min(s.veces, 3) * 20                       // frecuencia (tope 60)
        if (Date.now() - s.ultima < 7 * 86400000) score += 20     // pidió hace poco
      }
      if (distancia != null) score += Math.max(0, 15 - distancia * 3) // cercanía (0–15)
      // (la prioridad comercial NO va en el score: es una llave de orden absoluta aparte)
      return { ...l, distancia, domi, abierto, nuevo, score }
    })
  }, [locales, coord, señales])

  // 🗂️ Chips: solo categorías del catálogo con al menos un local activo.
  const categoriasVisibles = useMemo(() => {
    const usadas = new Set()
    for (const l of locales) for (const e of l.etiquetas || []) usadas.add(e)
    return CATEGORIAS_LOCALES.filter(c => usadas.has(c.id))
  }, [locales])

  // Filtro por categoría + búsqueda de texto (nombre, descripción, categorías del menú y etiquetas).
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let base = enriquecidos
    if (catActiva) base = base.filter(l => (l.etiquetas || []).includes(catActiva))
    if (q) {
      base = base.filter(l => {
        const enNombre = l.nombre?.toLowerCase().includes(q)
        const enDesc = l.descripcion?.toLowerCase().includes(q)
        const enCats = (l.categorias || []).some(c => c.nombre?.toLowerCase().includes(q))
        const enEtiquetas = (l.etiquetas || []).some(id => {
          const cat = CATEGORIAS_LOCALES.find(c => c.id === id)
          return cat?.nombre.toLowerCase().includes(q)
        })
        return enNombre || enDesc || enCats || enEtiquetas
      })
    }
    // Orden: abiertos primero SIEMPRE (cerrados atenuados al final); dentro de cada
    // grupo, la prioridad comercial manda en ABSOLUTO (el local bandera sale de
    // primeras siempre, sin marca visible) y luego el puntaje personal.
    return [...base].sort((a, b) => {
      if (a.abierto !== b.abierto) return a.abierto ? -1 : 1
      const pa = Number(a.prioridad) || 0
      const pb = Number(b.prioridad) || 0
      if (pa !== pb) return pb - pa
      return b.score - a.score
    })
  }, [enriquecidos, busqueda, catActiva])

  // 😋 "Para antojarte": los fuertes CON foto de cada local (hasta 6 por local, estilo
  // DiDi: pueden salir varios del mismo), rotados a diario y mezclados entre locales;
  // los de locales con prioridad van primero. Respeta el filtro de categoría.
  const antojos = useMemo(() => {
    const fuente = catActiva
      ? enriquecidos.filter(l => (l.etiquetas || []).includes(catActiva))
      : enriquecidos
    const platos = []
    for (const l of fuente) {
      const lista = (l.destacadosHome || []).filter(p => p.foto)
      if (!lista.length) continue
      const delDia = barajarConSemilla(lista, semillaDelDia(l.id)).slice(0, 6)
      for (const p of delDia) {
        platos.push({ ...p, local: l })
      }
    }
    const orden = barajarConSemilla(platos, semillaDelDia('antojos'))
    // Prioridad comercial adelante (estable dentro de cada grupo por el shuffle diario).
    orden.sort((a, b) => (Number(b.local.prioridad) || 0) - (Number(a.local.prioridad) || 0))
    return orden.slice(0, 18)
  }, [enriquecidos, catActiva])

  // ♾️ Fila de locales (squircles) con scroll infinito: repetimos la lista y al
  // acercarse a un borde saltamos un "segmento" (invisible para el usuario).
  const filaRef = useRef(null)
  const filaInteract = useRef(false) // el dedo la está tocando/arrastrando
  const filaPos = useRef(0)          // posición fluida del auto-scroll
  const filaRaf = useRef(0)
  const filaTimer = useRef(null)
  const filaLocales = useMemo(() => {
    if (enriquecidos.length < 2) return { items: enriquecidos, copias: 1 }
    let copias = 3
    while (enriquecidos.length * copias < 15) copias += 1
    return { items: Array.from({ length: copias }, () => enriquecidos).flat(), copias }
  }, [enriquecidos])

  // 🎠 La fila de locales se desliza SOLA (lento, en bucle) como las categorías del
  //    menú; el dedo puede arrastrarla y a los ~7 s sin tocarla retoma el giro.
  useEffect(() => {
    const el = filaRef.current
    if (!el || filaLocales.copias < 2) return
    const seg = () => el.scrollWidth / filaLocales.copias
    el.scrollLeft = seg() // arranca en el 2.º segmento (se puede arrastrar a ambos lados)
    filaPos.current = el.scrollLeft
    const SPEED = 0.4 // px por frame (~despacio)
    function frame() {
      filaRaf.current = requestAnimationFrame(frame)
      if (filaInteract.current) { filaPos.current = el.scrollLeft; return }
      const s = seg()
      filaPos.current += SPEED
      if (s > 0 && filaPos.current >= s * (filaLocales.copias - 1)) filaPos.current -= s // bucle sin costura
      el.scrollLeft = filaPos.current
    }
    filaRaf.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(filaRaf.current)
  }, [filaLocales])
  useEffect(() => () => { if (filaTimer.current) clearTimeout(filaTimer.current) }, [])

  function filaPausar() {
    filaInteract.current = true
    if (filaTimer.current) clearTimeout(filaTimer.current)
  }
  function filaReanudar() {
    const el = filaRef.current
    if (el && filaLocales.copias >= 2) {
      const s = el.scrollWidth / filaLocales.copias
      if (el.scrollLeft < s * 0.5) el.scrollLeft += s
      else if (el.scrollLeft > s * (filaLocales.copias - 1)) el.scrollLeft -= s
      filaPos.current = el.scrollLeft
    }
    if (filaTimer.current) clearTimeout(filaTimer.current)
    filaTimer.current = setTimeout(() => { filaInteract.current = false }, 7000)
  }

  function abrirLocal(l, extra = '') {
    // En preview, el menú destino también se abre en preview (flujo completo sin datos).
    const params = new URLSearchParams(extra.startsWith('?') ? extra.slice(1) : extra)
    if (enPreview) params.set('preview', '1')
    const qs = params.toString()
    irAOtroLocal(l.slug, () => navigate(`/${l.slug}${qs ? `?${qs}` : ''}`))
  }

  const ubicImprecisa = coord?.accuracy != null && coord.accuracy > 700
  const buscando = busqueda.trim().length > 0
  const sinFiltros = !buscando && !catActiva

  if (authCargando || verificandoAdmin) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }

  return (
    <div className="home">
      <div className="home-glow home-glow-1" />
      <div className="home-glow home-glow-2" />

      {/* Barra superior */}
      <header className="home-bar">
        <div className="home-bar-brand">
          <img src={logo} alt="Appetic" />
          <span>Appetic</span>
        </div>
        <Link to="/cuenta" className="home-cuenta">
          {user?.photoURL && !avatarFallo
            ? <img className="home-cuenta-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFallo(true)} />
            : <span className="home-cuenta-icon">👤</span>}
          <span>{user ? 'Mi cuenta' : 'Entrar'}</span>
        </Link>
      </header>

      <main className="home-content">
        {estado === 'cargando' && (
          <div className="home-skeletons">{[0, 1, 2].map(i => <div key={i} className="home-skel" />)}</div>
        )}
        {estado === 'error' && (
          <div className="home-empty"><span className="home-empty-emoji">📡</span><p>No pudimos cargar los locales. Revisa tu conexión.</p></div>
        )}

        {estado === 'ok' && (
          <>
            {/* ① Fila de locales — squircles con scroll infinito */}
            {sinFiltros && enriquecidos.length > 1 && (
              <section className="home-sec home-sec--fila">
                <div
                  className="home-fila"
                  ref={filaRef}
                  onPointerDown={filaPausar}
                  onPointerUp={filaReanudar}
                  onPointerCancel={filaReanudar}
                  onTouchStart={filaPausar}
                  onTouchEnd={filaReanudar}
                  onWheel={() => { filaPausar(); filaReanudar() }}
                >
                  {filaLocales.items.map((l, i) => (
                    <button key={`${l.id}-${i}`} className="fila-local" onClick={() => abrirLocal(l)}>
                      <span className={`fila-avatar ${!l.abierto ? 'off' : ''}`}>
                        {(l.icono || l.logo)
                          ? <img src={l.icono || l.logo} alt={l.nombre} loading="lazy" />
                          : <span className="fila-emoji">🍽️</span>}
                      </span>
                      <span className="fila-nombre">{l.nombre}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ② Para antojarte — platos fuertes con foto, rotación diaria */}
            {!buscando && antojos.length > 0 && (
              <section className="home-sec">
                <h2 className="home-sec-title">Para antojarte 😋</h2>
                <div className="home-antojos">
                  {antojos.map(p => (
                    <button
                      key={`${p.local.id}-${p.id}`}
                      className="antojo-card"
                      onClick={() => abrirLocal(p.local, `?producto=${encodeURIComponent(p.id)}`)}
                    >
                      <div className="antojo-media">
                        <img src={p.foto} alt={p.nombre} loading="lazy" />
                        {(p.local.icono || p.local.logo) && (
                          <img className="antojo-logo" src={p.local.icono || p.local.logo} alt={p.local.nombre} loading="lazy" />
                        )}
                        {!p.local.abierto && <span className="antojo-cerrado">Cerrado</span>}
                        {/* ➕ estilo DiDi: toda la card navega al producto con el modal listo
                            para Agregar (con opciones obligatorias no se puede agregar a ciegas). */}
                        <span className="antojo-add" aria-hidden="true">+</span>
                      </div>
                      <div className="antojo-info">
                        <strong className="antojo-nombre">{p.nombre}</strong>
                        <span className="antojo-precio">{p.desde ? 'desde ' : ''}{cop(p.precio)}</span>
                        <span className="antojo-local">{p.local.nombre}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 🔎 Buscador — entre "Para antojarte" y las categorías */}
            <div className="home-search">
              <span className="home-search-icon">🔎</span>
              <input
                placeholder="Busca un antojo o un local…"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              {buscando && <button className="home-search-x" onClick={() => setBusqueda('')} aria-label="Limpiar">✕</button>}
            </div>

            {/* ③ Categorías (solo las que tienen locales activos) — justo encima del listado que filtran */}
            {categoriasVisibles.length > 0 && (
              <div className="home-cats" role="tablist" aria-label="Categorías">
                {categoriasVisibles.map(c => (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={catActiva === c.id}
                    className={`home-cat ${catActiva === c.id ? 'on' : ''}`}
                    onClick={() => setCatActiva(catActiva === c.id ? null : c.id)}
                  >
                    <span className="home-cat-emoji">{c.emoji}</span>
                    <span className="home-cat-nombre">{c.nombre}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 📍 Ubicación / domicilio — debajo de las categorías */}
            <button
              className={`home-ubic ${ubic === 'ok' ? 'on' : ''} ${ubic === 'error' ? 'err' : ''}`}
              onClick={usarMiUbicacion}
              disabled={ubic === 'cargando'}
            >
              <IconPin />
              <span>{ubic === 'cargando' ? 'Buscando…'
                : ubic === 'ok' ? 'Ordenado por cercanía'
                : ubic === 'error' ? 'No pudimos ubicarte · reintentar'
                : 'Toca aquí y mira cuánto vale el domicilio'}</span>
            </button>
            {ubic === 'ok' && ubicImprecisa && (
              <p className="home-ubic-nota">📍 Ubicación aproximada. Para el domicilio exacto, ábrelo desde el celular.</p>
            )}

            {/* ④ Listado inteligente */}
            {filtrados.length === 0 ? (
              <div className="home-empty">
                <span className="home-empty-emoji">🍔</span>
                <p>{buscando || catActiva
                  ? 'Ningún local coincide con tu búsqueda.'
                  : 'Pronto vas a descubrir aquí todos los locales del barrio.'}</p>
                {(buscando || catActiva) && (
                  <button className="btn btn-ghost" onClick={() => { setBusqueda(''); setCatActiva(null) }}>Quitar filtros</button>
                )}
              </div>
            ) : (
              <section className="home-sec">
                <h2 className="home-sec-title">
                  {catActiva
                    ? `${CATEGORIAS_LOCALES.find(c => c.id === catActiva)?.emoji} ${CATEGORIAS_LOCALES.find(c => c.id === catActiva)?.nombre}`
                    : buscando ? 'Resultados' : 'Todos los locales'}
                </h2>
                <ul className="home-locales">
                  {filtrados.map(l => <CardLocal key={l.id} local={l} ubicImprecisa={ubicImprecisa} onAbrir={() => abrirLocal(l)} />)}
                </ul>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="home-footer">
        Hecho con 🧡 en Bogotá · <span>Appetic</span>
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 🍽️ Card del listado: la COMIDA primero (banner o su mejor plato con foto) y el
// logo pequeño en la esquina. Si el local no tiene ninguna foto rica, cae con
// gracia a la card compacta (logo + info). Cerrados: atenuados.
function CardLocal({ local: l, ubicImprecisa, onAbrir }) {
  // Foto grande: banner del local, o el plato fuerte del día (rota con la semilla).
  const fotoComida = useMemo(() => {
    if (l.banner) return l.banner
    const conFoto = (l.destacadosHome || []).filter(p => p.foto)
    if (!conFoto.length) return null
    return barajarConSemilla(conFoto, semillaDelDia(`card-${l.id}`))[0].foto
  }, [l])

  const chips = (
    <div className="loc-chips">
      <span className={`loc-chip ${l.abierto ? 'on' : 'off'}`}>{l.abierto ? 'Abierto ahora' : 'Cerrado'}</span>
      {l.distancia != null && (
        <span className="loc-chip dist">{ubicImprecisa ? '~' : 'a '}{l.distancia.toFixed(1)} km</span>
      )}
      {l.domi?.ok && <span className="loc-chip envio">🛵 Domicilio {ubicImprecisa ? '~' : ''}{cop(l.domi.costo)}</span>}
      {!ubicImprecisa && l.domi && !l.domi.ok && l.domi.motivo === 'fuera-cobertura' && (
        <span className="loc-chip envio-off">🛵 Fuera de cobertura</span>
      )}
      {!ubicImprecisa && l.domi && !l.domi.ok && l.domi.motivo === 'sin-tarifa' && (
        <span className="loc-chip envio">🛵 Domicilio a convenir</span>
      )}
    </div>
  )

  // Sin marca de "Recomendado": la prioridad comercial solo ordena (sutil, no se nota).
  const badges = l.nuevo && (
    <div className="loc-badges">
      <span className="loc-badge loc-badge-nuevo">🆕 Nuevo</span>
    </div>
  )

  if (!fotoComida) {
    // Fallback compacto (sin foto de comida todavía)
    return (
      <li>
        <button className={`loc-card ${!l.abierto ? 'loc-card--cerrado' : ''}`} onClick={onAbrir}>
          <div className="loc-card-img">
            {(l.icono || l.logo) ? <img src={l.icono || l.logo} alt={l.nombre} loading="lazy" /> : <span>🍽️</span>}
          </div>
          <div className="loc-card-info">
            {badges}
            <h3>{l.nombre}</h3>
            {l.descripcion && <p>{l.descripcion}</p>}
            {chips}
          </div>
        </button>
      </li>
    )
  }

  return (
    <li>
      <button className={`loc-cardf ${!l.abierto ? 'loc-card--cerrado' : ''}`} onClick={onAbrir}>
        <div className="loc-cardf-media">
          <img className="loc-cardf-foto" src={fotoComida} alt="" loading="lazy" />
          {(l.icono || l.logo) && <img className="loc-cardf-logo" src={l.icono || l.logo} alt={l.nombre} loading="lazy" />}
          {badges}
        </div>
        <div className="loc-cardf-info">
          <h3>{l.nombre}</h3>
          {l.descripcion && <p>{l.descripcion}</p>}
          {chips}
        </div>
      </button>
    </li>
  )
}

// 📍 Pin de ubicación (trazo, hereda el color del botón).
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  )
}
