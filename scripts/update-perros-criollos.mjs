// 🌭 Actualización DIRIGIDA de "Perros Criiollos" — menú real + precio.
//
// Uso:
//   node scripts/update-perros-criollos.mjs           → muestra el plan, NO escribe
//   node scripts/update-perros-criollos.mjs --apply   → escribe en Firestore
//
// ¿Por qué no usar el seed? Porque `seed-perros-criollos.mjs` hace
// `set(data, { merge: true })` sobre el producto, y merge NO fusiona arrays: reemplaza
// `gruposOpciones` entero. Cualquier foto de topping que el dueño haya subido desde el
// panel (una URL de Storage) se perdería. Este script lee lo que hay, conserva esas
// fotos por id y solo entonces escribe.
//
// La regla de conservación es simple: si en Firestore la foto de una opción es una URL
// (http…), la subió el dueño y MANDA sobre lo que diga el archivo fuente. Si es una ruta
// estática (/locales/…), viene de un seed anterior y se recalcula desde el fuente.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { SLUG, PERROS_LOCAL, PERROS_PRODUCTOS } from '../src/dev/perrosCriollos.js'
import { computeDestacadosHome } from '../src/utils/destacadosHome.js'

const APPLY = process.argv.includes('--apply')
const PRODUCTO_ID = 'arma-tu-perro'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))
const BUCKET = `${serviceAccount.project_id}.firebasestorage.app`
initializeApp({ credential: cert(serviceAccount), storageBucket: BUCKET })
const db = getFirestore()

const esSubida = foto => typeof foto === 'string' && /^https?:\/\//i.test(foto)

// 🛟 Las fotos que el dueño sube quedan en Storage bajo un nombre predecible
// (locales/<slug>/opciones/<grupoId>-<opcionId>.webp) y NO se borran cuando una opción
// sale del menú: lo único que se pierde es la URL guardada en Firestore, que lleva el
// token de descarga. Si una salsa se retira y después vuelve, su foto sigue ahí pero
// quedó huérfana. Este índice la rescata reconstruyendo la URL desde el token que el
// propio archivo guarda en sus metadatos, para no pedirle al dueño que suba de nuevo
// algo que nunca se fue.
async function fotosHuerfanas() {
  const mapa = new Map()
  const [files] = await getStorage().bucket().getFiles({ prefix: `locales/${SLUG}/opciones/` })
  for (const f of files) {
    const token = f.metadata?.metadata?.firebaseStorageDownloadTokens
    if (!token) continue
    const clave = f.name.split('/').pop().replace(/\.[^.]+$/, '') // g-salsas-s5
    mapa.set(clave, `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(f.name)}?alt=media&token=${token.split(',')[0]}`)
  }
  return mapa
}

