// 📎 /api/solicitud-archivo — los ARCHIVOS de una solicitud de cotización (guía «Propuesta web»):
// la carta del local (un PDF o varias fotos) y el logo. Se suben DESPUÉS de crear la solicitud en
// /api/solicitud, uno por petición.
//
// ¿Por qué va aparte? Una función de Vercel acepta cuerpos de ~4,5 MB. Mandar la carta en PDF (o
// cinco fotos) dentro de la misma petición de la solicitud la reventaría y se perdería todo; en
// cambio, cada archivo va solo: el que falle se reintenta sin tocar lo demás, y la solicitud ya
// quedó guardada con los datos del dueño aunque no llegue ni un archivo.
//
//   OPTIONS → 204 con las cabeceras CORS (_lib/cors.js: los mismos orígenes que /api/solicitud).
//   POST { id, clave: 'carta' | 'logo', nombre (≤ 80, nombre del archivo original),
//          data: data URL de image/jpeg|png|webp o application/pdf, ≤ 3,5 MB ya decodificado }
//          (en la práctica la página debe mandar ≤ ~3 MB: el base64 pesa un tercio más y el
//           cuerpo entero tiene que caber en los 4,5 MB de Vercel).
//
//   200 { ok, url }                 ← subido; el doc queda con la entrada en `archivos`
//   400 { error }                   ← falta el id/clave, o el archivo no es jpeg/png/webp/pdf de ≤ 3,5 MB
//   403 { error }                   ← origen (Origin) que no es la web de Swiftfly
//   404 { error }                   ← la solicitud no existe o se creó hace más de 2 horas
//   409 { error }                   ← esa solicitud ya tiene 8 archivos
//   429 { error }                   ← más de LIMITES.archivo por conexión
//
// Storage: solicitudes/{id}/{clave}-{n}.{jpg|png|webp|pdf} (n = los que ya hay de esa clave + 1), con
// token de descarga como las fotos de /api/solicitud. Firestore: solicitudes/{id}.archivos recibe
// { clave, nombre, url, tipo: 'imagen' | 'pdf', bytes, en } con arrayUnion; el panel del superadmin
// los agrupa por clave. No se guarda la IP, solo su hash (como _lib/limites.js).
import { randomUUID } from 'node:crypto'
import { conAdmin, cuerpo, ipDe } from './_lib/admin.js'
import { permitir, LIMITES } from './_lib/limites.js'
import { cors, origenPermitido } from './_lib/cors.js'

const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/ // el mismo de /api/solicitud
const CLAVES = ['carta', 'logo']
const MAX_ARCHIVOS = 8          // por solicitud, sumando carta y logo
const VENTANA_MS = 2 * 3600000  // solo se adjunta a una solicitud recién creada
const BYTES_MAX = 3.5 * 1024 * 1024 // ya decodificado
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }

// El nombre original, sin caracteres de control ni barras (es solo para mostrarlo en el panel).
const nombreDe = v => String(v ?? '').replace(/[\u0000-\u001f\u007f/\\]/g, '').trim().slice(0, 80)

// La data URL → { contentType, buffer, tipo } si es imagen (jpeg/png/webp) o PDF de ≤ 3,5 MB; si no, null.
function decodificar(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ''))
  if (!m) return null
  const buffer = Buffer.from(m[2].replace(/\s/g, ''), 'base64')
  if (!buffer.length || buffer.length > BYTES_MAX) return null
  const contentType = m[1]
  // Un PDF de verdad empieza por «%PDF-»; si no, alguien le cambió la etiqueta a otra cosa.
  if (contentType === 'application/pdf' && !buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) return null
  return { contentType, buffer, tipo: contentType === 'application/pdf' ? 'pdf' : 'imagen' }
}

