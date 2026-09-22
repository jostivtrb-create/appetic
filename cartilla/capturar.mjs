#!/usr/bin/env node
// Capturador de pantallas para la cartilla de vendedores.
// Maneja Chrome headless por CDP con el WebSocket nativo de Node 22 (sin dependencias).
//
//   node cartilla/capturar.mjs            -> todas las tomas
//   node cartilla/capturar.mjs menu carro -> solo esas
//
// La app tiene que estar levantada en BASE (npm run dev).

import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SALIDA = resolve(AQUI, 'capturas')
const BASE = process.env.BASE || 'http://localhost:5199'
const PUERTO = 9333

// Teléfono: proporción de un iPhone moderno, x3 para que no pixele al imprimir.
const MOVIL = { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }
// Panel de administrador: se ve en computador, así que va apaisado.
const ESCRITORIO = { width: 1280, height: 860, deviceScaleFactor: 2, mobile: false }

// Las animaciones de entrada (el logo épico, las tarjetas que suben) hacen que la foto
// salga a medio aparecer. No se pausan —eso las congelaría en el fotograma 0, invisibles—
// sino que se adelantan al final: duración mínima y fill-mode forwards.
const CSS_QUIETO = `
  *,*::before,*::after{
    animation-duration:1ms!important;
    animation-delay:0s!important;
    animation-iteration-count:1!important;
    animation-fill-mode:forwards!important;
    transition-duration:1ms!important;
    transition-delay:0s!important;
  }
  /* Los dos heros de logo (manchón de Jasbury, bandas que caen de Pilotos) dibujan el
     logo con capas animadas sobre un "sizer" oculto que es el logo entero. Adelantar la
     animación no sirve —el manchón termina DESPINTADO—, así que mostramos el sizer y
     apagamos las capas: queda el logo completo y limpio. */
  .logo-manchon-sizer,.logo-epico-sizer{visibility:visible!important;opacity:1!important}
  .logo-manchon-blob,.logo-manchon-shine,.logo-epico-band{display:none!important}
  /* El sello DEMO es del modo vista previa, no del panel que recibe el dueño:
     en la cartilla confundiría. */
  .admin-demo-badge{display:none!important}
`

// Abre el primer plato, resuelve las opciones OBLIGATORIAS (si no, "Agregar" no deja),
// lo mete al pedido y abre la hoja del carrito. Devuelve una promesa encadenable.
const ARMAR_PEDIDO = `(async () => {
  const esperar = ms => new Promise(r => setTimeout(r, ms))
  const clicables = () => [...document.querySelectorAll('button,[role="button"],article,a,li')]
  const porTexto = re => clicables().find(e => re.test((e.textContent||'').trim()))

  // 1) abrir el primer plato del menú
  const ver = document.querySelector('.menu-grid .pcard, .menu-grid > *') || porTexto(/^ver$/i)
  if (!ver) return 'no encontré ningún plato'
  ver.click(); await esperar(900)

  // 2) marcar lo obligatorio: el primer radio de cada grupo
  const grupos = new Set()
  for (const r of document.querySelectorAll('input[type=radio]')) {
    if (grupos.has(r.name)) continue
    grupos.add(r.name)
    r.click(); await esperar(120)
  }
  await esperar(400)

  // 3) agregar al pedido
  const agregar = porTexto(/agregar/i)
  if (!agregar) return 'no encontré el botón Agregar'
  if (agregar.disabled) return 'Agregar sigue bloqueado'
  agregar.click(); await esperar(1000)

  // 4) abrir la hoja del pedido (el botón del carrito en la barra de abajo)
  const pedido = document.querySelector('.bnav-cart')
  if (!pedido) return 'agregado, pero no encontré el botón Pedido'
  pedido.click(); await esperar(1100)
  return 'ok'
})()`

// Los locales de src/dev traen el WhatsApp REAL del negocio, y el panel lo
// imprime en varios sitios (el campo de Configuración, el texto de las artes,
// el mensaje de bienvenida). Una cartilla se fotocopia y se reparte: ahí no va
// el número de otro. Esto lo cambia por el nuestro en TODO el documento —campos
// y texto suelto— justo antes de disparar la foto.
const NUESTRO_TEL = '320 843 5143'
const TAPAR_TEL = `(() => {
  const set = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value').set
  let n = 0
  for (const i of document.querySelectorAll('input')) {
    if (!/^(57)?3\\d{9}$/.test((i.value||'').replace(/\\D/g, ''))) continue
    set.call(i, '573208435143')
    i.dispatchEvent(new Event('input', { bubbles: true }))
    n++
  }
  // Texto suelto: "321 422 6828" tal como lo pinta formatTel.
  const paseo = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const celular = /\\b3\\d{2} ?\\d{3} ?\\d{4}\\b/g
  for (let t = paseo.nextNode(); t; t = paseo.nextNode()) {
    if (!celular.test(t.nodeValue)) continue
    celular.lastIndex = 0
    t.nodeValue = t.nodeValue.replace(celular, '${NUESTRO_TEL}')
    n++
  }
  return n + ' teléfonos cambiados'
})()`

