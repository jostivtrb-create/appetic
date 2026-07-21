// 🍛 Alta del local "Sabor del Día" en Firestore.
// Uso: node scripts/seed-sabor-del-dia.mjs
// Requiere: scripts/serviceAccount.json (llave de servicio de Firebase, NO se sube a git).
//
// Los datos del menú viven en src/dev/saborDelDia.js (fuente única, compartida
// con la vista previa ?preview=1). Aquí solo los escribimos en Firestore.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { guardSeed } from './_seed-guard.mjs'
import { SLUG, ADMIN_EMAIL, SABOR_LOCAL, SABOR_PRODUCTOS } from '../src/dev/saborDelDia.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Campos que el DUEÑO configura desde el panel: si el local ya existe con ellos,
// el seed NO debe pisarlos (la ubicación, el WhatsApp y el horario son suyos).
const CAMPOS_DEL_DUENO = ['ubicacion', 'whatsapp', 'horario']

async function run() {
  // El doc del local usa el slug como id. Quitamos `id` (no se guarda dentro del doc).
  const { id, ...localData } = SABOR_LOCAL
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
  console.log(`✓ Local ${prev.exists ? 'actualizado' : 'creado'}: locales/${SLUG} (${SABOR_LOCAL.nombre})`)

  for (const p of SABOR_PRODUCTOS) {
    const { id: pid, ...data } = p
    // No pisar con '' la foto que el dueño haya subido desde el panel.
    if (!data.foto) delete data.foto
    await localRef.collection('productos').doc(pid).set(data, { merge: true })
  }
  console.log(`✓ ${SABOR_PRODUCTOS.length} productos cargados`)

  console.log(`\n🔗 Link del local: /${SLUG}`)
  console.log(`🔐 Admin: ${ADMIN_EMAIL} → /${SLUG}/admin`)
  console.log('📲 Recuerda: el dueño pone su WhatsApp desde el panel (Configuración → Datos del negocio).')
  console.log('🍛 El "Almuerzo del día" se cambia a diario desde el panel (pestaña Menú).')
  process.exit(0)
}

run().catch(err => { console.error('Error en el seed:', err); process.exit(1) })
