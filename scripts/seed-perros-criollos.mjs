// 🌭 Alta del local "Perros Criiollos" en Firestore.
// Uso: node scripts/seed-perros-criollos.mjs
// Requiere: scripts/serviceAccount.json (llave de servicio de Firebase, NO se sube a git).
//
// Los datos del menú viven en src/dev/perrosCriollos.js (fuente única, compartida
// con la vista previa en DEV). Aquí solo los escribimos en Firestore.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { guardSeed } from './_seed-guard.mjs'
import { SLUG, ADMIN_EMAIL, PERROS_LOCAL, PERROS_PRODUCTOS } from '../src/dev/perrosCriollos.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Campos que el DUEÑO configura desde el panel: si el local ya existe con ellos,
// el seed NO debe pisarlos (la ubicación, el WhatsApp y el horario son suyos).
const CAMPOS_DEL_DUENO = ['ubicacion', 'whatsapp', 'horario']

async function run() {
  // El doc del local usa el slug como id. Quitamos `id` (no se guarda dentro del doc).
  const { id, ...localData } = PERROS_LOCAL
  const localRef = db.collection('locales').doc(SLUG)
  await guardSeed(db, SLUG)

  // Preservar lo que el dueño ya configuró: quitamos esos campos del payload
  // de ejemplo para no sobreescribirlos al re-sembrar.
  const prev = await localRef.get()
  if (prev.exists) {
    const data = prev.data() || {}
    for (const campo of CAMPOS_DEL_DUENO) {
      if (data[campo]) delete localData[campo]
    }
  }

  await localRef.set(localData, { merge: true })
  console.log(`✓ Local ${prev.exists ? 'actualizado' : 'creado'}: locales/${SLUG} (${PERROS_LOCAL.nombre})`)

  for (const p of PERROS_PRODUCTOS) {
    const { id: pid, ...data } = p
    // ⚠️ NO pisar la foto que el dueño subió desde el panel. El ejemplo trae
    // `foto: ''` (las fotos se suben luego); con merge, ese '' sobrescribiría la
    // foto real y la dejaría en blanco. Si viene vacía, la quitamos del payload.
    if (!data.foto) delete data.foto
    await localRef.collection('productos').doc(pid).set(data, { merge: true })
  }
  console.log(`✓ ${PERROS_PRODUCTOS.length} productos cargados`)

  console.log(`\n🔗 Link del local: /${SLUG}`)
  console.log(`🔐 Admin: ${ADMIN_EMAIL} → /${SLUG}/admin`)
  console.log('📲 Recuerda: el dueño pone su WhatsApp desde el panel (Configuración → Datos del negocio).')
  process.exit(0)
}

run().catch(err => { console.error('Error en el seed:', err); process.exit(1) })
