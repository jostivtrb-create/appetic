import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { EVENTO_DEMO } from './eventosDemo'
import { quieroEsto, conPreview } from './demoUtils'
import { DEMO_SLUG } from '../../config/demo'
import { olvidarMesa } from '../../utils/mesaQR'
import { PLANES } from '../../utils/plan'
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

// Pasos que se repiten entre recorridos.
const CATALOGO = `${D}/admin/config/catalogo`
const elegirPlato = { emoji: '🍔', titulo: 'Elige lo que quieres',
  texto: 'Toca un plato, elige cómo lo quieres (sin cebolla, con papas…) y agrégalo.',
  objetivo: '.pcard', espera: 'carrito', ruta: D }
const abrirPedido = { emoji: '🧾', titulo: 'Abre tu pedido',
  texto: 'Toca «Pedido» y luego «Continuar el pedido».',
  objetivo: '.cd-checkout, .bnav-cart', espera: 'checkout-abierto', ruta: D }
const seguirPedido = { emoji: '📍', titulo: 'Sigue tu pedido',
  texto: 'El cliente no tiene que preguntar «¿ya está?»: en «Mi pedido» ve si está por confirmar, en cocina, en camino o listo. Toca «Ver en qué va mi pedido».',
  objetivo: '.co-exito-seguir', espera: 'mi-pedido',
  siNoHay: 'El link «Mi pedido» también le llega en el WhatsApp del pedido. Ahí ve en qué va.' }

// 🗂️ La demo se ordena por los 5 SERVICIOS de la propuesta (guía «Demo de clientes» D19), con su
// mismo número, nombre e ícono. Cada servicio es un recorrido; el 1 primero deja elegir cómo pide
// el cliente (D21) y sigue en el recorrido de ese camino. `plan`: en qué plan viene (D23).
export const SERVICIOS = {
  menu: { num: 1, nombre: 'Menú digital con fotos', icono: '/demo-servicios/menu.webp', resumen: 'Tu cliente pide desde el QR o el link y te llega al WhatsApp' },
  tv: { num: 2, nombre: 'Tu menú en vivo en el TV', icono: '/demo-servicios/tv.webp', resumen: 'Cambias un precio y cambia solo en el TV' },
  domicilios: { num: 3, nombre: 'Domicilios', icono: '/demo-servicios/domicilios.webp', resumen: 'Confirmas, sale tu domiciliario y lo entrega' },
  salon: { num: 4, nombre: 'Meseros y cocina', icono: '/demo-servicios/meseros.webp', resumen: 'De la mesa a la cocina, y de vuelta al mesero' },
  cuentas: { num: 5, nombre: 'Tus cuentas', icono: '/demo-servicios/cuentas.webp', resumen: 'Cobras en la Caja y ves cuánto te quedó' },
}
export const ORDEN_SERVICIOS = ['menu', 'tv', 'domicilios', 'salon', 'cuentas']

// El pedido «por confirmar» que crea el servicio 3 al empezar (prepararProceso lo deja aquí).
let pedidoAConfirmar = null
export const fijarPedidoAConfirmar = id => { pedidoAConfirmar = id }
// El último plato que cambió el visitante (AdminPage lo guarda): el TV lo muestra resaltado.
export const CLAVE_PLATO = 'appetic_demo_plato'
const platoCambiado = () => { try { return sessionStorage.getItem(CLAVE_PLATO) || '' } catch { return '' } }

