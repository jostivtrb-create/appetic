import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { EVENTO_DEMO } from './eventosDemo'
import { quieroEsto, conPreview } from './demoUtils'
import { DEMO_SLUG } from '../../config/demo'
import './Recorrido.css'

// 🎮 RECORRIDO GUIADO de la demo (guía «Demo de clientes» D17): como el tutorial de un buen juego.
// Oscurece la pantalla y deja brillando lo que hay que tocar; el paso avanza SOLO cuando el
// visitante lo hace (la app avisa con avisarDemo). Celebra cada logro, se puede saltar o salir, y
// el progreso queda en SU navegador (aunque la demo sea compartida).
//
// Cada paso: { titulo, texto, objetivo?: selector | () => Element, espera?: evento, boton?, ir? }
//   espera → avanza cuando la app avisa ese evento · boton → avanza al tocarlo (y navega a `ir`)

const D = `/${DEMO_SLUG}`
const ultimo = sel => () => { const l = document.querySelectorAll(sel); return l[l.length - 1] || null }

const PASOS = [
  { emoji: '👋', titulo: '¡Hola! Te muestro Appetic en 3 minutos',
    texto: 'Vas a vivir un pedido de punta a punta: lo pides como cliente, lo ves llegar a la cocina y después manejas el local como dueño.',
    boton: 'Empezar', ir: `${D}?mesa=4` },
  { emoji: '🍔', titulo: 'Eres un cliente en la mesa 4',
    texto: 'Escaneaste el QR de tu mesa. Toca una hamburguesa, elige cómo la quieres y agrégala.',
    objetivo: '.pcard', espera: 'carrito', ruta: D },
  { emoji: '🧾', titulo: 'Ahora pídela',
    texto: 'Toca «Pedido», escribe tu nombre y envíala a la cocina. Sin esperar al mesero.',
    objetivo: '.bnav-cart', espera: 'pedido-mesa', ruta: D },
  { emoji: '🍳', titulo: '¡Tu pedido ya está en la cocina!',
    texto: 'Mira lo que ve el cocinero en su tablet, en este mismo momento.',
    boton: 'Ir a la cocina →', ir: `${D}/admin/comandas` },
  { emoji: '✅', titulo: 'Eres el cocinero',
    texto: 'Tu comanda llegó de última, en orden. Tócala, tacha lo que va saliendo y dale «Confirmar entregado». Al mesero le llega el aviso.',
    objetivo: ultimo('.km-com'), espera: 'comanda-entregada', ruta: `${D}/admin/comandas` },
  { emoji: '🧑‍🍳', titulo: '¡Salió! Ahora sé el mesero',
    texto: 'El mesero toma el pedido en su celular, sin libreta y sin caminar a la cocina.',
    boton: 'Ser el mesero →', ir: `${D}/admin/mesero` },
  { emoji: '📱', titulo: 'Toma una comanda',
    texto: 'Toca un par de platos, marca la mesa en el teclado y envíala. Llega a la cocina al instante.',
    objetivo: '.ms-pos-menu, .ms-lista', espera: 'comanda-mesero', ruta: `${D}/admin/mesero` },
  { emoji: '🛵', titulo: 'Llegó un domicilio por la app',
    texto: 'Arriba está «por confirmar». Tócalo y confírmalo: pasa a la cocina y, cuando sale, al panel de tu domiciliario.',
    objetivo: '.pc', espera: 'pedido-confirmado', ruta: `${D}/admin/mesero`,
    siNoHay: 'Otra persona que probó la demo ya lo confirmó. Lo verás en el panel de Domicilios.' },
  { emoji: '💲', titulo: 'Ahora eres el dueño',
    texto: 'Cambia un precio o marca un plato agotado: toca «Editar» en cualquiera y guarda. Se ve en el menú al instante.',
    boton: 'Ver mi carta →', ir: `${D}/admin/config/catalogo` },
  { emoji: '✏️', titulo: 'Cambia lo que quieras',
    texto: 'Toca «Editar» en un plato, cámbiale el precio y guarda.',
    objetivo: '.ap-grupo-cat', espera: 'producto', ruta: `${D}/admin/config/catalogo` },
  { emoji: '🏆', titulo: '¡Lo hiciste todo!', final: true,
    texto: 'Pediste desde la mesa, cocinaste, atendiste como mesero, confirmaste un domicilio y cambiaste tu carta. Así funcionaría tu restaurante, con tu menú, tu logo y tus colores.' },
]

const CLAVE = 'appetic_demo_recorrido'
const leer = () => { try { const v = JSON.parse(localStorage.getItem(CLAVE)); return Number.isInteger(v?.paso) ? v.paso : null } catch { return null } }
const guardar = paso => { try { paso == null ? localStorage.removeItem(CLAVE) : localStorage.setItem(CLAVE, JSON.stringify({ paso })) } catch { /* nada */ } }
const AVISO = 'appetic-recorrido'

// Lo llama la bienvenida: arranca desde el primer paso.
export function iniciarRecorrido() {
  guardar(0)
  window.dispatchEvent(new Event(AVISO))
}

