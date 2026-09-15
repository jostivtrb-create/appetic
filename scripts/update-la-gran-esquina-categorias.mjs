// 🍳 Update PUNTUAL de "La Gran Esquina": la categoría "Desayuno" en el doc del local.
//
// Uso:
//   node scripts/update-la-gran-esquina-categorias.mjs           → muestra el plan, NO escribe
//   node scripts/update-la-gran-esquina-categorias.mjs --apply   → escribe en Firestore
// Requiere: scripts/serviceAccount.json (llave de servicio de Firebase, NO se sube a git).
//
// ¿Por qué no el seed? Porque `seed-la-gran-esquina.mjs` hace `set(..., { merge: true })`
// con TODO `LGE_LOCAL`, y eso pisaría `suscripcion.activa` (y cualquier otra cosa que el
// dueño haya cambiado desde su panel). Aquí se toca UN campo, `categorias`, y se
// conserva lo que ya hay en Firestore: solo se pone "Desayuno" de primera.
//
// Sin este update el desayuno sale igual (el traductor manda `categoriaNombre` y
// LocalMenu pinta las categorías huérfanas al final), pero saldría como ÚLTIMA
// pestaña, y por la mañana tiene que ser la primera. Ver LA-GRAN-ESQUINA.md.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { SLUG, LGE_LOCAL } from '../src/dev/laGranEsquina.js'

const APPLY = process.argv.includes('--apply')
const CATEGORIA_ID = 'desayunos'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function run() {
  const desayuno = LGE_LOCAL.categorias.find(c => c.id === CATEGORIA_ID)
  if (!desayuno) throw new Error(`No hay categoría "${CATEGORIA_ID}" en src/dev/laGranEsquina.js`)

  const localRef = db.collection('locales').doc(SLUG)
  const snap = await localRef.get()
  if (!snap.exists) throw new Error(`No existe locales/${SLUG}. Corre el seed primero.`)

  const antes = Array.isArray(snap.data()?.categorias) ? snap.data().categorias : []
  const yaEsta = antes.find(c => c?.id === CATEGORIA_ID)
  // Lo que está en Firestore MANDA sobre el archivo: solo se saca "Desayuno" de
  // donde esté (si está) y se pone de primera, sin tocar las demás.
  const despues = [desayuno, ...antes.filter(c => c?.id !== CATEGORIA_ID)]
  const pinta = cats => cats.map(c => `${c.emoji || ''} ${c.nombre} (${c.id})`.trim()).join(' · ') || '(vacío)'

  console.log(`\n🍳 La Gran Esquina — ${APPLY ? 'APLICANDO' : 'PLAN (nada se escribe)'}\n`)
  console.log(`  Proyecto: ${serviceAccount.project_id} · locales/${SLUG}.categorias`)
  console.log(`  Antes:    ${pinta(antes)}`)
  console.log(`  Después:  ${pinta(despues)}`)

  if (yaEsta && antes[0]?.id === CATEGORIA_ID) {
    console.log('\n✓ "Desayuno" ya es la primera categoría. Nada que hacer.\n')
    process.exit(0)
  }
  if (yaEsta) console.log('\n  ℹ️  "Desayuno" ya existía pero no de primera: solo se reordena.')

  if (!APPLY) {
    console.log('\n👀 Solo fue el plan. Para escribirlo de verdad:')
    console.log('   node scripts/update-la-gran-esquina-categorias.mjs --apply\n')
    process.exit(0)
  }

  await localRef.update({ categorias: despues })
  console.log(`\n✓ Local actualizado: locales/${SLUG}.categorias → "Desayuno" de primera.`)
  console.log('  (El doc del local se lee sin caché: la pestaña sale en la próxima carga.)\n')
  process.exit(0)
}

run().catch(err => { console.error('\n❌ Error:', err.message || err); process.exit(1) })
