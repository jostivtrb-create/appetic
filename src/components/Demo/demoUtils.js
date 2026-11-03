// 🍔 Utilidades de la DEMO para clientes (guía «Demo de clientes»).
import { urlWhatsApp } from '../../utils/whatsapp'
import { avisarDemoInteresado } from '../../services/demo'
import { WHATSAPP_VENTAS, origenValido } from '../../config/demo'

// «Quiero esto para mi negocio» → WhatsApp de ventas de Swiftfly, y se cuenta el clic por origen
// (D18 · D22). Lo cuenta el servidor fuera del local: el reinicio de la demo ya no lo borra.
export function quieroEsto() {
  avisarDemoInteresado(origenDemo())
  const url = urlWhatsApp(WHATSAPP_VENTAS, '¡Hola! Probé la demo de Appetic y quiero esto para mi negocio 🍔')
  if (/^whatsapp:/.test(url)) window.location.href = url
  else window.open(url, '_blank', 'noopener')
}

// En la vista previa (?preview=1, solo en mi PC) los saltos de la demo conservan el modo preview.
export function conPreview(url) {
  if (!new URLSearchParams(window.location.search).has('preview')) return url
  return url + (url.includes('?') ? '&' : '?') + 'preview=1'
}

// ¿Ya vio la bienvenida en esta visita? (por pestaña: si vuelve otro día, la ve otra vez)
const CLAVE_BIENVENIDA = 'appetic_demo_bienvenida'
export const yaVioBienvenida = () => { try { return sessionStorage.getItem(CLAVE_BIENVENIDA) === '1' } catch { return false } }
export const marcarBienvenida = () => { try { sessionStorage.setItem(CLAVE_BIENVENIDA, '1') } catch { /* nada */ } }
export const olvidarBienvenida = () => { try { sessionStorage.removeItem(CLAVE_BIENVENIDA) } catch { /* nada */ } }

// 📈 De dónde llegó (D22): el `?origen=` del link con que abrió la demo. Se recuerda en la pestaña
// mientras navega (los saltos internos no lo llevan).
const CLAVE_ORIGEN = 'appetic_demo_origen'
export function origenDemo() {
  const deUrl = new URLSearchParams(window.location.search).get('origen')
  try {
    if (deUrl) sessionStorage.setItem(CLAVE_ORIGEN, origenValido(deUrl))
    return sessionStorage.getItem(CLAVE_ORIGEN) || 'directo'
  } catch { return origenValido(deUrl) }
}
// Una visita por aparato y por día (como las visitas de los locales).
export function visitaNuevaHoy() {
  const d = new Date()
  const clave = `appetic_demo_visita_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  try {
    if (localStorage.getItem(clave)) return false
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith('appetic_demo_visita_')) localStorage.removeItem(k)
    }
    localStorage.setItem(clave, '1')
  } catch { /* sin localStorage: cuenta igual */ }
  return true
}