export default function Recorrido() {
  const [paso, setPaso] = useState(leer)
  const [logro, setLogro] = useState(false)   // celebración breve entre pasos
  const [rect, setRect] = useState(null)
  const [noAparece, setNoAparece] = useState(false) // el objetivo no está (p. ej. ya lo confirmó otro)
  const location = useLocation()
  const navigate = useNavigate()
  const enDemo = location.pathname === D || location.pathname.startsWith(`${D}/`) || location.pathname.startsWith(`/p/${DEMO_SLUG}/`)
  const p = paso != null ? PASOS[paso] : null

  useEffect(() => {
    const re = () => setPaso(leer())
    window.addEventListener(AVISO, re)
    return () => window.removeEventListener(AVISO, re)
  }, [])

  const ir = n => { guardar(n); setPaso(n) }
  const salir = () => { guardar(null); setPaso(null) }

  // Avanza cuando la app avisa que el visitante hizo lo que pedía el paso.
  const pasoRef = useRef(paso)
  pasoRef.current = paso
  useEffect(() => {
    if (!p?.espera) return
    const alAviso = e => {
      if (e.detail !== p.espera || pasoRef.current !== paso) return
      setLogro(true)
      setTimeout(() => { setLogro(false); ir(paso + 1) }, 1300)
    }
    window.addEventListener(EVENTO_DEMO, alAviso)
    return () => window.removeEventListener(EVENTO_DEMO, alAviso)
  }, [paso, p?.espera]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sigue al objetivo (aparece, se mueve, hace scroll): lo busca cada poco y mide su caja.
  useLayoutEffect(() => {
    if (!p?.objetivo || !enDemo) { setRect(null); return }
    const buscar = () => {
      const el = typeof p.objetivo === 'function' ? p.objetivo() : document.querySelector(p.objetivo)
      const r = el?.getBoundingClientRect()
      setRect(r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight
        ? { top: r.top, left: r.left, width: r.width, height: Math.min(r.height, window.innerHeight * 0.6) } : null)
    }
    buscar()
    setNoAparece(false)
    const tarde = setTimeout(() => {
      const el = typeof p.objetivo === 'function' ? p.objetivo() : document.querySelector(p.objetivo)
      if (!el) setNoAparece(true)
    }, 3000)
    const t = setInterval(buscar, 350)
    window.addEventListener('scroll', buscar, true)
    return () => { clearInterval(t); clearTimeout(tarde); window.removeEventListener('scroll', buscar, true) }
  }, [paso, enDemo, location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p || !enDemo) return null

  const alBoton = () => {
    if (p.ir) navigate(conPreview(p.ir))
    ir(paso + 1)
  }
  // ¿Está en la pantalla de este paso? Si se fue a otra, se le ofrece volver.
  const fuera = p.ruta && location.pathname !== p.ruta
  // La tarjeta va arriba si lo que brilla está en la mitad de abajo.
  const arriba = rect && rect.top + rect.height / 2 > window.innerHeight * 0.55
  const total = PASOS.length - 1
  const pad = 8

  return createPortal(
    <div className="rc" aria-live="polite">
      {rect && !logro && (
        <div className="rc-foco" style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}>
          <span className="rc-anillo" />
        </div>
      )}
      {!rect && p.final && <div className="rc-velo" />}

      {logro && <Celebracion />}

      <div className={`rc-tarjeta ${arriba ? 'arriba' : ''} ${p.final ? 'final' : ''} ${logro ? 'logro' : ''}`} key={paso} role="dialog" aria-label="Recorrido guiado">
        <button className="rc-x" onClick={salir} aria-label="Salir del recorrido">✕</button>
        {logro ? (
          <div className="rc-logro"><span>✓</span><b>¡Bien hecho!</b></div>
        ) : (
          <>
            <div className="rc-cab">
              <span className="rc-emoji" aria-hidden="true">{p.emoji}</span>
              <div>
                {!p.final && paso > 0 && <small className="rc-paso">Paso {paso} de {total - 1}</small>}
                <h3>{p.titulo}</h3>
              </div>
            </div>
            <p>{noAparece && p.siNoHay ? p.siNoHay : p.texto}</p>
            {!p.final && (
              <div className="rc-barra" aria-hidden="true"><span style={{ width: `${(paso / total) * 100}%` }} /></div>
            )}
            <div className="rc-acc">
              {p.final ? (
                <>
                  <button className="rc-btn rc-btn-fuerte" onClick={() => quieroEsto({ id: DEMO_SLUG })}>💬 Quiero esto para mi negocio</button>
                  <button className="rc-btn" onClick={salir}>Seguir explorando</button>
                </>
              ) : fuera ? (
                <button className="rc-btn rc-btn-fuerte" onClick={() => navigate(conPreview(p.ruta))}>Volver a donde íbamos</button>
              ) : noAparece && p.siNoHay ? (
                <button className="rc-btn rc-btn-fuerte" onClick={() => ir(paso + 1)}>Siguiente →</button>
              ) : p.boton ? (
                <button className="rc-btn rc-btn-fuerte" onClick={alBoton}>{p.boton}</button>
              ) : (
                <span className="rc-esperando"><i />Te espero…</span>
              )}
              {!p.final && p.espera && <button className="rc-saltar" onClick={() => ir(paso + 1)}>Saltar</button>}
            </div>
          </>
        )}
      </div>
      {p.final && <Celebracion grande />}
    </div>,
    document.body,
  )
}

// 🎉 Confeti de colores de la marca (CSS puro, sin librerías).
function Celebracion({ grande = false }) {
  const n = grande ? 60 : 28
  return (
    <div className={`rc-confeti ${grande ? 'grande' : ''}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{
          left: `${(i * 37) % 100}%`,
          animationDelay: `${(i % 10) * 0.06}s`,
          background: ['#D9381E', '#F2A900', '#2E9E5B', '#3A7BD5', '#FF7AB6'][i % 5],
          transform: `rotate(${i * 47}deg)`,
        }} />
      ))}
    </div>
  )
}
