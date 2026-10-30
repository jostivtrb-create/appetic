import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { EVENTO_DEMO } from './eventosDemo'
import { quieroEsto, conPreview } from './demoUtils'
import { DEMO_SLUG } from '../../config/demo'
import { olvidarMesa } from '../../utils/mesaQR'
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
// La caja de lo que SE VE del objetivo: también lo que sobresale de él (el círculo del botón
// «Pedido» sale por encima de la barra; con solo su caja, el foco lo cortaba).
function cajaVisible(el) {
  if (!el) return null
  let { top, left, right, bottom } = el.getBoundingClientRect()
  for (const h of el.querySelectorAll('*')) {
    const r = h.getBoundingClientRect()
    if (!r.width || !r.height) continue
    top = Math.min(top, r.top); left = Math.min(left, r.left); right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom)
  }
  return { top, left, width: right - left, height: bottom - top, bottom }
}
const ultimo = sel => () => [...document.querySelectorAll(sel)].filter(visible).pop() || null
const conTexto = (sel, re) => () => [...document.querySelectorAll(sel)].filter(visible).find(e => re.test(e.textContent)) || null

// Un recorrido por cada PROCESO (pedido del usuario, 30-oct): el visitante elige cuál vivir en la
// bienvenida. Se repiten cosas a propósito: que entienda el proceso REAL de cada persona.
export const RECORRIDOS = {
  cliente: {
    nombre: 'Proceso del Cliente', emoji: '🙋', resumen: 'Pide a domicilio desde su casa y sigue su pedido',
    pasos: [
      { emoji: '🏠', titulo: 'Eres un cliente en tu casa',
        texto: 'Viste a Burger Demo en Instagram o te mandaron el link por WhatsApp. Lo abres: es su menú, con fotos y precios. No descargas nada.',
        boton: 'Abrir el menú', ir: D, sinMesa: true },
      { emoji: '🍔', titulo: 'Elige lo que quieres',
        texto: 'Toca un plato, elige cómo lo quieres (sin cebolla, con papas…) y agrégalo.',
        objetivo: '.pcard', espera: 'carrito', ruta: D },
      { emoji: '🧾', titulo: 'Abre tu pedido',
        texto: 'Toca «Pedido» y luego «Continuar el pedido».',
        objetivo: '.cd-checkout, .bnav-cart, .prail-fab--pedido', espera: 'checkout-abierto', ruta: D },
      { emoji: '🛵', titulo: 'Pídelo a domicilio',
        texto: 'Elige «Domicilio», escribe tu dirección, tu nombre y tu WhatsApp, y cómo pagas: el envío se calcula solo, por distancia. Toca «Enviar» y verás cómo le llega al WhatsApp del restaurante.',
        espera: 'pedido-app', ruta: D, libre: true },
      { emoji: '📍', titulo: 'Sigue tu pedido',
        texto: 'El cliente no tiene que preguntar «¿ya viene?»: en «Mi pedido» ve si está por confirmar, en cocina, en camino o entregado. Toca «Ver en qué va mi pedido».',
        objetivo: '.co-exito-seguir', espera: 'mi-pedido',
        siNoHay: 'El link «Mi pedido» también le llega en el WhatsApp del pedido. Ahí ve en qué va.' },
      { emoji: '🏆', titulo: '¡Así pide tu cliente!', final: true,
        texto: 'Tu pedido le llegó al local como «por confirmar». Mira ahora qué pasa adentro: el mesero lo confirma, la cocina lo prepara y el domiciliario lo lleva.' },
    ],
  },
  mesero: {
    nombre: 'Proceso del Mesero', emoji: '🧑‍🍳', resumen: 'Toma comandas en la mesa y confirma los pedidos de la app',
    pasos: [
      { emoji: '🧑‍🍳', titulo: 'Eres el mesero',
        texto: 'Tienes la app en tu celular. Te llegan dos clases de pedido: los que tomas en la mesa y los que entran por la app.',
        boton: 'Abrir mi pantalla →', ir: `${D}/admin/mesero` },
      { emoji: '📱', titulo: 'Toma el pedido de la mesa',
        texto: 'El cliente te dice qué quiere: toca un plato. Si tiene opciones (sin cebolla, con papas…), elígelas y agrégalo.',
        objetivo: '.ms-pos-menu, .ms-lista', espera: 'mesero-plato', ruta: `${D}/admin/mesero` },
      { emoji: '➕', titulo: '¿Algo más?',
        texto: 'Agrega otro plato si quieres. Cuando esté todo, toca «Ver comanda», marca la mesa en el teclado y toca «Enviar a cocina». Llega al instante, sin libreta y sin caminar.',
        objetivo: '.ms-barra, .ms-pos-comanda', espera: 'comanda-mesero', ruta: `${D}/admin/mesero`,
        libre: true },
      { emoji: '📥', titulo: 'Confirma un pedido de la app',
        texto: 'Arriba salen los pedidos de la app «por confirmar». Toca uno y confírmalo: pasa a la cocina y el cliente lo ve en «Mi pedido».',
        objetivo: '.pc', espera: 'pedido-confirmado', ruta: `${D}/admin/mesero`,
        siNoHay: 'Otra persona que está probando la demo acaba de atenderlo. Igual puedes seguir: así funciona.' },
      { emoji: '🔔', titulo: 'La cocina te avisa',
        texto: 'Cuando la cocina termina un pedido de tus mesas, te llega el aviso (aunque tengas la app cerrada). En «En curso» ves lo que va saliendo y puedes corregir una comanda: si la cocina ya lo hizo, la app te advierte antes.',
        boton: 'Entendido' },
      { emoji: '🏆', titulo: '¡Así trabaja tu mesero!', final: true,
        texto: 'Toma el pedido en la mesa, lo manda a la cocina sin moverse y confirma los de la app. Sigue con el proceso de la cocina para ver cómo le llegan.' },
    ],
  },
  cocina: {
    nombre: 'Proceso de la Cocina', emoji: '🍳', resumen: 'Las comandas llegan solas a la tablet, en orden',
    pasos: [
      { emoji: '🍳', titulo: 'Eres el cocinero',
        texto: 'En tu tablet las comandas entran solas, en orden de llegada y con colores: mesa, para llevar o domicilio. Nadie grita y nada se pierde.',
        boton: 'Abrir la cocina →', ir: `${D}/admin/comandas` },
      { emoji: '👆', titulo: 'Abre una comanda',
        texto: 'Tócala para ver qué lleva: cada plato, sus opciones y los comentarios del mesero.',
        objetivo: '.km-com', espera: 'comanda-abierta', ruta: `${D}/admin/comandas`,
        siNoHay: 'Otra persona que está probando la demo acaba de despacharla. Igual puedes seguir: así funciona.' },
      { emoji: '✔️', titulo: 'Tacha lo que va saliendo',
        texto: 'Toca la casilla de un plato cuando esté listo (o «Tachar todo»). «¿Qué lleva?» te muestra los ingredientes.',
        objetivo: '.km-com.abierta', espera: 'tachar', ruta: `${D}/admin/comandas` },
      { emoji: '✅', titulo: 'Despáchala',
        texto: 'Toca «Confirmar entregado». Al mesero o al domiciliario le llega el aviso de que ya salió.',
        objetivo: '.km-entregar', espera: 'comanda-entregada', ruta: `${D}/admin/comandas` },
      { emoji: '🏆', titulo: '¡Así trabaja tu cocina!', final: true,
        texto: 'Lee la comanda en vez de escucharla, sabe el orden exacto y avisa que salió sin buscar a nadie. Si era domicilio, ahora le toca al domiciliario.' },
    ],
  },
  domiciliario: {
    nombre: 'Proceso del Domiciliario', emoji: '🛵', resumen: 'Ve dirección, mapa y cobro; avisa que va en camino',
    pasos: [
      { emoji: '🛵', titulo: 'Eres el domiciliario',
        texto: 'Tu panel te muestra cada domicilio con dirección, mapa, a quién llamar, cuánto cobrar y las vueltas. Te suena cuando uno está listo.',
        boton: 'Abrir mi panel →', ir: `${D}/admin/domicilios` },
      { emoji: '🏍️', titulo: 'Sal a entregarlo',
        texto: 'Cuando la cocina lo despacha, sale en «Listos para salir». Toca «Voy en camino»: el cliente recibe el aviso y lo ve en «Mi pedido».',
        objetivo: '.dm-salir', espera: 'en-camino', ruta: `${D}/admin/domicilios`,
        siNoHay: 'Otra persona que está probando la demo acaba de sacarlo. Igual puedes seguir: así funciona.' },
      { emoji: '🏁', titulo: 'Entrégalo',
        texto: 'Cuando lo entregues, toca «Entregado».',
        objetivo: '.dm-entregado', espera: 'domicilio-entregado', ruta: `${D}/admin/domicilios`,
        siNoHay: 'No hay domicilios en camino ahora.' },
      { emoji: '🏆', titulo: '¡Así trabaja tu domiciliario!', final: true,
        texto: 'Sale sabiendo a dónde va, cuánto cobrar y cuántas vueltas llevar. Y el cliente sabe que ya va en camino. Cuando vuelve con la plata, el administrador lo cierra en Comandas.' },
    ],
  },
  admin: {
    nombre: 'Proceso del Administrador', emoji: '👔', resumen: 'Sigue todo desde Comandas y lo cierra al cobrar',
    pasos: [
      { emoji: '🧾', titulo: 'Eres el dueño',
        texto: 'Desde «Comandas» sigues cada pedido —de la mesa, para llevar o a domicilio— y ves en qué paso va.',
        boton: 'Abrir Comandas →', ir: `${D}/admin/caja` },
      { emoji: '💵', titulo: 'Ciérralo al cobrar',
        texto: 'Cuando una comanda termina su recorrido, sale en «Listas para cobrar». Toca «Ya se cobró» y pasa al historial (si fue sin querer, lo deshaces).',
        objetivo: '.cj-cobrar', espera: 'cobrada', ruta: `${D}/admin/caja`,
        siNoHay: 'Ahora no hay nada listo para cobrar. Así se ve: lo que está en proceso, con el paso en el que va.' },
      { emoji: '✏️', titulo: 'Tu carta la manejas tú',
        texto: 'En Configuración → Catálogo cambias precios, fotos, platos y agotados.',
        boton: 'Ver mi carta →', ir: `${D}/admin/config/catalogo` },
      { emoji: '💲', titulo: 'Edita un plato',
        texto: 'Abre una categoría y toca «Editar» en cualquier plato.',
        objetivo: '.ap-grupo-cat', espera: 'editar-producto', ruta: `${D}/admin/config/catalogo` },
      { emoji: '✏️', titulo: 'Cambia el precio y guarda',
        texto: 'Ponle otro precio (o márcalo agotado) y toca «Guardar». Se ve en el menú al instante.',
        espera: 'producto', ruta: `${D}/admin/config/catalogo`, libre: true },
      { emoji: '📣', titulo: 'Así te encuentran',
        texto: 'En «Difundir» tienes tu link, tu QR, un QR para cada mesa y un afiche de domicilios listo para imprimir.',
        boton: 'Ver Difundir →', ir: `${D}/admin/difundir` },
      { emoji: '🏆', titulo: '¡Así manejas tu restaurante!', final: true,
        texto: 'Todo el proceso en un solo lugar: el cliente pide, el mesero confirma, la cocina prepara, el domiciliario entrega y tú lo cierras al cobrar.' },
    ],
  },
}
export const ORDEN_RECORRIDOS = ['cliente', 'mesero', 'cocina', 'domiciliario', 'admin']

