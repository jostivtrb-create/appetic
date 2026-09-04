// 🥖 Alta del local "La Gran Esquina" en Firestore.
// Uso: node scripts/seed-la-gran-esquina.mjs
// Requiere: scripts/serviceAccount.json (llave de servicio de Firebase, NO se sube a git).
//
// ── Este local es distinto a todos los demás ──
//
// La Gran Esquina NO guarda su menú en Appetic. Tiene su propia app —caja,
// cocina, inventario y cierre de turno— y la cocinera publica desde allá el
// almuerzo de cada día. Appetic lo lee en vivo (`menuExterno` en el doc del
// local; el traductor está en src/services/menuLaGranEsquina.js).
//
// Por eso este seed:
//   • NO carga productos: `LGE_PRODUCTOS` está vacío a propósito.
//   • NO calcula `destacadosHome`, que se arma con productos guardados aquí.
//     Para este local el INICIO se apoya en su BANNER, así que ese banner
//     importa más que en los demás (ver public/locales/la-gran-esquina/PROMPTS.md).
//
// Lo que sí siembra es la IDENTIDAD: nombre, colores, horario, domicilios,
// WhatsApp y quién lo administra. Eso sí es de Appetic.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { guardSeed } from './_seed-guard.mjs'
import { SLUG, ADMIN_EMAIL, LGE_LOCAL } from '../src/dev/laGranEsquina.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Campos que el DUEÑO configura desde el panel: si el local ya existe con ellos,
// el seed NO los pisa (la ubicación, el WhatsApp y el horario son suyos).
// Se comprueba por VALOR: un campo vacío no es "configurado por el dueño", es
// que falta, y ahí el seed sí debe poder rellenarlo.
const CAMPOS_DEL_DUENO = ['ubicacion', 'whatsapp', 'horario']

async function run() {
  const { id, ...localData } = LGE_LOCAL
  const localRef = db.collection('locales').doc(SLUG)
  await guardSeed(db, SLUG)

  const prev = await localRef.get()
  if (prev.exists) {
    const data = prev.data() || {}
    for (const campo of CAMPOS_DEL_DUENO) {
      if (data[campo]) delete localData[campo]
    }
  }

  // 🆕 Fecha de alta: solo la primera vez (el badge 'Nuevo' del inicio dura 14 días).
  if (!prev.exists) localData.creadoEn = FieldValue.serverTimestamp()

  await localRef.set(localData, { merge: true })
  console.log(`✓ Local ${prev.exists ? 'actualizado' : 'creado'}: locales/${SLUG} (${LGE_LOCAL.nombre})`)
  console.log('  Menú externo: se lee en vivo de la app de La Gran Esquina (no se siembran productos).')

  console.log(`\n🔗 Link del local: /${SLUG}`)
  console.log(`🔐 Admin: ${ADMIN_EMAIL} → /${SLUG}/admin`)
  console.log(`📲 WhatsApp de los pedidos: ${LGE_LOCAL.whatsapp}`)
  console.log(`🔕 suscripcion.activa = ${LGE_LOCAL.suscripcion?.activa} (con false NO sale en el buscador)`)
  console.log('📍 Falta que Andrés capture la ubicación desde el panel: sin ella no hay domicilios.')
  process.exit(0)
}

run().catch(err => { console.error('Error en el seed:', err); process.exit(1) })
