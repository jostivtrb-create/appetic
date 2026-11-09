// 📋 /api/solicitud — las solicitudes de cotización y las VISITAS de la propuesta web de Appetic
// (https://switflysolutions.com/appetic/, página estática en Hostinger) se GUARDAN aquí.
//
// Quién la llena: (a) los vendedores de Swiftfly en la calle, con la foto de la fachada del local,
// su ubicación GPS (control de zonas de venta) y las fotos de la carta y del logo; (b) dueños de
// negocio curiosos, solo con sus datos. Todo queda en Firestore (solicitudes/{id}) y en Storage
// (solicitudes/{id}/…), y se ve en el panel del superadmin (/superadmin → «Solicitudes de
// cotización»). Nada de correo.
//
// Dos registros (guía «Propuesta web» D21–D23):
//   · cotizacion (por defecto): el dueño pidió cotización. Nace con estado 'nueva' y el superadmin la
//     mueve a contactada → cerrada.
//   · visita: el vendedor pasó por un negocio y el dueño NO pidió cotización; se anota para saber el
//     recorrido del día y qué pasó (motivo). Solo la registra un vendedor, con ubicación obligatoria;
//     el celular, el dueño, el tipo y el plan pueden ir vacíos. Se guarda con estado 'visita' y no
//     pasa por los estados de las cotizaciones.
//   Al vendedor SIEMPRE se le exige la ubicación (cotización o visita): es el control de zonas. Al
//   dueño que llena desde su casa, no.
//
//   OPTIONS → 204 con las cabeceras CORS (_lib/cors.js: solo la web de Swiftfly y localhost).
//   POST { id, producto?: 'appetic' | 'barberia', registro: 'cotizacion' | 'visita', origen: 'vendedor' | 'dueno', vendedor, local, dueno,
//          celular, ciudad, barrio, tipo, plan, notas, ubicacion: { lat, lng, precision } | null,
//          motivo: 'no-estaba' | 'ocupados' | 'no-se-dejo-hablar' | 'no-le-intereso' | 'otro' (solo visita),
//          motivoTexto (≤ 300, opcional; típico con 'otro'),
//          fotos: { lugar?, carta?, logo? } (data URL ≤ 1,5 MB), llenadaEn (ISO),
//            · La página nueva solo manda `lugar`: la carta (PDF o varias fotos) y el logo van DESPUÉS,
//              uno por petición a /api/solicitud-archivo (una función acepta ~4,5 MB por cuerpo).
//              `carta` y `logo` se siguen aceptando aquí por compatibilidad con la página vieja.
//          web (HONEYPOT: si trae algo, se responde 200 falso y no se guarda nada) }
//
//   200 { ok, id }                      ← guardada
//   200 { ok, id, repetida: true }      ← ese id ya estaba (reintento de la cola sin señal): no se toca
//   400 { error }                       ← faltan datos
//   403 { error }                       ← origen (Origin) que no es la web de Swiftfly
//   429 { error }                       ← más de LIMITES.solicitud por conexión
//
// El `id` lo genera el navegador: sirve de idempotencia cuando la página reintenta sin señal. Las
// fotos van a Storage con un token de descarga (como las que sube la app) y en el doc queda la URL;
// una foto que falle no tumba la solicitud: se guarda sin ella y se anota en `fotosFallidas`.
// No se guarda la IP, solo su hash (como hace _lib/limites.js).
import { createHash, randomUUID } from 'node:crypto'
import { conAdmin, cuerpo, ipDe } from './_lib/admin.js'
import { permitir, LIMITES } from './_lib/limites.js'
import { cors, origenPermitido } from './_lib/cors.js'
import { cotizar, VALIDEZ_DIAS, PROMO } from '../src/utils/paquetes.js'
import { hoyBogota, sumarDias } from '../src/utils/plan.js'

