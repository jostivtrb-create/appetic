// 🧾 Subir el comprobante del pago con el link del negocio (api/comprobante.js).
// En la demo no hay servidor: la foto (pequeña) queda en el pedido de ejemplo del navegador.
import { comprimirImagen } from '../utils/imageCompressor'
import { tokenAppCheck } from '../config/firebase'

const aDataUrl = blob => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(r.result)
  r.onerror = () => rej(new Error('No se pudo leer la foto'))
  r.readAsDataURL(blob)
})

// Devuelve la foto lista para mandar: data URL comprimida (lo legible de un comprobante cabe en 1400 px).
export async function fotoComprobante(file, { demo = false } = {}) {
  const { blob } = await comprimirImagen(file, demo ? { maxLado: 700, calidad: 0.6 } : { maxLado: 1400, calidad: 0.8 })
  return aDataUrl(blob)
}

export async function enviarComprobante(localId, pedidoId, foto) {
  const token = await Promise.race([tokenAppCheck().catch(() => ''), new Promise(res => setTimeout(() => res(''), 4000))])
  let r
  try {
    r = await fetch('/api/comprobante', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Firebase-AppCheck': token } : {}) },
      body: JSON.stringify({ localId, pedidoId, foto }),
    })
  } catch { throw new Error('No hay internet. Intenta de nuevo.') }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || 'No se pudo subir el comprobante')
  return data
}
