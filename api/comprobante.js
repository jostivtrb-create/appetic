// 🧾 POST /api/comprobante — el cliente sube la foto del comprobante de su pago con el link del negocio.
//
// El negocio cobra con SU link (Bold, Wompi, Mercado Pago…: Configuración → Cuentas y pagos) y
// Appetic solo lleva la foto al pedido para que el local la vea antes de confirmarlo. El cliente no
// tiene sesión: el id del pedido (largo, al azar, solo va en su link de «Mi pedido») es la prueba de
// que es suyo, igual que para leer pedidosPublicos.
//
//   body: { localId, pedidoId, foto: data URL jpeg/png/webp ≤ 1,5 MB }
//   200 { ok }   4xx { error, motivo }
//
// La foto va a comprobantes/{localId}/{pedidoId}.{ext}, FUERA de locales/ (que se lee y se lista
// en público): por las reglas nadie la lee; se abre solo con la URL con token que queda en el pedido
// privado. pedidosPublicos solo recibe `comprobante: true` para que el cliente vea «Enviado».
import { randomUUID } from 'node:crypto'
import { conAdmin, cuerpo, ipDe, revisarAppCheck } from './_lib/admin.js'
import { permitir, LIMITES } from './_lib/limites.js'

const FOTO_MAX = 1.5 * 1024 * 1024
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/
const MAX_CAMBIOS = 3 // puede cambiar la foto si se equivocó, pero no sin fin
const ABIERTOS = ['nuevo', 'en-cocina', 'listo', 'en-camino']

function decodificarFoto(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ''))
  if (!m) return null
  const buffer = Buffer.from(m[2].replace(/\s/g, ''), 'base64')
  if (!buffer.length || buffer.length > FOTO_MAX) return null
  return { contentType: m[1], buffer }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })
  const f = await conAdmin(res)
  if (!f) return
  const { getFirestore, getStorage, FieldValue } = f
  try {
    const ac = await revisarAppCheck(f, req)
    if (ac.bloquear) return res.status(401).json({ error: 'App no verificada', motivo: 'appcheck' })

    const b = cuerpo(req)
    const localId = String(b.localId || '').slice(0, 80)
    const pedidoId = String(b.pedidoId || '')
    if (!localId || !ID_VALIDO.test(pedidoId)) return res.status(400).json({ error: 'Faltan datos', motivo: 'datos' })
    const foto = decodificarFoto(b.foto)
    if (!foto) return res.status(400).json({ error: 'La foto debe ser una imagen de hasta 1,5 MB', motivo: 'foto' })

    const db = getFirestore()
    if (!(await permitir(db, f, `comprobante:${ipDe(req)}`, LIMITES.comprobante))) {
      return res.status(429).json({ error: 'Espera un momento antes de volver a subirlo', motivo: 'limite' })
    }
    const ref = db.collection('locales').doc(localId).collection('pedidos').doc(pedidoId)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'No encontramos el pedido', motivo: 'datos' })
    const p = snap.data()
    if (!p.pagoLink) return res.status(400).json({ error: 'Este pedido no se paga con link', motivo: 'datos' })
    if (!ABIERTOS.includes(p.estado)) return res.status(409).json({ error: 'El pedido ya se cerró', motivo: 'cerrado' })
    if ((p.comprobanteVeces || 0) >= MAX_CAMBIOS) return res.status(409).json({ error: 'Ya cambiaste el comprobante varias veces. Escríbele al local por WhatsApp.', motivo: 'veces' })

    const bucket = getStorage().bucket()
    const ruta = `comprobantes/${localId}/${pedidoId}.${EXT[foto.contentType]}`
    const token = randomUUID()
    await bucket.file(ruta).save(foto.buffer, {
      resumable: false,
      metadata: { contentType: foto.contentType, metadata: { firebaseStorageDownloadTokens: token } },
    })
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media&token=${token}`

    const ahora = FieldValue.serverTimestamp()
    const batch = db.batch()
    batch.update(ref, { comprobanteUrl: url, comprobanteEn: ahora, comprobanteVeces: FieldValue.increment(1) })
    batch.update(ref.parent.parent.collection('pedidosPublicos').doc(pedidoId), { comprobante: true, comprobanteEn: ahora })
    await batch.commit()
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('comprobante:', e)
    return res.status(500).json({ error: 'No se pudo subir el comprobante', motivo: 'servidor' })
  }
}