// Ventanas de la app (plato, carrito, pedido, confirmaciones…). Cuando una está abierta, el
// visitante está HACIENDO el paso: se apaga el foco (no debe oscurecer la ventana) y la tarjeta
// se encoge arriba para no tapar sus botones.
const CAPAS = '.pm-overlay, .pw-overlay, .cd-overlay, .co-screen, .km-velo, .eq-velo, .ms-velo, .ac-modal-overlay, .cc-cuidado-velo'
const hayCapa = () => [...document.querySelectorAll(CAPAS)].some(el => !el.closest('.rc') && el.getClientRects().length > 0)

// Estado { id, paso } en el navegador del visitante. Lo guardado antes (sin id) se ignora.
const CLAVE = 'appetic_demo_recorrido'
const leer = () => {
  try { const v = JSON.parse(localStorage.getItem(CLAVE)); return RECORRIDOS[v?.id] && Number.isInteger(v.paso) ? v : null } catch { return null }
}
const guardar = v => { try { v == null ? localStorage.removeItem(CLAVE) : localStorage.setItem(CLAVE, JSON.stringify(v)) } catch { /* nada */ } }
const AVISO = 'appetic-recorrido'
export const AVISO_BIENVENIDA = 'appetic-demo-bienvenida'

// «Volver al inicio del demo»: corta el recorrido en curso.
export function terminarRecorrido() {
  guardar(null)
  window.dispatchEvent(new Event(AVISO))
}

