// ✈️ Alta del local "Pilotos Burger House" en Firestore.
// Uso: node scripts/seed-pilotos.mjs
// Requiere: scripts/serviceAccount.json (llave de servicio de Firebase, NO se sube a git).
//
// Los datos del menú viven en src/dev/pilotos.js (fuente única, compartida con ?preview=1).
// Aquí solo los escribimos en Firestore. Volver a correrlo NO duplica: actualiza (merge).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { SLUG, ADMIN_EMAIL, PILOTOS_LOCAL, PILOTOS_PRODUCTOS } from '../src/dev/pilotos.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Campos que el DUEÑO configura desde el panel: si el local ya existe con ellos,
// el seed NO los pisa (la ubicación, el WhatsApp y el horario son suyos).
const CAMPOS_DEL_DUENO = ['ubicacion', 'whatsapp', 'horario']

async function run() {
  const { id, ...localData } = PILOTOS_LOCAL
  const localRef = db.collection('locales').doc(SLUG)

  const prev = await localRef.get()
  if (prev.exists) {
    const data = prev.data() || {}
    for (const campo of CAMPOS_DEL_DUENO) {
      if (data[campo]) delete localData[campo]
    }
  }

  await localRef.set(localData, { merge: true })
  console.log(`✓ Local ${prev.exists ? 'actualizado' : 'creado'}: locales/${SLUG} (${PILOTOS_LOCAL.nombre})`)

  for (const p of PILOTOS_PRODUCTOS) {
    const { id: pid, ...data } = p
    // No pisar con '' la foto que el dueño haya subido desde el panel.
    if (!data.foto) delete data.foto
    await localRef.collection('productos').doc(pid).set(data, { merge: true })
  }
  console.log(`✓ ${PILOTOS_PRODUCTOS.length} productos cargados`)

  console.log(`\n🔗 Link del local: /${SLUG}`)
  console.log(`🔐 Admin: ${ADMIN_EMAIL} → /${SLUG}/admin`)
  console.log('📲 El WhatsApp de pedidos quedó pre-cargado; el dueño lo confirma/cambia desde el panel.')
  process.exit(0)
}

run().catch(err => { console.error('Error en el seed:', err); process.exit(1) })
