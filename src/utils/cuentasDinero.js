// 💳 CUENTAS DE DINERO del local (guía «Cuentas del negocio», D7 + D21).
//
// Es UNA sola lista: `local.pagos`, la misma que ya usaba el checkout, ampliada. Cada cuenta es a
// la vez un medio de pago (lo que escoge el cliente o el cajero) y un bolsillo con saldo (lo que
// ve el dueño en Cuentas). El dueño crea las que quiera: Efectivo, Nequi, Bold, Daviplata, el banco…
//
//   { id, nombre, tipo: 'efectivo' | 'transferencia' | 'datafono' | 'otro', llave?, link?, alCliente }
//
// `link`: el link de pago del propio negocio (Bold, Wompi, Mercado Pago, su banco…). Si el cliente
// escoge esa cuenta, en «Mi pedido» le sale «Pagar» con ese link y «Subir comprobante». Appetic no
// toca la plata: cada negocio pone el link que quiera.
//
import { tiene } from './plan.js'

// `alCliente` (por defecto sí): si sale en el checkout del cliente. Una cuenta «Banco» donde se
// consigna puede existir solo para el dueño. Los SALDOS no viven aquí (el documento del local es
// público): van en locales/{id}/resumen/saldos.

export const TIPOS_CUENTA = [
  { id: 'efectivo', nombre: 'Efectivo', emoji: '💵' },
  { id: 'transferencia', nombre: 'Transferencia', emoji: '📱' },
  { id: 'datafono', nombre: 'Tarjeta / datáfono', emoji: '💳' },
  { id: 'otro', nombre: 'Otra', emoji: '🏦' },
]

export const emojiCuenta = c => TIPOS_CUENTA.find(t => t.id === c?.tipo)?.emoji || '🏦'

const EFECTIVO = { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo', alCliente: true }

// Todas las cuentas del local. Nunca vacía: sin configurar, al menos hay Efectivo.
export function cuentasDe(local) {
  const l = (local?.pagos || []).filter(c => c?.id).map(c => ({ ...c, alCliente: c.alCliente !== false }))
  return l.length ? l : [EFECTIVO]
}

// Las que ve el cliente en el checkout.
export const cuentasCliente = local => cuentasDe(local).filter(c => c.alCliente)

// La cuenta del efectivo (para vueltas y para el gasto por defecto). La primera de tipo efectivo.
export const cuentaEfectivo = local => cuentasDe(local).find(c => c.tipo === 'efectivo') || cuentasDe(local)[0]

export const nombreCuenta = (local, id) => cuentasDe(local).find(c => c.id === id)?.nombre || 'Cuenta borrada'

// Id ascii desde el nombre, sin repetir los que ya existen («Bold» → 'bold', otra «Bold» → 'bold-2').
export function idCuentaNueva(nombre, existentes) {
  const base = String(nombre || '').toLowerCase().normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cuenta'
  const usados = new Set(existentes.map(c => c.id))
  let id = base, n = 2
  while (usados.has(id)) id = `${base}-${n++}`
  return id
}

// De dónde puede SALIR plata para un gasto, la nómina o un retiro: no del datáfono (solo recibe;
// esa plata se mueve al banco con «Mover entre cuentas»). Auditoría «cuentas» H8.
export const cuentasParaPagar = local => {
  const l = cuentasDe(local).filter(c => c.tipo !== 'datafono')
  return l.length ? l : cuentasDe(local)
}

// ¿Es un link de pago que se puede abrir? Solo https y sin espacios (lo pega el dueño).
export const linkPagoValido = url => /^https:\/\/[^\s]{4,300}$/.test(String(url || '').trim())

// El link de pago de una cuenta (o '' si no tiene). Lo usan el servidor y el motor demo al crear el
// pedido: el link sale del documento del local, nunca de lo que mande el navegador.
// Viene con el Paquete Domicilios (decisión del usuario, 8-nov): sin ese paquete no hay link.
export const usaLinkPago = local => tiene(local, 'domicilios')
export function linkDeCuenta(local, id) {
  if (!usaLinkPago(local)) return ''
  const c = cuentasDe(local).find(x => x.id === id)
  return c && c.tipo !== 'efectivo' && linkPagoValido(c.link) ? String(c.link).trim() : ''
}