export const RECORRIDOS = {
  menu: {
    servicio: 'menu', nombre: 'Menú digital',
    pasos: [
      { emoji: '📱', titulo: 'Tu menú digital, con fotos',
        texto: 'Tus clientes abren tu menú con un QR o un link, sin descargar nada, y te piden solos. ¿Cómo quieres pedir?',
        opciones: [
          { id: 'menu-recoger', emoji: '🛍️', txt: 'Para recoger' },
          { id: 'menu-domicilio', emoji: '🛵', txt: 'A domicilio' },
          { id: 'menu-mesa', emoji: '🪑', txt: 'Desde la mesa (QR)' },
        ] },
    ],
  },
  'menu-recoger': {
    servicio: 'menu', nombre: 'Menú · para recoger', plan: 'emprendedor',
    pasos: [
      { emoji: '🧍', titulo: 'Estás en la fila',
        texto: 'Llegaste al local y hay fila. Escaneas el QR del mostrador: es el menú, con fotos y precios. Pides mientras esperas.',
        boton: 'Abrir el menú', ir: D, sinMesa: true },
      elegirPlato,
      abrirPedido,
      { emoji: '🛍️', titulo: 'Pídelo para recoger',
        texto: 'Elige «Recoger», escribe tu nombre y cómo pagas, y toca «Enviar». Al local le llega completo al WhatsApp: sin errores y sin que nadie lo dicte.',
        espera: 'pedido-app', ruta: D, libre: true },
      seguirPedido,
      { emoji: '🏆', titulo: '¡Se acabó la fila!', final: true,
        texto: 'El pedido le llegó armado al WhatsApp del local, con opciones y notas. Tú solo lo preparas. Y los precios, los agotados y el menú del día los cambias tú cuando quieras.' },
    ],
  },
  'menu-domicilio': {
    servicio: 'menu', nombre: 'Menú · a domicilio', plan: 'comerciante',
    pasos: [
      { emoji: '🏠', titulo: 'Eres un cliente en tu casa',
        texto: 'Viste a Burger Demo en Instagram o te mandaron el link por WhatsApp. Lo abres: es su menú, con fotos y precios. No descargas nada.',
        boton: 'Abrir el menú', ir: D, sinMesa: true },
      elegirPlato,
      abrirPedido,
      { emoji: '🛵', titulo: 'Pídelo a domicilio',
        texto: 'Elige «Domicilio», escribe tu dirección, tu nombre y tu WhatsApp, y cómo pagas: el envío se calcula solo, por distancia. Toca «Enviar» y verás cómo le llega al WhatsApp del restaurante.',
        espera: 'pedido-app', ruta: D, libre: true },
      seguirPedido,
      { emoji: '🏆', titulo: '¡Así pide tu cliente!', final: true,
        texto: 'El pedido llegó al WhatsApp con la dirección, y el envío se cobró solo por distancia. En el servicio 3 ves cómo lo confirmas y cómo sale tu domiciliario.' },
    ],
  },
  'menu-mesa': {
    servicio: 'menu', nombre: 'Menú · desde la mesa', plan: 'empresario',
    pasos: [
      { emoji: '🪑', titulo: 'Estás sentado en la mesa 4',
        texto: 'Cada mesa tiene su QR con el número. Lo escaneas y el menú ya sabe en qué mesa estás.',
        boton: 'Escanear el QR de la mesa 4', ir: `${D}?mesa=4` },
      elegirPlato,
      abrirPedido,
      { emoji: '🍳', titulo: 'Mándalo a la cocina',
        texto: 'Escribe tu nombre y envíalo. No hay que llamar al mesero: el pedido cae directo en la pantalla de la cocina, marcado «MESA 4».',
        espera: 'pedido-mesa', ruta: D, libre: true },
      { emoji: '🏆', titulo: '¡Pediste sin esperar al mesero!', final: true,
        texto: 'La comanda llegó a la cocina con la mesa y las notas. Cuando sale, les suena a los meseros. La cuenta de la mesa se cobra en la Caja.' },
    ],
  },
  tv: {
    servicio: 'tv', nombre: 'Menú en el TV', plan: 'emprendedor',
    pasos: [
      { emoji: '📺', titulo: 'Tu menú en vivo, en tu TV',
        texto: 'Una pantalla con todo tu menú y tus precios de hoy, en el televisor que ya tienes. Sale sola de tu menú: no diseñas nada.',
        boton: 'Prender el TV →', ir: `${D}/tv` },
      { emoji: '👀', titulo: 'Así se ve en tu local',
        texto: 'Los platos pasan solos, con foto y precio, y las categorías se turnan. En tu negocio lo abres en el TV con un link. Ahora cambia un precio y mira qué pasa.',
        boton: 'Cambiar un precio →', ir: CATALOGO, ruta: `${D}/tv` },
      { emoji: '✏️', titulo: 'Edita un plato',
        texto: 'Abre una categoría y toca «Editar» en cualquier plato.',
        objetivo: '.ap-grupo-cat', espera: 'editar-producto', ruta: CATALOGO },
      { emoji: '💲', titulo: 'Cambia el precio y guarda',
        texto: 'Ponle otro precio y toca «Guardar».',
        espera: 'producto', ruta: CATALOGO, libre: true },
      { emoji: '📺', titulo: 'Vuelve al TV',
        texto: 'No tienes que tocar el TV: el precio nuevo ya está allá.',
        boton: 'Ver el TV →', ir: () => `${D}/tv${platoCambiado() ? `?plato=${encodeURIComponent(platoCambiado())}` : ''}` },
      { emoji: '✨', titulo: '¡Cambió solo!',
        texto: 'Ahí está tu plato, resaltado, con el precio nuevo. Igual pasa con los agotados y el menú del día.',
        objetivo: '.tvt-resaltado', boton: 'Listo', ruta: `${D}/tv`,
        siNoHay: 'El precio nuevo ya está en el TV: aparece cuando le toca el turno a su categoría. Igual pasa con los agotados y el menú del día.' },
      { emoji: '🏆', titulo: '¡Tu TV se maneja solo!', final: true,
        texto: 'Cambias un precio en el celular y cambia en el TV en segundos. Sin diseñador, sin USB y sin volver a imprimir la carta.' },
    ],
  },
  domicilios: {
    servicio: 'domicilios', nombre: 'Domicilios', plan: 'comerciante',
    pasos: [
      { emoji: '🛵', titulo: 'Domicilios, sin comisión',
        texto: 'Un cliente pidió a domicilio desde tu menú. El envío se cobró solo según la distancia y el pedido te llegó armado. Primero lo confirmas.',
        boton: 'Ver el pedido →', ir: () => `/p/${DEMO_SLUG}/${pedidoAConfirmar || 'demo-domicilio-1'}` },
      { emoji: '✅', titulo: 'Confírmalo',
        texto: 'Revisa la dirección y lo que pidió, y toca «Confirmar pedido». La comanda entra a la cocina y el cliente lo ve en «Mi pedido».',
        objetivo: '.mp-confirmar', espera: 'pedido-confirmado',
        siNoHay: 'Otra persona que está probando la demo ya lo confirmó. Igual puedes seguir: así funciona.' },
      { emoji: '🏍️', titulo: 'Ahora eres el domiciliario',
        texto: 'Tu domiciliario tiene su panel: dirección, mapa, a quién llamar, cuánto cobrar y las vueltas. Le suena cuando la cocina despacha un domicilio.',
        boton: 'Abrir su panel →', ir: `${D}/admin/domicilios` },
      { emoji: '🛵', titulo: 'Sal a entregarlo',
        texto: 'En «Listos para salir» está el que la cocina ya despachó. Toca «Voy en camino»: el cliente lo ve en «Mi pedido».',
        objetivo: '.dm-salir', espera: 'en-camino', ruta: `${D}/admin/domicilios`,
        siNoHay: 'Otra persona que está probando la demo acaba de sacarlo. Igual puedes seguir: así funciona.' },
      { emoji: '🏁', titulo: 'Entrégalo',
        texto: 'Cuando lo entregues, toca «Entregado».',
        objetivo: '.dm-entregado', espera: 'domicilio-entregado', ruta: `${D}/admin/domicilios`,
        siNoHay: 'No hay domicilios en camino ahora.' },
      { emoji: '🏆', titulo: '¡Del menú a la puerta!', final: true,
        texto: 'Sin volver a escribir nada y sin comisión: cada peso del pedido es tuyo. Lo entrega tu gente, no una app. Cuando vuelve con la plata, se cobra en la Caja.' },
    ],
  },
  salon: {
    servicio: 'salon', nombre: 'Meseros y cocina', plan: 'empresario',
    pasos: [
      { emoji: '🧑‍🍳', titulo: 'Eres el mesero',
        texto: 'Tienes la app en tu celular, con el mismo menú que ven tus clientes y arriba las mesas que están abiertas.',
        boton: 'Abrir mi pantalla →', ir: `${D}/admin/mesero` },
      { emoji: '📱', titulo: 'Toma el pedido de la mesa',
        texto: 'El cliente te dice qué quiere: toca un plato. Si tiene opciones (sin cebolla, con papas…), elígelas y agrégalo.',
        objetivo: '.pv-grid', espera: 'mesero-plato', ruta: `${D}/admin/mesero` },
      { emoji: '➕', titulo: '¿Algo más?',
        texto: 'Agrega otro plato si quieres. Cuando esté todo, toca «Enviar a cocina», marca la mesa en el teclado y listo. Llega al instante, sin libreta y sin caminar.',
        objetivo: '.pv-ticket, .pv-barra', espera: 'comanda-mesero', ruta: `${D}/admin/mesero`, libre: true },
      { emoji: '🍳', titulo: 'Ahora eres el cocinero',
        texto: 'La comanda ya está en la tablet de la cocina, en orden de llegada, con la mesa, las notas y cuánto lleva esperando.',
        boton: 'Abrir la cocina →', ir: `${D}/admin/cocina` },
      { emoji: '👆', titulo: 'Abre una comanda',
        texto: 'Tócala para ver qué lleva: cada plato, sus opciones y los comentarios del mesero.',
        objetivo: '.km-com', espera: 'comanda-abierta', ruta: `${D}/admin/cocina`,
        siNoHay: 'Otra persona que está probando la demo acaba de despacharla. Igual puedes seguir: así funciona.' },
      { emoji: '✔️', titulo: 'Tacha lo que va saliendo',
        texto: 'Toca la casilla de un plato cuando esté listo (o «Tachar todo»). «¿Qué lleva?» te muestra los ingredientes.',
        objetivo: '.km-com.abierta', espera: 'tachar', ruta: `${D}/admin/cocina` },
      { emoji: '✅', titulo: 'Despáchala',
        texto: 'Toca «Confirmar entregado». Al mesero le suena el aviso de que ya salió, esté en la pantalla que esté.',
        objetivo: '.km-entregar', espera: 'comanda-entregada', ruta: `${D}/admin/cocina` },
      { emoji: '🪑', titulo: 'Un QR en cada mesa',
        texto: 'En «Difundir» imprimes un QR por mesa, con tu logo y el número. El cliente pide solo y le cae directo a la cocina.',
        boton: 'Ver Difundir →', ir: `${D}/admin/difundir` },
      { emoji: '🖨️', titulo: 'Tus QR, listos para imprimir',
        texto: 'Aquí está tu link, tu QR y la hoja con un QR por mesa. Baja y míralos con calma.',
        boton: 'Listo', ruta: `${D}/admin/difundir`, libre: true },
      { emoji: '🏆', titulo: '¡Mesa, cocina y mesero, conectados!', final: true,
        texto: 'Sin libreta, sin gritos y sin caminar. Meseros y pantallas sin límite, y tú sigues cada comanda hasta que se cobra.' },
    ],
  },
  cuentas: {
    servicio: 'cuentas', nombre: 'Tus cuentas', plan: 'emprendedor',
    pasos: [
      { emoji: '💵', titulo: 'Eres el dueño',
        texto: 'En la «Caja» vendes en el mostrador y arriba ves cada mesa o pedido que falta por cobrar, con su total y en qué va.',
        boton: 'Abrir la Caja →', ir: `${D}/admin/caja` },
      { emoji: '🧾', titulo: 'Cobra',
        texto: 'Toca una mesa lista (o agrega platos a «Rápida») y dale «Cobrar»: escoges efectivo, Nequi o tarjeta, divides el pago, pones propina o descuento y te dice las vueltas.',
        objetivo: '.cj-cobrar', espera: 'cobrada', ruta: `${D}/admin/caja`,
        siNoHay: 'Toca unos platos para armar una venta rápida y cóbrala.' },
      // H4 de la auditoría: el visitante anota un gasto y lo ve restar en «Te quedó hoy».
      { emoji: '💸', titulo: 'Anota lo que compraste',
        texto: 'Hoy pagaste el gas. Tú solo anotas lo que compras: toca «Gastos».',
        objetivo: conTexto('.pv-vistas button', /Gastos/), espera: 'caja-gastos', ruta: `${D}/admin/caja` },
      { emoji: '🔥', titulo: 'Gas · $45.000',
        texto: 'Escribe «Gas», el valor 45.000, de dónde salió la plata, y toca «Anotar gasto».',
        objetivo: '.pv-gasto', espera: 'gasto', ruta: `${D}/admin/caja` },
      { emoji: '📊', titulo: 'Tus cuentas, claras',
        texto: 'La venta que cobraste y el gas ya entraron solos a tus cuentas. Vamos a verlas.',
        boton: 'Ver mis cuentas →', ir: `${D}/admin/cuentas` },
      { emoji: '👀', titulo: 'Mira lo que te quedó',
        texto: 'Vendiste, gastaste (ahí está tu gas) y lo que te quedó hoy: tu cierre de caja, sin calculadora. Abajo, el mes, los saldos de cada cuenta y la nómina.',
        objetivo: '.cu-dia', boton: 'Listo', ruta: `${D}/admin/cuentas`, libre: true },
      { emoji: '🏆', titulo: '¡Sabes cuánto ganas!', final: true,
        texto: 'Cada venta del menú, de las mesas y de los domicilios entra sola. Tú anotas lo que compras y lo que pagas, y Appetic te dice cuánto te quedó. Sin cuaderno ni calculadora.' },
    ],
  },
}

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

