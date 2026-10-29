import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../contexts/AdminContext'
import { useAuth } from '../../contexts/AuthContext'
import { comandasDe, etiquetaDestino, ms } from '../../services/comandas'
import { isDevSlug } from '../../dev'
import './AvisoListo.css'

// 🔔 «¡Pedido listo!» en CUALQUIER pantalla de la app (guía «Mesero y Comandas», D5 / paso 1f).
// Cuando la cocina entrega una comanda, le avisa con un aviso arriba + sonido:
//   • al MESERO que la mandó,
//   • a los ADMIN del local (todas las del local).
// En la pantalla Mesero no sale: ahí ya parpadea su propio aviso. Lo «visto» se comparte con esa
// pantalla (misma clave), así que tocar uno apaga el otro.
export default function AvisoListo() {
  const { user } = useAuth()
  const { locales, equipo, slug: adminSlug } = useAdmin()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const yo = (user?.email || '').toLowerCase()

  // Qué local vigilar: el que administra (seleccionado) o donde es mesero.
  const vigilado = useMemo(() => {
    const propio = locales.find(l => l.slug === adminSlug) || (locales.length === 1 ? locales[0] : null)
    if (propio) return { local: propio, admin: true }
    const mesero = equipo.find(e => e.rol === 'mesero')
    return mesero ? { local: mesero.local, admin: false } : null
  }, [locales, adminSlug, equipo])

  const localId = vigilado?.local?.id
  const demo = Boolean(vigilado && import.meta.env.DEV && isDevSlug(vigilado.local.slug))
  const KEY = localId ? `appetic_mesero_vistos_${localId}` : null
  const [recientes, setRecientes] = useState([])
  const [vistos, setVistos] = useState([])
  const desde = useRef(Date.now() - 10 * 60000)

  useEffect(() => {
    if (!localId) { setRecientes([]); return }
    try { setVistos(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { setVistos([]) }
    return comandasDe(localId, { demo }).escucharRecientes(setRecientes, () => {})
  }, [localId, demo, KEY])

  // Si la pantalla Mesero marca vistos, este aviso también se entera.
  useEffect(() => {
    if (!KEY) return
    const f = e => { if (e.key === KEY) { try { setVistos(JSON.parse(e.newValue || '[]')) } catch { /* nada */ } } }
    window.addEventListener('storage', f)
    return () => window.removeEventListener('storage', f)
  }, [KEY])

  const pendientes = recientes.filter(c =>
    c.estado === 'entregada' && !vistos.includes(c.id)
    && (vigilado?.admin || c.creadaPor?.email === yo)
    && (ms(c.entregadaEn) || Date.now()) >= desde.current)

  // Sonido al aparecer uno nuevo.
  const sonados = useRef(new Set())
  useEffect(() => {
    const nuevos = pendientes.filter(c => !sonados.current.has(c.id))
    if (!nuevos.length) return
    nuevos.forEach(c => sonados.current.add(c.id))
    campanita()
  }, [pendientes])

  const enMesero = /\/admin\/mesero$/.test(pathname)
  if (!pendientes.length || enMesero) return null

  function cerrar(ir) {
    const n = [...new Set([...vistos, ...pendientes.map(c => c.id)])].slice(-200)
    setVistos(n)
    try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* nada */ }
    if (ir) navigate(`/${vigilado.local.slug}/admin/mesero`)
  }

  return (
    <div className="al" role="status">
      <button className="al-cuerpo" onClick={() => cerrar(true)}>
        <span className="al-campana" aria-hidden="true">🔔</span>
        <span className="al-txt">
          <strong>{pendientes.length === 1 ? '¡Pedido listo!' : `¡${pendientes.length} pedidos listos!`}</strong>
          <span>{pendientes.map(c => etiquetaDestino(c.destino)).join(' · ')}</span>
        </span>
      </button>
      <button className="al-x" onClick={() => cerrar(false)} aria-label="Entendido">✕</button>
    </div>
  )
}

// Dos notas cortas. Si el navegador no deja sonar (nadie ha tocado la pantalla), se calla.
function campanita() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const t0 = ctx.currentTime
    ;[[988, 0], [1319, 0.16]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + d)
      g.gain.exponentialRampToValueAtTime(0.25, t0 + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.4)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + d); o.stop(t0 + d + 0.45)
    })
    setTimeout(() => ctx.close().catch(() => {}), 900)
  } catch { /* sin audio */ }
}
