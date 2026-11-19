// 📲 Instalar la app: lo que comparten index.html, App.jsx y el aviso InstallPrompt.
//
// 1) El aviso del navegador (Android/Chrome) se lanza UNA vez y muy pronto, a veces antes de que
//    React pinte: se guarda desde el arranque (main.jsx importa este archivo) y el InstallPrompt lo
//    toma cuando aparece.
// 2) En el link de un local, lo que se instala es ESE local (su manifest: api/manifest.js).

let aviso = null
const oyentes = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    aviso = e
    oyentes.forEach(f => f(e))
  })
  window.addEventListener('appinstalled', () => { aviso = null; oyentes.forEach(f => f(null)) })
}

/** Llama a `f` con el aviso (ya guardado o cuando llegue; null si se instaló). Devuelve cómo dejar de escuchar. */
export function alAvisoDeInstalar(f) {
  if (aviso) f(aviso)
  oyentes.add(f)
  return () => oyentes.delete(f)
}

export function avisoUsado() { aviso = null }

// Primeros tramos de la dirección que NO son un local. Espejo de la lista de index.html.
const NO_SON_LOCAL = ['api', 'assets', 'icons', 'locales', 'cuenta', 'pedidos', 'favoritos', 'datos', 'superadmin', 'domiciliario', 'r', 'p', 'cartilla', 'propuesta', 'planes', 'barberia', 'demo-servicios']

/** El slug del local de esta dirección (/su-negocio, /su-negocio/admin…), o '' si no es de un local. */
export function slugDeRuta(pathname) {
  const s = String(pathname || '').split('/')[1] || ''
  return /^[a-z0-9-]{2,60}$/.test(s) && !NO_SON_LOCAL.includes(s) ? s : ''
}

const GENERAL = { manifest: '/manifest.webmanifest', icono: '/icons/apple-touch-icon.png', nombre: 'Appetic' }

/** Apunta la página a la app que toca: la del local (con su nombre e ícono) o la general de Appetic. */
export function ponerAppDe(slug, nombre) {
  const poner = (sel, attr, valor) => document.head.querySelector(sel)?.setAttribute(attr, valor)
  const cambiar = (sel, attr, valor) => { if (document.head.querySelector(sel)?.getAttribute(attr) !== valor) poner(sel, attr, valor) }
  cambiar('link[rel="manifest"]', 'href', slug ? `/${slug}/manifest.webmanifest` : GENERAL.manifest)
  cambiar('link[rel="apple-touch-icon"]', 'href', slug ? `/api/icono?slug=${slug}&t=180&p=apple` : GENERAL.icono)
  cambiar('meta[name="apple-mobile-web-app-title"]', 'content', (slug && nombre) || GENERAL.nombre)
}