const TOMAS = [
  // ---- Lo que ve el cliente (Jasbury y Pilotos alternados, D17) ----
  { id: 'menu-jasbury', url: '/jasbury?preview=1', vp: MOVIL,
    nota: 'Menú con fotos reales de los platos' },

  { id: 'producto-jasbury', url: '/jasbury?preview=1', vp: MOVIL,
    nota: 'Producto abierto con adiciones',
    hacer: `(() => {
      const t = [...document.querySelectorAll('button,[role="button"],article,a')]
        .find(e => /hamburguesa sencilla/i.test(e.textContent||''))
      if (t) t.click()
      return !!t
    })()` },

  { id: 'carrito-jasbury', url: '/jasbury?preview=1', vp: MOVIL,
    nota: 'El pedido armado, con el total',
    hacer: ARMAR_PEDIDO, esperaExtra: 1200 },

  { id: 'checkout-pilotos', url: '/pilotos?preview=1', vp: MOVIL,
    nota: 'Datos del cliente y domicilio calculado',
    geo: { lat: 4.6512, lng: -74.0610 },   // a ~1 km del local: el domicilio da $2.000
    hacer: ARMAR_PEDIDO + `.then(async () => {
      const esperar = ms => new Promise(r => setTimeout(r, ms))
      const b = [...document.querySelectorAll('button,a')]
        .find(e => /continuar el pedido/i.test(e.textContent||''))
      if (!b) return 'sin botón de continuar'
      b.click(); await esperar(1600)

      // Rellenar como lo haría un cliente: React escucha 'input', no la asignación directa.
      const escribir = (el, v) => {
        const proto = el.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
        setter.call(el, v)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      // Pedir la ubicación (el permiso ya viene concedido por CDP) para que
      // calcule el costo del domicilio en vez de dejarlo "a convenir".
      const geo = [...document.querySelectorAll('button')]
        .find(e => /usar mi ubicaci/i.test(e.textContent||''))
      if (geo) { geo.click(); await esperar(1800) }

      const campos = [...document.querySelectorAll('input[type=text],input[type=tel],input:not([type]),textarea')]
      const dir = campos.find(i => /direcci/i.test(i.placeholder||''))
      const nombre = campos.find(i => /nombre/i.test(i.placeholder||''))
      const tel = campos.find(i => /whatsapp|tel|celular/i.test(i.placeholder||''))
      if (dir) escribir(dir, 'Cra 10 #5-23, casa azul')
      if (nombre) escribir(nombre, 'Andrés Gómez')
      if (tel) escribir(tel, '3208435143')
      await esperar(300)
      const check = document.querySelector('input[type=checkbox]')
      if (check && !check.checked) { check.click(); await esperar(300) }
      await esperar(900)
      return 'checkout listo'
    })`, esperaExtra: 1400 },

  { id: 'menu-pilotos', url: '/pilotos?preview=1', vp: MOVIL,
    nota: 'Segundo local: mismo app, otra identidad' },

  { id: 'buscador', url: '/?preview=1', vp: MOVIL,
    nota: 'El buscador de Appetic con los locales del barrio' },

  // ---- Panel del dueño (isDevSlug da acceso sin login) ----
  { id: 'panel-catalogo', url: '/pilotos/admin/catalogo?preview=1', vp: ESCRITORIO,
    nota: 'Pestaña Catálogo: editar platos y precios',
    // Las categorías arrancan minimizadas: desplegamos una para que se vean los
    // platos con sus botones de editar, que es justo lo que se está vendiendo.
    hacer: `(() => {
      const c = document.querySelector('.ap-grupo-cat-title')
      if (c) c.click()
      return c ? c.textContent.trim() : 'sin categorías'
    })()` },
  { id: 'panel-difundir', url: '/jasbury/admin/difundir?preview=1', vp: ESCRITORIO,
    nota: 'Pestaña Difundir: QR, link y artes',
    hacer: TAPAR_TEL },
  { id: 'panel-config', url: '/pilotos/admin/config?preview=1', vp: ESCRITORIO,
    nota: 'Pestaña Configuración: horarios, colores, domicilio',
    hacer: TAPAR_TEL },

  // Menos alto: así entra "Hoy" y "Acumulado" y se corta el listado por día, que
  // trae fechas de ejemplo (junio) y en la cartilla solo distraería.
  { id: 'panel-metricas', url: '/jasbury/admin/metricas?preview=1',
    vp: { ...ESCRITORIO, height: 620 },
    nota: 'Pestaña Métricas: cuánta gente entró y cuánto pidió' },

  // ---- Primeros planos del panel (recortados por selector) ----
  { id: 'zoom-editar', url: '/jasbury/admin/catalogo?preview=1', vp: ESCRITORIO,
    nota: 'Primer plano: cambiar el precio de un plato',
    recorte: '.pm-sheet', margen: 10,
    hacer: `(async () => {
      const esperar = ms => new Promise(r => setTimeout(r, ms))
      const cat = document.querySelector('.ap-grupo-cat-title')
      if (cat) { cat.click(); await esperar(600) }
      const editar = [...document.querySelectorAll('button')]
        .find(e => /^editar$/i.test((e.textContent||'').trim()))
      if (!editar) return 'no encontré el botón Editar'
      editar.click(); await esperar(900)
      return 'editor abierto'
    })()` },

  { id: 'zoom-qr', url: '/jasbury/admin/difundir?preview=1', vp: ESCRITORIO,
    nota: 'Primer plano: el link y el código QR',
    recorte: '.dif .ac-sec:nth-of-type(1), .dif .ac-sec:nth-of-type(2)', margen: 14,
    hacer: TAPAR_TEL },

  { id: 'zoom-artes', url: '/pilotos/admin/difundir?preview=1', vp: ESCRITORIO,
    nota: 'Primer plano: publicidad con IA y mensaje de bienvenida',
    recorte: '.dif .ac-sec:nth-of-type(4), .dif .ac-sec:nth-of-type(5)', margen: 14,
    hacer: TAPAR_TEL },

  // ---- Menú del día (página 13): el que se cambia sin reimprimir nada ----
  { id: 'menu-del-dia', url: '/sabor-del-dia?preview=1', vp: MOVIL,
    nota: 'El almuerzo del día, que el local cambia cada mañana' },
]