// Lo llama la bienvenida: arranca el recorrido de ese proceso desde el principio.
export function iniciarRecorrido(id) {
  guardar({ id, paso: 0 })
  window.dispatchEvent(new Event(AVISO))
  // Cada proceso se vale solo: crea lo que esa persona necesita ver (si no lo hay ya).
  import('./prepararProceso').then(m => m.prepararProceso(id)).catch(() => {})
}

export default function Recorrido() {
  const [estado, setEstado] = useState(leer)
  const rec = estado ? RECORRIDOS[estado.id] : null
  const PASOS = rec?.pasos || []
  const paso = estado ? estado.paso : null
  const [bienvenida, setBienvenida] = useState(false) // la bienvenida está abierta: el recorrido espera
  const [logro, setLogro] = useState(false)   // celebración breve entre pasos
  const [rect, setRect] = useState(null)
  const [noAparece, setNoAparece] = useState(false) // el objetivo no está (p. ej. ya lo confirmó otro)
  const [capa, setCapa] = useState(false)           // hay una ventana de la app abierta encima
  const [verMini, setVerMini] = useState(true)      // con ventana abierta: la burbuja desplegada
  useEffect(() => { setVerMini(true) }, [estado?.id, paso])
  const [sacude, setSacude] = useState(0)           // tocó fuera de lo resaltado: la tarjeta avisa
  const location = useLocation()
  const navigate = useNavigate()
  const enDemo = location.pathname === D || location.pathname.startsWith(`${D}/`) || location.pathname.startsWith(`/p/${DEMO_SLUG}/`)
  const p = paso != null ? PASOS[paso] : null

  useEffect(() => {
    const re = () => setEstado(leer())
    window.addEventListener(AVISO, re)
    return () => window.removeEventListener(AVISO, re)
  }, [])

  const ir = n => { const v = { id: estado.id, paso: n }; guardar(v); setEstado(v) }
  const salir = () => { guardar(null); setEstado(null) }
  // Al terminar: el proceso siguiente, o volver a la bienvenida a elegir otro.
  const siguiente = rec ? ORDEN_RECORRIDOS[ORDEN_RECORRIDOS.indexOf(estado.id) + 1] : null
  const otroProceso = () => {
    salir()
    navigate(conPreview(D))
    setTimeout(() => window.dispatchEvent(new Event(AVISO_BIENVENIDA)), 60)
  }

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
      setBienvenida(!!document.querySelector('.demo-bienv'))
      const el = p.objetivo ? buscarEl(p.objetivo) : null
      // Si lo que hay que tocar está DENTRO de la ventana abierta (p. ej. «Ver en qué va mi
      // pedido» en la pantalla de pedido enviado), se ilumina igual.
      const dentro = !!el?.closest(CAPAS)
      const abierta = hayCapa() && !dentro
      setCapa(abierta)
      if (!p.objetivo || abierta) { setRect(null); return }
      const r = cajaVisible(el)
      setRect(r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight
        ? { top: Math.max(r.top, 0), left: r.left, width: r.width, height: Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0) } : null)
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
  }, [estado?.id, paso, enDemo, location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!p || !enDemo || bienvenida) return null

  // 🫧 Con una ventana de la app abierta (plato, carrito, formulario del pedido) el guía no se
  // atraviesa: queda una burbuja al borde derecho; tocarla muestra la instrucción del paso.
  if (capa && !p.final && !logro) {
    return createPortal(
      <div className="rc" aria-live="polite">
        <button className={`rc-burbuja ${verMini ? 'on' : ''}`} onClick={() => setVerMini(v => !v)}
          aria-label={verMini ? 'Ocultar la instrucción' : `Ver la instrucción: ${p.titulo}`}>
          <span aria-hidden="true">{verMini ? '✕' : p.emoji}</span>
        </button>
        {verMini && (
          <div className="rc-mini" role="dialog" aria-label="Instrucción del paso" onClick={() => setVerMini(false)}>
            <b>{p.titulo}</b>
            <p>{p.texto}</p>
          </div>
        )}
      </div>,
      document.body,
    )
  }

  const alBoton = () => {
    if (p.sinMesa) olvidarMesa(DEMO_SLUG)
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
  // 🚧 Durante el recorrido solo se toca lo resaltado (y la tarjeta): el resto de la pantalla queda
  // bloqueado con cuatro paneles transparentes alrededor del hueco. Tocar fuera sacude la tarjeta.
  const fueraToque = e => { e.preventDefault(); e.stopPropagation(); setSacude(n => n + 1) }
  const h = rect && !logro ? {
    t: rect.top - pad, l: rect.left - pad, r: rect.left + rect.width + pad, b: rect.top + rect.height + pad,
  } : null
  const bloqueos = h ? [
    { top: 0, left: 0, right: 0, height: Math.max(0, h.t) },
    { top: h.b, left: 0, right: 0, bottom: 0 },
    { top: Math.max(0, h.t), left: 0, width: Math.max(0, h.l), height: h.b - Math.max(0, h.t) },
    { top: Math.max(0, h.t), left: h.r, right: 0, height: h.b - Math.max(0, h.t) },
  ] : [{ inset: 0 }]
  // `libre`: el paso deja tocar todo (p. ej. seguir agregando platos antes de «Ver comanda»).
  if (p.libre) bloqueos.length = 0

  return createPortal(
    <div className="rc" aria-live="polite">
      {bloqueos.map((st, i) => <div key={i} className="rc-bloqueo" style={st} onPointerDown={fueraToque} onClick={fueraToque} />)}
      {rect && !logro && (
        <div className="rc-foco" style={{
          top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2,
          // Lo pequeño (un botón) va en cápsula; lo grande (una tarjeta), con esquinas suaves.
          borderRadius: Math.max(rect.width, rect.height) < 140 ? Math.min(rect.width, rect.height) / 2 + pad : 16,
        }}>
          <span className="rc-anillo" />
        </div>
      )}
      {!rect && p.final && <div className="rc-velo" />}

      {logro && <Celebracion />}

      <div data-sacude={sacude} className={`rc-tarjeta ${sacude ? 'sacude' : ''} ${arriba ? 'arriba' : ''} ${capa && !p.final && !logro ? 'compacta' : ''} ${p.final ? 'final' : ''} ${logro ? 'logro' : ''}`} key={paso} role="dialog" aria-label="Recorrido guiado" onAnimationEnd={e => { if (e.animationName === 'rcSacude') setSacude(0) }}>
        <button className="rc-x" onClick={salir} aria-label="Salir del recorrido">✕</button>
        {logro ? (
          <div className="rc-logro"><span>✓</span><b>¡Bien hecho!</b></div>
        ) : (
          <>
            <div className="rc-cab">
              <span className="rc-emoji" aria-hidden="true">{p.emoji}</span>
              <div>
                {!p.final && <small className="rc-paso">{rec.nombre}{paso > 0 ? ` · paso ${paso} de ${total - 1}` : ''}</small>}
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
                  {siguiente && (
                    <button className="rc-btn rc-btn-fuerte" onClick={() => iniciarRecorrido(siguiente)}>
                      Siguiente: {RECORRIDOS[siguiente].nombre} →
                    </button>
                  )}
                  <button className={`rc-btn ${siguiente ? '' : 'rc-btn-fuerte'}`} onClick={() => quieroEsto({ id: DEMO_SLUG })}>💬 Quiero esto para mi negocio</button>
                  <button className="rc-btn" onClick={otroProceso}>Elegir otro proceso</button>
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
