// 🍔 Utilidades de la DEMO para clientes (guía «Demo de clientes»).
import { urlWhatsApp } from '../../utils/whatsapp'
import { registrarInteresado } from '../../services/stats'
import { WHATSAPP_VENTAS } from '../../config/demo'

// «Quiero esto para mi negocio» → WhatsApp de ventas de Swiftfly, y se cuenta el clic (D18).
export function quieroEsto(local) {
  if (local?.id) registrarInteresado(local.id)
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