// Sube a solicitudes/{id}/{clave}-{n}.{ext}. Si dos archivos llegan a la vez y calculan el mismo n,
// el segundo corre el número hasta una ruta libre: nunca se pisa un archivo ya subido.
async function subir(bucket, id, clave, n, { contentType, buffer }) {
  let ruta
  for (let i = n; ; i++) {
    ruta = `solicitudes/${id}/${clave}-${i}.${EXT[contentType]}`
    const [existe] = await bucket.file(ruta).exists()
    if (!existe) break
  }
  const token = randomUUID()
  await bucket.file(ruta).save(buffer, {
    resumable: false,
    metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
  })
  return { ruta, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media&token=${token}` }
}

const archivosDe = d => (Array.isArray(d?.archivos) ? d.archivos : [])

export default async function handler(req, res) {
  const origin = String(req.headers.origin || '')
  if (!origenPermitido(origin)) return res.status(403).json({ error: 'Origen no permitido' })
  cors(res, origin)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })

  const f = await conAdmin(res)
  if (!f) return
  const { getFirestore, getStorage, FieldValue } = f
  try {
    let b
    try { b = cuerpo(req) } catch { return res.status(400).json({ error: 'El cuerpo no es JSON' }) }
    if (!b || typeof b !== 'object') return res.status(400).json({ error: 'El cuerpo no es JSON' })

    const id = String(b.id ?? '').trim().slice(0, 40)
    if (!ID_VALIDO.test(id)) return res.status(400).json({ error: 'Falta el id de la solicitud' })
    const clave = String(b.clave || '')
    if (!CLAVES.includes(clave)) return res.status(400).json({ error: 'Falta la clave (carta o logo)' })
    const archivo = decodificar(b.data)
    if (!archivo) return res.status(400).json({ error: 'El archivo debe ser JPG, PNG, WebP o PDF de hasta 3,5 MB' })

    const db = getFirestore()
    // 🚦 Límite por conexión, antes de mirar la base: nadie tantea ids ni llena Storage desde un solo sitio.
    const ip = ipDe(req)
    if (!(await permitir(db, f, `arch:${ip}`, LIMITES.archivo))) {
      return res.status(429).json({ error: 'Demasiados archivos, intenta más tarde' })
    }

    // La solicitud tiene que existir y ser reciente: los archivos se adjuntan justo después de crearla.
    const ref = db.collection('solicitudes').doc(id)
    const snap = await ref.get()
    const d = snap.exists ? snap.data() : null
    const creadaMs = d?.creadaEn?.toMillis?.() ?? null
    if (!d || creadaMs == null || Date.now() - creadaMs > VENTANA_MS) {
      return res.status(404).json({ error: 'Solicitud no encontrada' })
    }
    const existentes = archivosDe(d)
    if (existentes.length >= MAX_ARCHIVOS) return res.status(409).json({ error: 'Ya hay demasiados archivos' })

    const n = existentes.filter(a => a?.clave === clave).length + 1
    const { ruta, url } = await subir(getStorage().bucket(), id, clave, n, archivo)
    const entrada = {
      clave,
      nombre: nombreDe(b.nombre) || ruta.split('/').pop(),
      url,
      tipo: archivo.tipo,
      bytes: archivo.buffer.length,
      en: Date.now(),
    }

    // Se anota en una transacción que vuelve a contar: si entre medias otro archivo completó los 8,
    // este no entra y se borra lo que acaba de subir.
    const cupo = await db.runTransaction(async tx => {
      const s = await tx.get(ref)
      if (!s.exists || archivosDe(s.data()).length >= MAX_ARCHIVOS) return false
      tx.update(ref, { archivos: FieldValue.arrayUnion(entrada) })
      return true
    })
    if (!cupo) {
      await getStorage().bucket().file(ruta).delete().catch(() => {})
      return res.status(409).json({ error: 'Ya hay demasiados archivos' })
    }
    return res.status(200).json({ ok: true, url })
  } catch (err) {
    console.error('solicitud-archivo:', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}