// Lo llama la bienvenida: arranca el recorrido de ese servicio desde el principio (o desde `paso`,
// cuando viene de elegir un camino en el servicio 1).
export function iniciarRecorrido(id, paso = 0) {
  // La mesa del QR solo vale en «desde la mesa»: el resto del menú se ve como cliente normal.
  if (id !== 'menu-mesa') olvidarMesa(DEMO_SLUG)
  guardar({ id, paso })
  window.dispatchEvent(new Event(AVISO))
  // Cada servicio se vale solo: crea lo que esa persona necesita ver (si no lo hay ya).
  import('./prepararProceso').then(m => m.prepararProceso(id)).catch(() => {})
}
const precio = n => '$' + n.toLocaleString('es-CO')

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
  const [sacude, setSacude] = useState(0)
  const enfocado = useRef('')                       // paso al que ya se le llevó la pantalla           // tocó fuera de lo resaltado: la tarjeta avisa
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
  // Al terminar: el servicio siguiente, o volver a la bienvenida a elegir otro.
  const siguiente = rec ? ORDEN_SERVICIOS[ORDEN_SERVICIOS.indexOf(rec.servicio) + 1] : null
  const plan = rec?.plan ? PLANES[rec.plan] : null
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
      // Al empezar el paso, si lo que hay que tocar no se ve entero, la pantalla va hasta allá sola.
      if (el && enfocado.current !== `${estado?.id}:${paso}`) {
        enfocado.current = `${estado?.id}:${paso}`
        const b = el.getBoundingClientRect()
        if (b.top < 60 || b.bottom > window.innerHeight - 10) el.scrollIntoView({ block: b.height > window.innerHeight * 0.6 ? 'start' : 'center' })
      }
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
  // ¿Cabe la tarjeta (≈190 px) arriba o abajo de lo resaltado sin taparlo? Si lo resaltado es muy
  // alto (una comanda abierta, una lista), no cabe en ningún lado: va como burbuja al borde.
  const ALTO_TARJETA = 190
  const libreArriba = rect ? rect.top - 54 : Infinity
  const libreAbajo = rect ? window.innerHeight - (rect.top + rect.height) : Infinity
  const sinLugar = !!rect && Math.max(libreArriba, libreAbajo) < ALTO_TARJETA

  // Bloqueo del resto de la pantalla (ver más abajo): solo se toca lo resaltado.
  const pad = 8
  const fueraToque = e => { e.preventDefault(); e.stopPropagation(); setSacude(n => n + 1); setVerMini(true) }
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
  const foco = rect && !logro && (
    <div className="rc-foco" style={{
      top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2,
      // Lo pequeño (un botón) va en cápsula; lo grande (una tarjeta), con esquinas suaves.
      borderRadius: Math.max(rect.width, rect.height) < 140 ? Math.min(rect.width, rect.height) / 2 + pad : 16,
    }}>
      <span className="rc-anillo" />
    </div>
  )

  const alBoton = () => {
    if (p.sinMesa) olvidarMesa(DEMO_SLUG)
    if (p.ir) navigate(conPreview(typeof p.ir === 'function' ? p.ir() : p.ir))
    ir(paso + 1)
  }

  // 🫧 Burbuja al borde: con una ventana de la app abierta (ahí se hace el paso, no se bloquea nada)
  // o cuando lo resaltado es tan alto que la tarjeta lo taparía (ahí sí sigue el bloqueo).
  if ((capa || sinLugar) && !p.final && !logro) {
    return createPortal(
      <div className="rc" aria-live="polite">
        {!capa && bloqueos.map((st, i) => <div key={i} className="rc-bloqueo" style={st} onPointerDown={fueraToque} onClick={fueraToque} />)}
        {!capa && foco}
        <button className={`rc-burbuja ${verMini ? 'on' : ''}`} onClick={() => setVerMini(v => !v)}
          aria-label={verMini ? 'Ocultar la instrucción' : `Ver la instrucción: ${p.titulo}`}>
          <span aria-hidden="true">{verMini ? '✕' : p.emoji}</span>
        </button>
        {verMini && (
          <div className={`rc-mini ${capa ? '' : 'rc-mini--arriba'}`} role="dialog" aria-label="Instrucción del paso">
            <b>{p.titulo}</b>
            <p>{noAparece && p.siNoHay ? p.siNoHay : p.texto}</p>
            <div className="rc-mini-acc">
              {/* Un paso de botón (p. ej. el primero del servicio siguiente, con «¡Listo!» aún abierto)
                  también se puede dar desde aquí: si no, quedaba atascado. */}
              {p.boton && <button onClick={alBoton}>{p.boton}</button>}
              {p.opciones?.map(o => <button key={o.id} onClick={() => iniciarRecorrido(o.id)}>{o.emoji} {o.txt}</button>)}
              <button onClick={() => setVerMini(false)}>Entendido</button>
              {p.espera && <button className="rc-mini-saltar" onClick={() => ir(paso + 1)}>Saltar paso</button>}
            </div>
          </div>
        )}
      </div>,
      document.body,
    )
  }

  // ¿Está en la pantalla de este paso? Si se fue a otra, se le ofrece volver.
  const fuera = p.ruta && location.pathname !== p.ruta
  // La tarjeta va ARRIBA por defecto: los botones de la app («Agregar», «Continuar», «Enviar»)
  // viven abajo. Solo baja si lo que brilla está arriba.
  const arriba = !rect || libreArriba >= ALTO_TARJETA || libreArriba >= libreAbajo
  const total = PASOS.length - 1
  // 🚧 Durante el recorrido solo se toca lo resaltado (paneles transparentes alrededor del hueco).

  return createPortal(
    <div className="rc" aria-live="polite">
      {bloqueos.map((st, i) => <div key={i} className="rc-bloqueo" style={st} onPointerDown={fueraToque} onClick={fueraToque} />)}
      {foco}
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
                {!p.final && <small className="rc-paso">{SERVICIOS[rec.servicio].num}. {rec.nombre}{paso > 0 ? ` · paso ${paso} de ${total - 1}` : ''}</small>}
                <h3>{p.titulo}</h3>
              </div>
            </div>
            <p>{noAparece && p.siNoHay ? p.siNoHay : p.texto}</p>
            {!p.final && (
              <div className="rc-barra" aria-hidden="true"><span style={{ width: `${(paso / (total || 1)) * 100}%` }} /></div>
            )}
            <div className="rc-acc">
              {p.final ? (
                <>
                  {plan && (
                    <p className="rc-plan">Viene en el plan <b>{plan.nombre}</b> · desde {precio(plan.precio)}/mes</p>
                  )}
                  {siguiente && (
                    <button className="rc-btn rc-btn-fuerte" onClick={() => iniciarRecorrido(siguiente)}>
                      Siguiente: {SERVICIOS[siguiente].num}. {SERVICIOS[siguiente].nombre} →
                    </button>
                  )}
                  <button className={`rc-btn ${siguiente ? '' : 'rc-btn-fuerte'}`} onClick={() => quieroEsto()}>💬 Quiero esto para mi negocio</button>
                  <button className="rc-btn" onClick={otroProceso}>Elegir otro servicio</button>
                </>
              ) : fuera ? (
                <button className="rc-btn rc-btn-fuerte" onClick={() => navigate(conPreview(p.ruta))}>Volver a donde íbamos</button>
              ) : noAparece && p.siNoHay ? (
                <button className="rc-btn rc-btn-fuerte" onClick={() => ir(paso + 1)}>Siguiente →</button>
              ) : p.opciones ? (
                <div className="rc-opciones">
                  {p.opciones.map(o => (
                    <button key={o.id} className="rc-btn rc-btn-fuerte" onClick={() => iniciarRecorrido(o.id)}>
                      <span aria-hidden="true">{o.emoji}</span> {o.txt}
                    </button>
                  ))}
                </div>
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