// ---------------------------------------------------------------- CDP mínimo
class Cdp {
  constructor (ws) { this.ws = ws; this.n = 0; this.pend = new Map(); this.oyentes = new Map() }

  static async abrir (url) {
    const ws = new WebSocket(url)
    await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = () => mal(new Error('no conecta ' + url)) })
    const c = new Cdp(ws)
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data)
      if (m.id != null) {
        const p = c.pend.get(m.id); c.pend.delete(m.id)
        if (!p) return
        m.error ? p.mal(new Error(m.error.message)) : p.ok(m.result)
      } else {
        for (const f of c.oyentes.get(m.method) || []) f(m.params)
      }
    }
    return c
  }

  enviar (method, params = {}, sessionId) {
    const id = ++this.n
    return new Promise((ok, mal) => {
      this.pend.set(id, { ok, mal })
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
      setTimeout(() => { if (this.pend.delete(id)) mal(new Error('timeout ' + method)) }, 45000)
    })
  }

  al (evento, fn) {
    if (!this.oyentes.has(evento)) this.oyentes.set(evento, [])
    this.oyentes.get(evento).push(fn)
  }

  una (evento, ms = 20000) {
    return new Promise(ok => {
      const t = setTimeout(() => ok(null), ms)
      this.al(evento, p => { clearTimeout(t); ok(p) })
    })
  }

  cerrar () { this.ws.close() }
}

async function json (ruta) {
  const r = await fetch(`http://127.0.0.1:${PUERTO}${ruta}`)
  return r.json()
}

// ---------------------------------------------------------------- principal
const pedidas = process.argv.slice(2)
const lista = pedidas.length ? TOMAS.filter(t => pedidas.some(p => t.id.includes(p))) : TOMAS
if (!lista.length) { console.error('Ninguna toma coincide con', pedidas); process.exit(1) }

mkdirSync(SALIDA, { recursive: true })

const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--force-color-profile=srgb', '--disable-lcd-text',
  `--remote-debugging-port=${PUERTO}`,
  '--user-data-dir=/tmp/_cartilla_chrome',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] })

const adios = () => { try { chrome.kill() } catch {} }
process.on('exit', adios); process.on('SIGINT', () => { adios(); process.exit(1) })

// Esperar a que el puerto de depuración responda.
let version = null
for (let i = 0; i < 60 && !version; i++) {
  try { version = await json('/json/version') } catch { await sleep(250) }
}
if (!version) { console.error('Chrome no levantó el puerto de depuración'); process.exit(1) }

