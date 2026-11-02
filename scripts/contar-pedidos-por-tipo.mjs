// 📊 Pasa los pedidos que ya existen a los contadores por tipo de stats (domicilios · recoger), antes
// de que la limpieza automática (TTL de 2 días) los borre. Guía «Cuentas del negocio», 2-nov-2026.
//
// Solo suma NÚMEROS (por día y en el total del local); no copia datos de clientes.
// Se salta los pedidos que ya traen `enStats: true` (los crea así la app nueva) y les pone esa marca
// a los que cuenta: se puede correr las veces que haga falta sin contar doble.
//
//   node scripts/contar-pedidos-por-tipo.mjs          → solo muestra qué haría
//   node scripts/contar-pedidos-por-tipo.mjs --escribir
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const escribir = process.argv.includes('--escribir')
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url)))) })
const db = getFirestore()
const CAMPO = { domicilio: 'domicilios', recoger: 'recoger' }
// Mismo día que usa stats.js (fecha de Bogotá).
const fechaBogota = d => d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

for (const L of (await db.collection('locales').get()).docs) {
  const pedidos = (await L.ref.collection('pedidos').get()).docs.filter(d => !d.data().enStats)
  if (!pedidos.length) continue
  const porDia = {}, total = {}
  for (const d of pedidos) {
    const p = d.data()
    const campo = CAMPO[p.entrega || 'recoger']
    const t = p.createdAt?.toDate?.()
    if (!campo || !t) continue
    const k = `d_${fechaBogota(t)}`
    porDia[k] ??= {}; porDia[k][campo] = (porDia[k][campo] || 0) + 1
    total[campo] = (total[campo] || 0) + 1
  }
  console.log(`${L.data().nombre}: ${pedidos.length} pedidos sin contar →`, JSON.stringify(total))
  if (!escribir) continue
  const ops = [
    ...Object.entries(porDia).map(([id, c]) => [L.ref.collection('stats').doc(id), { fecha: id.slice(2), ...Object.fromEntries(Object.entries(c).map(([k, n]) => [k, FieldValue.increment(n)])) }]),
    [L.ref.collection('stats').doc('total'), Object.fromEntries(Object.entries(total).map(([k, n]) => [k, FieldValue.increment(n)]))],
  ]
  // Contadores y marcas en UN solo lote por local: o queda todo o no queda nada (y se vuelve a correr).
  if (ops.length + pedidos.length > 490) throw new Error(`${L.data().nombre}: demasiados pedidos para un lote; partir por fechas`)
  const b = db.batch()
  for (const [ref, data] of ops) b.set(ref, data, { merge: true })
  for (const d of pedidos) b.update(d.ref, { enStats: true })
  await b.commit()
  console.log('   ✓ sumado y marcado')
}
if (!escribir) console.log('\n(Solo vista previa. Para escribir: --escribir)')
