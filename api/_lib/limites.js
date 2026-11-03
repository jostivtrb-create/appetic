// 🚦 Límite de envíos (guía «Blindaje» D4 · S8). Cuenta en limites/{clave} con firebase-admin
// (las reglas no dejan a nadie más leer ni escribir ahí). La clave va con hash: no se guardan IPs.
// Cada doc trae `ttl` para que la política TTL de Firestore lo borre solo al otro día.
import { createHash } from 'node:crypto'

export const LIMITES = {
  qrCelular: { max: 4, minutos: 10 },   // un celular, una mesa
  qrConexion: { max: 20, minutos: 10 }, // toda una conexión (el wifi del local cuenta varias mesas)
  pedidoCelular: { max: 5, minutos: 10 },
}

const hash = t => createHash('sha256').update(String(t)).digest('hex').slice(0, 40)

// true si todavía puede; false si ya se pasó. Si Firestore falla, deja pasar (no se pierde un pedido
// de verdad por un contador).
export async function permitir(db, { Timestamp }, clave, { max, minutos }) {
  const ref = db.collection('limites').doc(hash(clave))
  const ahora = Date.now()
  const ventana = minutos * 60000
  try {
    return await db.runTransaction(async tx => {
      const s = await tx.get(ref)
      const d = s.exists ? s.data() : null
      const vigente = d && ahora - (d.desde || 0) < ventana
      if (vigente && d.n >= max) return false
      tx.set(ref, {
        n: vigente ? d.n + 1 : 1,
        desde: vigente ? d.desde : ahora,
        ttl: Timestamp.fromMillis(ahora + 86400000),
      })
      return true
    })
  } catch (e) {
    console.warn('limites: no se pudo contar', e?.message || e)
    return true
  }
}
