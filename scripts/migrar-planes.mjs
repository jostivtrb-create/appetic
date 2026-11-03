// 💳 Migración a PLANES Y PAGO (guía «Planes en la app», paso 7). Se corre UNA vez.
//
//   node scripts/migrar-planes.mjs            → solo muestra lo que haría (no escribe nada)
//   node scripts/migrar-planes.mjs --aplicar  → escribe
//
// A cada local que todavía no tiene `suscripcion.estado`:
//   • suscripcion = { plan: 'empresario', estado: 'cortesia' }   (los de hoy son de muestra: H5/D17)
//   • enBuscador  = el viejo suscripcion.activa                    (los que hoy salen siguen saliendo: S16)
//   • se borra suscripcion.activa
// La demo queda igual (Empresario en cortesía) y nunca en el buscador. Los que ya tienen `estado`
// no se tocan: así se puede volver a correr sin pisar pagos.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sa = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))
initializeApp({ credential: cert(sa) })
const db = getFirestore()
const aplicar = process.argv.includes('--aplicar')

const snap = await db.collection('locales').get()
const antes = {}
let cambios = 0
for (const d of snap.docs) {
  const x = d.data()
  antes[d.id] = { suscripcion: x.suscripcion ?? null, enBuscador: x.enBuscador ?? null }
  if (x.suscripcion?.estado) { console.log(`= ${d.id}: ya migrado (${x.suscripcion.plan} · ${x.suscripcion.estado})`); continue }
  const enBuscador = x.esDemo ? false : !!x.suscripcion?.activa
  console.log(`→ ${d.id}: ${JSON.stringify(x.suscripcion)} ⇒ Empresario · cortesía · ${enBuscador ? 'sale' : 'no sale'} en el buscador`)
  cambios++
  if (aplicar) {
    await d.ref.update({
      'suscripcion.plan': 'empresario',
      'suscripcion.estado': 'cortesia',
      'suscripcion.activa': FieldValue.delete(),
      enBuscador,
    })
  }
}

if (aplicar && cambios) {
  const dir = join(__dirname, '.seed-backups')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `migrar-planes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify(antes, null, 2))
  console.log(`\n✅ ${cambios} locales migrados. Respaldo de cómo estaban: ${file}`)
} else {
  console.log(`\n${cambios} locales por migrar.${cambios ? ' Corre con --aplicar para escribir.' : ''}`)
}
process.exit(0)
