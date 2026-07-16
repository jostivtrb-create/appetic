// 🌱 Alta del local "[[NOMBRE]]" en Firestore.
// Uso: node scripts/seed-[[SLUG]].mjs
// Requiere: scripts/serviceAccount.json (llave de servicio de Firebase, NO se sube a git).
//
// Los datos del menú viven en src/dev/[[FILE]].js (fuente única, compartida con ?preview=1).
// Aquí solo los escribimos en Firestore. Volver a correrlo NO duplica: actualiza (merge).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { SLUG, ADMIN_EMAIL, [[CONST]]_LOCAL, [[CONST]]_PRODUCTOS } from '../src/dev/[[FILE]].js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Campos que el DUEÑO configura desde el panel: si el local ya existe con ellos,
// el seed NO los pisa (la ubicación, el WhatsApp y el horario son suyos).
// Ojo: se comprueba por VALOR, no por != null. Un campo VACÍO ("") no es "configurado por el
// dueño" — es que falta —, así que el seed sí debe poder rellenarlo.

const CAMPOS_DEL_DUENO = ['ubicacion', 'whatsapp', 'horario']

async function run() {
  const { id, ...localData } = [[CONST]]_LOCAL
  const localRef = db.collection('locales').doc(SLUG)

  const prev = await localRef.get()
  if (prev.exists) {
    const data = prev.data() || {}
    for (const campo of CAMPOS_DEL_DUENO) {
      if (data[campo]) delete localData[campo]
    }
  }

  await localRef.set(localData, { merge: true })
  console.log(`✓ Local ${prev.exists ? 'actualizado' : 'creado'}: locales/${SLUG} ([[NOMBRE]])`)

  for (const p of [[CONST]]_PRODUCTOS) {
    const { id: pid, ...data } = p
    await localRef.collection('productos').doc(pid).set(data, { merge: true })
  }
  console.log(`✓ ${[[CONST]]_PRODUCTOS.length} productos cargados`)

  console.log(`\n🔗 Link del local: /${SLUG}`)
  console.log(`🔐 Admin: ${ADMIN_EMAIL} → /${SLUG}/admin`)
  console.log('📲 El dueño pone su WhatsApp desde el panel (Configuración → Datos del negocio).')
  process.exit(0)
}

run().catch(err => { console.error('Error en el seed:', err); process.exit(1) })
