// 🍳📺 POST /api/tv-cocina — la TV de COMANDAS (link fijo como el TV del menú, solo de cocina).
//
// El TV del menú es público porque el menú lo es. Las comandas NO (mesa, nombres, lo que pidió cada
// quien): solo las lee el personal. Por eso el link de la TV de cocina lleva una CLAVE:
//   appetic.vercel.app/<slug>/cocina?k=<clave>
// El TV no inicia sesión con Google: entrega la clave aquí y recibe una sesión de Firebase propia
// (token personalizado) que SOLO puede leer las comandas de su local (firestore.rules → esTVCocina).
// Tachar y entregar se sigue haciendo desde los celulares (pantalla de Comandas): el TV solo mira.
//
//   { accion: 'entrar', slug, k }   (el TV, sin sesión)       → 200 { token, localId }
//   { accion: 'link', localId }     (el dueño, con su sesión) → 200 { clave }   (la crea si no hay)
//   { accion: 'cambiar', localId }  (el dueño, con su sesión) → 200 { clave }   (la anterior deja de servir)
//
// Dónde vive:
//   locales/{id}/privado/tvCocina = { clave, ver }   ← sin regla en firestore.rules: nadie la lee desde la app
//   locales/{id}.tvCocina          = { ver }          ← público, no es secreto: el TV con una versión vieja
//                                                       queda por fuera apenas el dueño cambia el link.
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { conAdmin, cuerpo, sesionDe, SUPERADMINS } from './_lib/admin.js'
import { estadoPago, tiene } from '../src/utils/plan.js'

const CLAVE_VALIDA = /^[A-Za-z0-9_-]{20,64}$/
const nuevaClave = () => randomBytes(18).toString('base64url') // 24 caracteres, 144 bits

function iguales(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })
  const f = await conAdmin(res)
  if (!f) return
  const db = f.getFirestore()

  try {
    const { accion, slug, k, localId } = cuerpo(req)

    // 📺 El TV entra con la clave del link.
    if (accion === 'entrar') {
      if (!slug || !CLAVE_VALIDA.test(String(k || ''))) return res.status(400).json({ error: 'Link incompleto', motivo: 'clave' })
      const q = await db.collection('locales').where('slug', '==', String(slug).toLowerCase()).limit(1).get()
      if (q.empty) return res.status(404).json({ error: 'Este local no existe', motivo: 'no-existe' })
      const localRef = q.docs[0].ref
      const local = q.docs[0].data()
      const priv = (await localRef.collection('privado').doc('tvCocina').get()).data()
      if (!priv?.clave || !iguales(priv.clave, k)) return res.status(403).json({ error: 'Este link ya no sirve', motivo: 'clave' })
      if (estadoPago(local).estado === 'cortado') return res.status(403).json({ error: 'Local fuera de servicio', motivo: 'cortado' })
      if (!tiene(local, 'cocina')) return res.status(403).json({ error: 'Sin pantalla de cocina en el plan', motivo: 'plan' })
      // Un usuario fijo por local: el TV no se mezcla con nadie y no crea cuentas nuevas cada vez.
      const token = await f.getAuth().createCustomToken(`tvcocina-${localRef.id}`, { tvCocina: localRef.id, tvVer: priv.ver })
      return res.status(200).json({ token, localId: localRef.id })
    }

    // 🔑 El dueño pide (o cambia) el link desde su panel.
    if (accion === 'link' || accion === 'cambiar') {
      const quien = await sesionDe(f, req)
      if (!quien?.email) return res.status(401).json({ error: 'Sin sesión' })
      if (!localId) return res.status(400).json({ error: 'Faltan datos' })
      const email = String(quien.email).toLowerCase()
      const localRef = db.collection('locales').doc(String(localId))
      const snap = await localRef.get()
      if (!snap.exists) return res.status(404).json({ error: 'No existe' })
      const local = snap.data()
      const admins = (local.admins || []).map(e => String(e).toLowerCase())
      if (!admins.includes(email) && !SUPERADMINS.includes(email)) return res.status(403).json({ error: 'Solo el dueño del local' })
      if (!tiene(local, 'cocina')) return res.status(403).json({ error: 'Tu plan no trae pantalla de cocina', motivo: 'plan' })

      const privRef = localRef.collection('privado').doc('tvCocina')
      const clave = await db.runTransaction(async tx => {
        const priv = (await tx.get(privRef)).data()
        if (accion === 'link' && priv?.clave) return priv.clave
        const ver = (Number(priv?.ver) || 0) + 1
        const c = nuevaClave()
        tx.set(privRef, { clave: c, ver, cambiadaEn: f.FieldValue.serverTimestamp(), cambiadaPor: email })
        tx.update(localRef, { tvCocina: { ver } })
        return c
      })
      return res.status(200).json({ clave })
    }

    return res.status(400).json({ error: 'Acción desconocida' })
  } catch (e) {
    console.error('tv-cocina', e)
    return res.status(500).json({ error: 'No se pudo', detalle: String(e?.message || e).slice(0, 200) })
  }
}
