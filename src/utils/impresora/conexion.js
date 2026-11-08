// 🖨️ CÓMO llega el documento a la impresora, sin instalar nada (guía «Mejoras frente a Loggro» S8).
//
// La conexión es de CADA APARATO (la tablet de la cocina, el PC de la caja): se recuerda en ese
// navegador, no en la base de datos. Caminos, de más a menos automático:
//   usb        WebUSB (Chrome en Android con cable OTG, o PC). En Windows el controlador de la
//              impresora a veces no la suelta: ahí sirve «serial» o «navegador».
//   serial     Web Serial (Chrome de PC): impresoras USB-serie y Bluetooth ya emparejadas.
//   bluetooth  Web Bluetooth (Chrome en Android o PC): impresoras Bluetooth «BLE».
//   navegador  el «Imprimir» de siempre, con cualquier impresora instalada. Muestra su ventana.
// Lo automático (comanda que sale sola, ticket al cobrar) solo funciona con los tres primeros.
import { aEscpos } from './escpos.js'
import { imprimirEnNavegador } from './html.js'

const CLAVE = localId => `appetic_impresora_${localId}`
export function prefsDe(localId) {
  try { return JSON.parse(localStorage.getItem(CLAVE(localId)) || 'null') || {} } catch { return {} }
}
export function guardarPrefs(localId, prefs) {
  try { localStorage.setItem(CLAVE(localId), JSON.stringify(prefs)) } catch { /* nada */ }
}

export const soporta = () => ({
  usb: typeof navigator !== 'undefined' && !!navigator.usb,
  serial: typeof navigator !== 'undefined' && !!navigator.serial,
  bluetooth: typeof navigator !== 'undefined' && !!navigator.bluetooth,
})

// Servicios BLE que usan las impresoras térmicas más comunes.
const SERVICIOS_BLE = [
  '000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb', '0000fee7-0000-1000-8000-00805f9b34fb',
]

// La conexión abierta en esta pestaña: { metodo, enviar(bytes), nombre }.
let abierta = null
export const conectada = () => abierta

async function abrirUsb(device) {
  if (!device.opened) await device.open()
  if (!device.configuration) await device.selectConfiguration(1)
  // La interfaz de impresora (clase 7) o, si no, la primera con salida de datos.
  const ifaces = device.configuration.interfaces
  const elegir = ifaces.find(i => i.alternate.interfaceClass === 7) || ifaces.find(i => i.alternate.endpoints.some(e => e.direction === 'out'))
  if (!elegir) throw new Error('usb-sin-salida')
  if (!elegir.claimed) await device.claimInterface(elegir.interfaceNumber)
  const ep = elegir.alternate.endpoints.find(e => e.direction === 'out')
  return { metodo: 'usb', nombre: device.productName || 'Impresora USB', enviar: async bytes => {
    for (let i = 0; i < bytes.length; i += 4096) await device.transferOut(ep.endpointNumber, bytes.slice(i, i + 4096))
  } }
}

async function abrirSerial(port) {
  if (!port.writable) await port.open({ baudRate: 9600 })
  return { metodo: 'serial', nombre: 'Impresora (puerto serie)', enviar: async bytes => {
    const w = port.writable.getWriter()
    try { await w.write(bytes) } finally { w.releaseLock() }
  } }
}

async function abrirBluetooth(device) {
  const gatt = device.gatt.connected ? device.gatt : await device.gatt.connect()
  let car = null
  for (const s of await gatt.getPrimaryServices()) {
    for (const c of await s.getCharacteristics()) if (c.properties.writeWithoutResponse || c.properties.write) { car = c; break }
    if (car) break
  }
  if (!car) throw new Error('ble-sin-salida')
  return { metodo: 'bluetooth', nombre: device.name || 'Impresora Bluetooth', enviar: async bytes => {
    // De a pedacitos: el Bluetooth de estas impresoras no recibe más de ~100 bytes por envío.
    for (let i = 0; i < bytes.length; i += 100) {
      const trozo = bytes.slice(i, i + 100)
      if (car.properties.writeWithoutResponse) await car.writeValueWithoutResponse(trozo)
      else await car.writeValueWithResponse(trozo)
      await new Promise(r => setTimeout(r, 20))
    }
  } }
}

// Elegir impresora: abre la ventana del navegador para escoger el aparato (necesita un toque).
export async function conectar(metodo) {
  if (metodo === 'usb') abierta = await abrirUsb(await navigator.usb.requestDevice({ filters: [{ classCode: 7 }, { classCode: 0xff }] }))
  else if (metodo === 'serial') abierta = await abrirSerial(await navigator.serial.requestPort())
  else if (metodo === 'bluetooth') abierta = await abrirBluetooth(await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICIOS_BLE }))
  else abierta = { metodo: 'navegador', nombre: 'Imprimir del navegador', enviar: null }
  return abierta
}

// Al abrir la pantalla: vuelve a la impresora que ya tenía permiso, sin preguntar.
// El Bluetooth casi nunca deja (pide un toque): devuelve null y la pantalla ofrece «Reconectar».
export async function reconectar(metodo) {
  if (abierta?.metodo === metodo) return abierta
  try {
    if (metodo === 'usb' && navigator.usb) { const [d] = await navigator.usb.getDevices(); if (d) abierta = await abrirUsb(d) }
    else if (metodo === 'serial' && navigator.serial) { const [p] = await navigator.serial.getPorts(); if (p) abierta = await abrirSerial(p) }
    else if (metodo === 'bluetooth' && navigator.bluetooth?.getDevices) { const [d] = await navigator.bluetooth.getDevices(); if (d) abierta = await abrirBluetooth(d) }
    else if (metodo === 'navegador') abierta = { metodo: 'navegador', nombre: 'Imprimir del navegador', enviar: null }
  } catch { abierta = null }
  return abierta?.metodo === metodo ? abierta : null
}

export function desconectar() { abierta = null }

// Imprime un documento. `ventana`: para el camino «navegador», abierta en el toque.
// `soloDirecto`: lo automático no abre ventanas (si no hay impresora directa, no hace nada).
export async function imprimir(doc, ancho, { ventana = null, soloDirecto = false } = {}) {
  if (abierta?.enviar) {
    try { await abierta.enviar(aEscpos(doc, ancho)); return 'impreso' }
    catch (e) { abierta = null; ventana?.close(); throw Object.assign(new Error('se-desconecto'), { causa: e }) }
  }
  if (soloDirecto) { ventana?.close(); return 'sin-impresora' }
  imprimirEnNavegador(doc, ancho, ventana)
  return 'navegador'
}

export function motivoImpresora(e) {
  const m = e?.message || '', n = e?.name || ''
  if (n === 'NotFoundError') return 'No se eligió ninguna impresora.'
  if (n === 'SecurityError' || n === 'NotAllowedError') return 'El navegador no dio permiso. Intenta de nuevo y acepta.'
  if (m === 'usb-sin-salida' || n === 'NetworkError' || /claim/i.test(m)) return 'Esta impresora no deja conectarse por USB desde el navegador (pasa en Windows con su controlador instalado). Prueba «Cable (puerto serie)» o «Imprimir del navegador».'
  if (m === 'ble-sin-salida') return 'Esa impresora Bluetooth no recibe datos de esta forma. Prueba otra conexión.'
  if (m === 'se-desconecto') return 'La impresora se desconectó. Revisa que esté prendida y vuelve a conectarla.'
  if (m === 'ventana-bloqueada') return 'Permite las ventanas emergentes para imprimir.'
  return 'No se pudo imprimir. Revisa que la impresora esté prendida y conectada.'
}
