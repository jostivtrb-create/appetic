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
const visible = el => !!el && el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0
// El primero VISIBLE que cumpla (en PC y en celular el mismo botón vive en sitios distintos).
const buscarEl = obj => typeof obj === 'function' ? obj() : [...document.querySelectorAll(obj)].find(visible) || null
const ultimo = sel => () => [...document.querySelectorAll(sel)].filter(visible).pop() || null
const conTexto = (sel, re) => () => [...document.querySelectorAll(sel)].filter(visible).find(e => re.test(e.textContent)) || null

const PASOS = [
  { emoji: '👋', titulo: '¡Hola! Te muestro Appetic en 5 minutos',
    texto: 'Vas a vivir tu restaurante por dentro: un pedido desde la mesa, la cocina, el mesero, un domicilio de punta a punta y tu panel de dueño.',
    boton: 'Empezar', ir: `${D}?mesa=4` },

  // 🪑 El salón
  { emoji: '🍔', titulo: 'Eres un cliente en la mesa 4',
    texto: 'Escaneaste el QR de tu mesa. Toca una hamburguesa, elige cómo la quieres y agrégala.',
    objetivo: '.pcard', espera: 'carrito', ruta: D },
  { emoji: '🧾', titulo: 'Ahora pídela',
    texto: 'Toca «Pedido» (o «Continuar el pedido»), escribe tu nombre y envíala a la cocina. Sin esperar al mesero.',
    objetivo: '.cd-checkout, .bnav-cart', espera: 'pedido-mesa', ruta: D },
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

  // 🛵 Domicilios, de punta a punta
  { emoji: '🛵', titulo: 'Así te piden a domicilio',
    texto: 'Tu cliente abre tu link desde Instagram, WhatsApp o tu afiche, arma su pedido y pone su dirección: el envío se calcula solo, por distancia. El pedido te llega al WhatsApp del local y aquí, «por confirmar». Sin comisiones.',
    boton: 'Ver el pedido que llegó →', ir: `${D}/admin/mesero` },
  { emoji: '📥', titulo: 'Confirma el domicilio',
    texto: 'Arriba está el pedido de Juan, «por confirmar». Tócalo y confírmalo: pasa a la cocina y Juan lo ve en «Mi pedido».',
    objetivo: '.pc', espera: 'pedido-confirmado', ruta: `${D}/admin/mesero`,
    siNoHay: 'Otra persona que probó la demo ya lo confirmó. Igual puedes seguir: así funciona.' },
  { emoji: '🔥', titulo: 'El domicilio ya está en la cocina',
    texto: 'Sale en morado para que la cocina sepa que va para la calle.',
    boton: 'Ir a la cocina →', ir: `${D}/admin/comandas` },
  { emoji: '✅', titulo: 'Despáchalo',
    texto: 'Abre la comanda de DOMICILIO, tacha y dale «Confirmar entregado». Al domiciliario le llega el aviso: ya puede salir.',
    objetivo: conTexto('.km-com', /domicilio/i), espera: 'comanda-entregada', ruta: `${D}/admin/comandas`,
    siNoHay: 'No hay domicilios en la cocina ahora. Sigamos al panel del domiciliario.' },
  { emoji: '🏍️', titulo: 'Ahora eres el domiciliario',
    texto: 'Tiene su propio panel: dirección, mapa, a quién llamar, cuánto cobrar y las vueltas.',
    boton: 'Ver Domicilios →', ir: `${D}/admin/domicilios` },
  { emoji: '🛵', titulo: 'Sal a entregarlo',
    texto: 'Toca «Voy en camino»: el cliente recibe el aviso y lo ve en «Mi pedido».',
    objetivo: '.dm-salir', espera: 'en-camino', ruta: `${D}/admin/domicilios`,
    siNoHay: 'Ahora no hay domicilios listos para salir. Así se ve el panel del domiciliario.' },
  { emoji: '🏁', titulo: 'Entrégalo',
    texto: 'Cuando lo entregues, toca «Entregado». Queda en el historial del día.',
    objetivo: '.dm-entregado', espera: 'domicilio-entregado', ruta: `${D}/admin/domicilios`,
    siNoHay: 'No hay domicilios en camino ahora. Sigamos con tu panel de dueño.' },

  // 🧾 El admin lo sigue todo desde «Comandas» y lo cierra cuando pagan
  { emoji: '🧾', titulo: 'Tú lo sigues todo desde Comandas',
    texto: 'Cada pedido, de la mesa, para llevar o a domicilio, aparece aquí con el paso en el que va. Cuando termina su recorrido, lo cierras al cobrarlo.',
    boton: 'Ver Comandas →', ir: `${D}/admin/caja` },
  { emoji: '💵', titulo: 'Cóbralo',
    texto: 'En «Listas para cobrar», toca «Ya se cobró». Pasa al historial; si fue sin querer, lo deshaces.',
    objetivo: '.cj-cobrar', espera: 'cobrada', ruta: `${D}/admin/caja`,
    siNoHay: 'Ahora no hay nada listo para cobrar. Así se ve: lo que está en proceso, con el paso en el que va.' },

  // 👔 El dueño
  { emoji: '💲', titulo: 'Ahora eres el dueño',
    texto: 'Tu carta la manejas tú: precios, fotos, platos nuevos y agotados, desde el celular.',
    boton: 'Ver mi carta →', ir: `${D}/admin/config/catalogo` },
  { emoji: '✏️', titulo: 'Cambia lo que quieras',
    texto: 'Toca «Editar» en un plato, cámbiale el precio y guarda. Se ve en el menú al instante.',
    objetivo: '.ap-grupo-cat', espera: 'producto', ruta: `${D}/admin/config/catalogo` },
  { emoji: '📣', titulo: '¿Y cómo te encuentran?',
    texto: 'Con tu link y tus QR. Te los damos listos.',
    boton: 'Ver Difundir →', ir: `${D}/admin/difundir` },
  { emoji: '🔗', titulo: 'Tu link, tus QR y tu afiche',
    texto: 'Aquí está el link para tu Instagram y WhatsApp, el QR del local, un QR para cada mesa y un afiche de domicilios listo para imprimir.',
    boton: 'Terminar', ruta: `${D}/admin/difundir` },
  { emoji: '🏆', titulo: '¡Lo hiciste todo!', final: true,
    texto: 'Pediste desde la mesa, cocinaste, atendiste como mesero, despachaste un domicilio de punta a punta, lo cobraste y cambiaste tu carta. Así funcionaría tu restaurante, con tu menú, tu logo y tus colores.' },
]