async function run() {
  const localRef = db.collection('locales').doc(SLUG)
  const prodRef = localRef.collection('productos').doc(PRODUCTO_ID)

  const [localSnap, prodSnap] = await Promise.all([localRef.get(), prodRef.get()])
  if (!localSnap.exists) throw new Error(`No existe locales/${SLUG}. Corre el seed primero.`)
  if (!prodSnap.exists) throw new Error(`No existe el producto ${PRODUCTO_ID}.`)

  const antes = prodSnap.data() || {}
  const gruposAntes = Array.isArray(antes.gruposOpciones) ? antes.gruposOpciones : []

  // Lo que hay hoy en Firestore, indexado por id de opción.
  const previas = new Map()
  for (const g of gruposAntes) {
    for (const o of g?.opciones || []) if (o?.id) previas.set(o.id, o)
  }

  const fuente = PERROS_PRODUCTOS.find(p => p.id === PRODUCTO_ID)
  if (!fuente) throw new Error(`${PRODUCTO_ID} no está en src/dev/perrosCriollos.js`)

  const huerfanas = await fotosHuerfanas()
  const conservadas = []
  const rescatadas = []
  const gruposNuevos = fuente.gruposOpciones.map(g => ({
    ...g,
    opciones: g.opciones.map(o => {
      const previa = previas.get(o.id)
      if (previa && esSubida(previa.foto)) {
        conservadas.push(`${o.nombre} (${o.id})`)
        return { ...o, foto: previa.foto }
      }
      // No estaba en Firestore (o su foto era una ruta estática), pero su archivo sigue
      // en Storage: es una opción que salió del menú y volvió. Se le devuelve su foto.
      const rescate = huerfanas.get(`${g.id}-${o.id}`)
      if (rescate) {
        rescatadas.push(`${o.nombre} (${o.id})`)
        return { ...o, foto: rescate }
      }
      return o
    }),
  }))

  // --- Diagnóstico: qué entra, qué sale, qué se renombra ---
  const idsAntes = new Set(previas.keys())
  const idsNuevos = new Set(gruposNuevos.flatMap(g => g.opciones.map(o => o.id)))
  const nombreAntes = id => previas.get(id)?.nombre || id
  const salen = [...idsAntes].filter(id => !idsNuevos.has(id)).map(id => `${nombreAntes(id)} (${id})`)
  const entran = []
  const renombradas = []
  for (const g of gruposNuevos) {
    for (const o of g.opciones) {
      if (!idsAntes.has(o.id)) entran.push(`${o.nombre} (${o.id})`)
      else if (previas.get(o.id).nombre !== o.nombre) renombradas.push(`${nombreAntes(o.id)} → ${o.nombre}`)
    }
  }

  // El resumen del INICIO se recalcula con la foto REAL del producto (la de Firestore
  // si el dueño subió una), no con el `foto: ''` del archivo fuente.
  const productosParaHome = PERROS_PRODUCTOS.map(p => (
    p.id === PRODUCTO_ID && esSubida(antes.foto) ? { ...p, foto: antes.foto } : p
  ))

  const cambiosProducto = {
    nombre: fuente.nombre,
    descripcion: fuente.descripcion,
    precio: fuente.precio,
    gruposOpciones: gruposNuevos,
  }
  const cambiosLocal = {
    descripcion: PERROS_LOCAL.descripcion,
    menuVersion: PERROS_LOCAL.menuVersion,
    destacadosHome: computeDestacadosHome(productosParaHome),
  }

  console.log(`\n🌭 Perros Criiollos — ${APPLY ? 'APLICANDO' : 'PLAN (nada se escribe)'}\n`)
  console.log(`  Precio:  $${antes.precio?.toLocaleString('es-CO')} → $${fuente.precio.toLocaleString('es-CO')}`)
  console.log(`  Opciones: ${idsAntes.size} → ${idsNuevos.size}`)
  const lista = (t, arr) => arr.length && console.log(`\n  ${t} (${arr.length}):\n${arr.map(x => `    · ${x}`).join('\n')}`)
  lista('➕ Entran', entran)
  lista('➖ Salen', salen)
  lista('✏️  Se renombran', renombradas)
  lista('🖼️  Fotos subidas por el dueño que se CONSERVAN', conservadas)
  lista('🛟 Fotos huérfanas RESCATADAS de Storage', rescatadas)
  const sinFoto = gruposNuevos.flatMap(g => g.opciones.filter(o => !o.foto).map(o => `${o.nombre} (${o.id})`))
  lista('📷 Quedan SIN foto (genéralas desde el panel)', sinFoto)
  if (!conservadas.length) console.log('\n  🖼️  No había fotos subidas desde el panel: nada que conservar.')

  if (!APPLY) {
    console.log('\n👀 Solo fue el plan. Para escribirlo de verdad:')
    console.log('   node scripts/update-perros-criollos.mjs --apply\n')
    process.exit(0)
  }

  await prodRef.update(cambiosProducto)
  await localRef.update(cambiosLocal)
  console.log(`\n✓ Producto actualizado: locales/${SLUG}/productos/${PRODUCTO_ID}`)
  console.log(`✓ Local actualizado (menuVersion ${PERROS_LOCAL.menuVersion}) → se invalida la caché del menú.\n`)
  process.exit(0)
}

run().catch(err => { console.error('\n❌ Error:', err.message || err); process.exit(1) })