const navegador = await Cdp.abrir(version.webSocketDebuggerUrl)

for (const toma of lista) {
  const { targetId } = await navegador.enviar('Target.createTarget', { url: 'about:blank' })
  const objetivo = await json('/json/list').then(l => l.find(t => t.id === targetId))
  const p = await Cdp.abrir(objetivo.webSocketDebuggerUrl)

  await p.enviar('Page.enable')
  await p.enviar('Runtime.enable')
  await p.enviar('Emulation.setDeviceMetricsOverride', toma.vp)
  if (toma.geo) {
    // Sin permiso concedido el checkout no calcula el domicilio y cae en "a convenir".
    await p.enviar('Browser.grantPermissions', {
      origin: BASE, permissions: ['geolocation'],
    })
    await p.enviar('Emulation.setGeolocationOverride', {
      latitude: toma.geo.lat, longitude: toma.geo.lng, accuracy: 20,
    })
  }
  await p.enviar('Page.addScriptToEvaluateOnNewDocument', {
    // documentElement ya existe aunque head todavía no: así entra antes del primer pintado.
    source: `(()=>{const s=document.createElement('style');
      s.textContent=${JSON.stringify(CSS_QUIETO)};
      document.documentElement.appendChild(s)})()`,
  })

  const cargado = p.una('Page.loadEventFired')
  await p.enviar('Page.navigate', { url: BASE + toma.url })
  await cargado

  // Esperar a que las fotos de los platos terminen de bajar.
  await p.enviar('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async()=>{
      const t0=Date.now()
      while(Date.now()-t0<12000){
        const im=[...document.images]
        if(im.length && im.every(i=>i.complete && i.naturalWidth>0)) break
        await new Promise(r=>setTimeout(r,200))
      }
      if(document.fonts) await document.fonts.ready
      await new Promise(r=>setTimeout(r,400))
    })()`,
  })

  if (toma.hacer) {
    const r = await p.enviar('Runtime.evaluate', {
      expression: toma.hacer, awaitPromise: true, returnByValue: true,
    })
    console.log(`   · interacción -> ${JSON.stringify(r.result?.value)}`)
    await sleep(toma.esperaExtra || 900)
  }

  // Re-inyectar por si React repintó después de la interacción, y volver arriba:
  // el chip de categoría activo hace scrollIntoView y se lleva la página con él,
  // dejando el hero fuera de la foto.
  await p.enviar('Runtime.evaluate', {
    expression: `(()=>{const s=document.createElement('style');
      s.textContent=${JSON.stringify(CSS_QUIETO)};document.documentElement.appendChild(s);
      if(!${JSON.stringify(!!toma.mantenerScroll)}){
        window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;
        document.querySelectorAll('*').forEach(e=>{if(e.scrollTop)e.scrollTop=0})
      }})()`,
  })
  await sleep(400)

  // `recorte` recorta a la caja de un elemento (con un margen), en vez de a la
  // ventana entera: así los primeros planos del panel siguen cuadrando aunque
  // mañana se mueva el diseño.
  let clip
  if (toma.recorte) {
    const r = await p.enviar('Runtime.evaluate', {
      returnByValue: true,
      expression: `(()=>{
        const els=[...document.querySelectorAll(${JSON.stringify(toma.recorte)})]
        if(!els.length) return null
        const cajas=els.map(e=>e.getBoundingClientRect())
        return {
          x: Math.min(...cajas.map(c=>c.left)),
          y: Math.min(...cajas.map(c=>c.top)),
          r: Math.max(...cajas.map(c=>c.right)),
          b: Math.max(...cajas.map(c=>c.bottom)),
        }
      })()`,
    })
    const c = r.result?.value
    if (!c) {
      console.log(`   ⚠️  no encontré "${toma.recorte}": salgo con la ventana entera`)
    } else {
      const m = toma.margen ?? 16
      clip = {
        x: Math.max(0, c.x - m), y: Math.max(0, c.y - m),
        width: (c.r - c.x) + m * 2, height: (c.b - c.y) + m * 2, scale: 1,
      }
    }
  }

  const { data } = await p.enviar('Page.captureScreenshot',
    { format: 'png', fromSurface: true, ...(clip ? { clip } : {}) })
  const archivo = `${SALIDA}/${toma.id}.png`
  writeFileSync(archivo, Buffer.from(data, 'base64'))
  console.log(`✅ ${toma.id}.png  — ${toma.nota}`)

  p.cerrar()
  await navegador.enviar('Target.closeTarget', { targetId })
}

navegador.cerrar()
adios()
console.log(`\nListo. ${lista.length} capturas en cartilla/capturas/`)
process.exit(0)