// Ventanas de la app (plato, carrito, pedido, confirmaciones…). Cuando una está abierta, el
// visitante está HACIENDO el paso: se apaga el foco (no debe oscurecer la ventana) y la tarjeta
// se encoge arriba para no tapar sus botones.
const CAPAS = '.pm-overlay, .pw-overlay, .cd-overlay, .co-screen, .km-velo, .eq-velo, .ms-velo, .ac-modal-overlay, .cc-cuidado-velo'
const hayCapa = () => [...document.querySelectorAll(CAPAS)].some(el => !el.closest('.rc') && el.getClientRects().length > 0)

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
  const [capa, setCapa] = useState(false)           // hay una ventana de la app abierta encima
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
    if (!p || !enDemo) { setRect(null); setCapa(false); return }
    const buscar = () => {
      const abierta = hayCapa()
      setCapa(abierta)
      if (!p.objetivo || abierta) { setRect(null); return }
      const el = buscarEl(p.objetivo)
      const r = el?.getBoundingClientRect()
      setRect(r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight
        ? { top: r.top, left: r.left, width: r.width, height: Math.min(r.height, window.innerHeight * 0.6) } : null)
    }
    buscar()
    setNoAparece(false)
    const tarde = setTimeout(() => {
      if (!p.objetivo || hayCapa()) return
      if (!buscarEl(p.objetivo)) setNoAparece(true)
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
  // La tarjeta va ARRIBA por defecto: los botones de la app («Agregar», «Continuar», «Enviar»)
  // viven abajo. Solo baja si lo que brilla está arriba.
  const arriba = !rect || rect.top + rect.height / 2 > window.innerHeight * 0.45
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

      <div className={`rc-tarjeta ${arriba ? 'arriba' : ''} ${capa && !p.final && !logro ? 'compacta' : ''} ${p.final ? 'final' : ''} ${logro ? 'logro' : ''}`} key={paso} role="dialog" aria-label="Recorrido guiado">
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