// 📦 COTIZACIÓN POR PAQUETES (guía «Paquetes de Appetic» D22, D24–D33). Si llegan `paquetes`, el
// servidor calcula el total (nunca el navegador), le da el número consecutivo AP-0001 (contador en
// config/cotizaciones) y la deja «pendiente» con vencimiento a los 15 días. Responde lo necesario
// para mostrar la cotización en la pantalla de quien cotiza. `comentarioVendedor`: solo de vendedor.
const numeroAP = n => `AP-${String(n).padStart(4, '0')}`
// ✂️ BarberIA (guía «Propuesta de Legends» D11, D12, S8): la propuesta de barberías usa este mismo
// formulario con `producto: 'barberia'`. Todo incluido, su propio consecutivo BI-0001 (contador
// config/cotizaciones-barberia) y la misma promo de Appetic.
// Precio (9-nov-2026): cada sede es un plan aparte de $39.900 con 1 barbero incluido, + $10.000 por
// cada barbero adicional. Espejo de BarberIA/src/lib/plan.js y de web/barberia/app.js: si cambia uno,
// cambian los tres.
const PRODUCTOS = ['appetic', 'barberia']
const PLAN_BARBERIA = { base: 39900, incluidos: 1, extra: 10000 }
const precioBarberia = (n, s = 1) => s * PLAN_BARBERIA.base + (Math.max(s * PLAN_BARBERIA.incluidos, n) - s * PLAN_BARBERIA.incluidos) * PLAN_BARBERIA.extra
// Número exacto de barberos (1 a 50). Las páginas viejas mandaban rangos: se toma el piso del rango.
const RANGOS_VIEJOS = { '1-2': 1, '3-5': 3, '6-10': 6, 'mas-10': 11 }
const numBarberos = v => { const n = RANGOS_VIEJOS[v] ?? parseInt(v, 10); return Number.isInteger(n) && n >= 1 && n <= 50 ? n : 0 }
const numeroBI = n => `BI-${String(n).padStart(4, '0')}`
// Número exacto de sedes (1 a 20). Las páginas viejas mandaban '3+': se toma 3.
const numSedes = v => { const n = v === '3+' ? 3 : parseInt(v, 10); return Number.isInteger(n) && n >= 1 && n <= 20 ? n : 0 }
const respuestaCot = (id, d) => ({ ok: true, id, numero: d.numero, paquetes: d.paquetes, total: d.total, ahorro: d.ahorro || 0, promo: d.promo || '', vence: d.venceDia, ...(d.desglose ? { desglose: d.desglose } : {}) })

const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/
const ORIGENES = ['vendedor', 'dueno']
const REGISTROS = ['cotizacion', 'visita']
const MOTIVOS_VISITA = ['no-estaba', 'ocupados', 'no-se-dejo-hablar', 'no-le-intereso', 'otro']
const TIPOS = ['trailer', 'local', 'restaurante', 'barberia']
const PLANES = ['emprendedor', 'comerciante', 'empresario', 'desarrollador', 'no-sabe']
const FOTOS = ['lugar', 'carta', 'logo']
const FOTO_MAX = 1.5 * 1024 * 1024 // bytes ya decodificados
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const texto = (v, max) => String(v ?? '').trim().slice(0, max)
const deLista = (v, lista) => (lista.includes(v) ? v : '')
const hash = t => createHash('sha256').update(String(t)).digest('hex').slice(0, 20)

// { lat, lng, precision } con números de verdad, o null.
function ubicacionDe(u) {
  if (!u || typeof u !== 'object') return null
  const lat = Number(u.lat), lng = Number(u.lng), precision = Number(u.precision)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng, precision: Number.isFinite(precision) && precision >= 0 ? Math.round(precision) : 0 }
}

// La data URL → { contentType, buffer } si es jpeg/png/webp y pesa ≤ 1.5 MB; si no, null.
function decodificarFoto(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ''))
  if (!m) return null
  const buffer = Buffer.from(m[2].replace(/\s/g, ''), 'base64')
  if (!buffer.length || buffer.length > FOTO_MAX) return null
  return { contentType: m[1], buffer }
}

