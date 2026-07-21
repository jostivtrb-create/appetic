// 🛡️ Guardián de los seeds. Evita el accidente de re-sembrar un local que YA
// EXISTE en Firestore y pisar sus fotos IA / ediciones del dueño (que viven en
// Firestore, no en src/dev/*.js).
//
// Qué hace guardSeed(db, slug), llamado al inicio de cada seed ANTES de escribir:
//   1) Si el local no existe todavía  -> deja pasar (no hay nada que perder).
//   2) Si el local YA existe          -> SIEMPRE hace un respaldo del estado
//      actual en scripts/.seed-backups/ y:
//        • sin --force  -> ABORTA con un aviso claro (este es el caso normal).
//        • con --force  -> continúa (el dueño/dev lo pidió expresamente).
//
// Aplica en CUALQUIER conversación y también si alguien corre el seed a mano.
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = join(__dirname, '.seed-backups')

async function leerLocalCompleto(db, slug) {
  const localRef = db.collection('locales').doc(slug)
  const localSnap = await localRef.get()
  if (!localSnap.exists) return { exists: false, local: null, productos: [] }
  const prods = await localRef.collection('productos').get()
  return {
    exists: true,
    local: localSnap.data(),
    productos: prods.docs.map(d => ({ id: d.id, ...d.data() })),
  }
}

function respaldar(slug, estado) {
  mkdirSync(BACKUP_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = join(BACKUP_DIR, `${slug}-${stamp}.json`)
  writeFileSync(file, JSON.stringify(estado, null, 2))
  return file
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} slug
 * @param {{nombre?: string}} [opts]
 */
export async function guardSeed(db, slug, opts = {}) {
  const force = process.argv.includes('--force')
  const estado = await leerLocalCompleto(db, slug)

  // Local nuevo: nada que proteger.
  if (!estado.exists) {
    console.log(`🛡️  guardSeed: "${slug}" no existe aún → alta inicial permitida.`)
    return
  }

  // Local existente: respaldo SIEMPRE.
  const file = respaldar(slug, estado)
  const conFoto = estado.productos.filter(p => typeof p.foto === 'string' && p.foto.includes('firebasestorage')).length

  if (!force) {
    console.error('\n🛑 SEED BLOQUEADO — el local ya existe en Firestore.')
    console.error(`   locales/${slug}${opts.nombre ? ` (${opts.nombre})` : ''} · ${estado.productos.length} productos · ${conFoto} con foto IA en Storage.`)
    console.error('\n   Re-sembrar SOBRESCRIBE los datos del local con lo que hay en src/dev/*.js,')
    console.error('   y eso PISA las fotos IA y las ediciones que el dueño hizo por el panel.')
    console.error(`\n   ✅ Ya guardé un respaldo del estado actual en:\n      ${file}`)
    console.error('\n   • Para un cambio pequeño (ej. un campo del tema), NO uses el seed:')
    console.error(`       node -e "...localRef.update({ 'tema.miCampo': valor })"`)
    console.error('   • Si de verdad quieres re-sembrar por completo (perderás lo de Firestore),')
    console.error('     vuelve a correr el comando añadiendo  --force')
    console.error('')
    process.exit(1)
  }

  console.warn(`\n⚠️  --force: re-sembrando "${slug}" (ya existía). Respaldo previo en:\n     ${file}\n`)
}