// Sube una foto a solicitudes/{id}/{clave}.{ext} con token de descarga y devuelve su URL pública.
async function subirFoto(bucket, id, clave, { contentType, buffer }) {
  const ruta = `solicitudes/${id}/${clave}.${EXT[contentType]}`
  const token = randomUUID()
  await bucket.file(ruta).save(buffer, {
    resumable: false,
    metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
  })
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media&token=${token}`
}

export default async function handler(req, res) {
  const origin = String(req.headers.origin || '')
  if (!origenPermitido(origin)) return res.status(403).json({ error: 'Origen no permitido' })
  cors(res, origin)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })

  const f = await conAdmin(res)
  if (!f) return
  const { getFirestore, getStorage, FieldValue, Timestamp } = f
  try {
    let b
    try { b = cuerpo(req) } catch { return res.status(400).json({ error: 'El cuerpo no es JSON' }) }
    if (!b || typeof b !== 'object') return res.status(400).json({ error: 'El cuerpo no es JSON' })

    // 🍯 Honeypot: el campo `web` no se ve en la página; si un robot lo llenó, se le dice «ok» y ya.
    if (texto(b.web, 10)) return res.status(200).json({ ok: true })

    const id = texto(b.id, 40)
    if (!ID_VALIDO.test(id)) return res.status(400).json({ error: 'Falta el id de la solicitud' })
    const origen = String(b.origen || '')
    if (!ORIGENES.includes(origen)) return res.status(400).json({ error: 'Falta el origen (vendedor o dueño)' })
    // Sin `registro` (la página vieja no lo manda) es una cotización, como siempre.
    const registro = b.registro == null || b.registro === '' ? 'cotizacion' : String(b.registro)
    if (!REGISTROS.includes(registro)) return res.status(400).json({ error: 'Registro desconocido (cotizacion o visita)' })
    const esVisita = registro === 'visita'
    const producto = deLista(b.producto, PRODUCTOS) || 'appetic'
    const esBarberia = producto === 'barberia'
    const datos = {
      producto,
      registro,
      origen,
      vendedor: texto(b.vendedor, 60),
      local: texto(b.local, 80),
      dueno: texto(b.dueno, 80),
      celular: texto(b.celular, 20),
      ciudad: texto(b.ciudad, 60),
      barrio: texto(b.barrio, 60),
      tipo: deLista(b.tipo, TIPOS),
      plan: deLista(b.plan, PLANES),
      notas: texto(b.notas, 1500),
      ubicacion: ubicacionDe(b.ubicacion),
      motivo: esVisita ? deLista(b.motivo, MOTIVOS_VISITA) : '',
      motivoTexto: esVisita ? texto(b.motivoTexto, 300) : '',
      comentarioVendedor: origen === 'vendedor' && !esVisita ? texto(b.comentarioVendedor, 1000) : '',
      ...(esBarberia ? { barberos: numBarberos(String(b.barberos ?? '')) || '', sedes: numSedes(String(b.sedes ?? '')) || '' } : {}),
    }
    // La página nueva manda los paquetes; la vieja (con `plan`) no.
    const conPaquetes = !esVisita && (esBarberia || Array.isArray(b.paquetes))
    if (!datos.local) return res.status(400).json({ error: 'Falta el nombre del local' })
    // En una visita el dueño no dio su número (no quiso cotización): el celular es opcional.
    if (!esVisita && !datos.celular) return res.status(400).json({ error: 'Falta el celular' })
    if (origen === 'vendedor' && !datos.vendedor) return res.status(400).json({ error: 'Falta el nombre del vendedor' })
    // Control de zonas: lo que registra un vendedor lleva SIEMPRE su ubicación (cotización o visita).
    if (origen === 'vendedor' && !datos.ubicacion) return res.status(400).json({ error: 'Falta la ubicación del vendedor' })
    if (esVisita) {
      if (origen !== 'vendedor') return res.status(400).json({ error: 'Una visita solo la registra un vendedor' })
      if (!datos.motivo) return res.status(400).json({ error: 'Falta el motivo de la visita' })
    }

    const db = getFirestore()
    const ref = db.collection('solicitudes').doc(id)
    // Reintento de la cola sin señal: ya está guardada, no se toca ni gasta cupo.
    const ya = await ref.get()
    if (ya.exists) return res.status(200).json(ya.data().numero ? { ...respuestaCot(id, ya.data()), repetida: true } : { ok: true, id, repetida: true })

    // 🚦 Límite por conexión (guía «Blindaje» D4): nadie llena la base desde un solo sitio.
    const ip = ipDe(req)
    if (!(await permitir(db, f, `sol:${ip}`, LIMITES.solicitud))) {
      return res.status(429).json({ error: 'Demasiadas solicitudes, intenta más tarde' })
    }

    // 📷 Fotos: cada una por su lado; la que falle se anota y la solicitud sigue.
    const fotos = {}
    const fotosFallidas = []
    const pedidas = b.fotos && typeof b.fotos === 'object' ? b.fotos : {}
    const bucket = getStorage().bucket()
    await Promise.all(FOTOS.filter(k => pedidas[k]).map(async k => {
      try {
        const foto = decodificarFoto(pedidas[k])
        if (!foto) throw new Error('no es jpeg/png/webp de hasta 1,5 MB')
        fotos[k] = await subirFoto(bucket, id, k, foto)
      } catch (e) {
        console.warn(`solicitud ${id}: no se subió la foto «${k}»:`, e?.message || e)
        fotosFallidas.push(k)
      }
    }))

    const llenada = new Date(String(b.llenadaEn || ''))
    const doc = {
      ...datos,
      // Las visitas no pasan por nueva → contactada → cerrada: quedan con su propio estado.
      estado: esVisita ? 'visita' : conPaquetes ? 'pendiente' : 'nueva',
      creadaEn: FieldValue.serverTimestamp(),
      llenadaEn: Number.isNaN(llenada.getTime()) ? null : Timestamp.fromDate(llenada),
      fotos,
      ...(fotosFallidas.length ? { fotosFallidas } : {}),
      ipHash: hash(ip),
      userAgent: texto(req.headers['user-agent'], 200),
    }
    if (conPaquetes && esBarberia) {
      const hoy = hoyBogota()
      const s = doc.sedes || 1, n = Math.max(doc.barberos || PLAN_BARBERIA.incluidos, s * PLAN_BARBERIA.incluidos)
      const total = precioBarberia(n, s)
      Object.assign(doc, { paquetes: ['barberia'], suma: total, total, ahorro: 0, desglose: { ...PLAN_BARBERIA, barberos: n, sedes: s }, promo: hoy <= PROMO.hasta ? PROMO.texto : '', venceDia: sumarDias(hoy, VALIDEZ_DIAS) })
    } else if (conPaquetes) {
      const hoy = hoyBogota()
      const c = cotizar(b.paquetes, hoy)
      Object.assign(doc, { paquetes: c.paquetes, suma: c.suma, total: c.total, ahorro: c.ahorro, promo: c.promo, venceDia: sumarDias(hoy, VALIDEZ_DIAS) })
    }
    try {
      if (!conPaquetes) await ref.create(doc)
      else {
        // El número sale de un contador en la MISMA transacción: dos cotizaciones a la vez no se repiten.
        const contador = db.collection('config').doc(esBarberia ? 'cotizaciones-barberia' : 'cotizaciones')
        await db.runTransaction(async tx => {
          const n = ((await tx.get(contador)).data()?.ultimo || 0) + 1
          doc.numero = esBarberia ? numeroBI(n) : numeroAP(n)
          tx.create(ref, doc)
          tx.set(contador, { ultimo: n }, { merge: true })
        })
      }
    } catch (e) {
      // Dos reintentos a la vez con el mismo id: ganó el otro.
      if (e?.code === 6 || /ALREADY_EXISTS/i.test(String(e?.message))) {
        const otro = (await ref.get()).data()
        return res.status(200).json(otro?.numero ? { ...respuestaCot(id, otro), repetida: true } : { ok: true, id, repetida: true })
      }
      throw e
    }
    return res.status(200).json(conPaquetes ? respuestaCot(id, doc) : { ok: true, id })
  } catch (err) {
    console.error('solicitud:', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}
