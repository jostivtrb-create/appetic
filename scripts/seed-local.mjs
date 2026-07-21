// 🌱 Crea / actualiza un local en Firestore (herramienta interna de alta de locales).
// Uso: node scripts/seed-local.mjs
// Requiere: scripts/serviceAccount.json (llave de servicio de Firebase, NO se sube a git).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { guardSeed } from './_seed-guard.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ====== DATOS DEL LOCAL PILOTO ======
const ADMIN_EMAIL = 'jostivtrb@gmail.com' // correo que administra este local
const SLUG = 'burgerdemo'

const LOCAL = {
  nombre: 'Burger Demo',
  slug: SLUG,
  descripcion: 'Hamburguesas artesanales · Barrio',
  whatsapp: '573208435143', // WhatsApp real para pruebas
  logo: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=200&q=70',
  banner: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=70',
  tema: { primary: '#E8732B', primaryStrong: '#C9531A', primarySoft: '#F6A45C', onPrimary: '#FFFFFF' },
  ubicacion: { lat: 4.6486, lng: -74.0639 },
  horario: { abre: '11:00', cierra: '22:00' },
  recoger: true,
  domicilio: {
    activo: true, maxKm: 5,
    tarifas: { '0.5': 2000, '1.0': 2000, '1.5': 3500, '2.0': 4000, '2.5': 4500, '3.0': 5000, '3.5': 7500, '4.0': 10000, '4.5': 12500, '5.0': 15000 },
  },
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '3000000000' },
    { id: 'datafono', nombre: 'Datáfono al recibir', tipo: 'datafono' },
  ],
  categorias: [
    { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🍟' },
    { id: 'combos', nombre: 'Combos', emoji: '🥤' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🧃' },
  ],
  admins: [ADMIN_EMAIL],
  // Suscripción (Capa 2): controla si aparece en el buscador del inicio.
  // Lo activas/desactivas desde /superadmin. true = visible en el explorador.
  suscripcion: { activa: true, plan: 'piloto' },
  menuVersion: 1,
}

const PRODUCTOS = [
  { id: 'p1', categoria: 'hamburguesas', nombre: 'Hamburguesa Clásica', descripcion: 'Carne 100% res, lechuga, tomate, cebolla y salsa de la casa.', foto: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=70', disponible: true, orden: 1,
    variantes: [{ id: 'v-sencilla', nombre: 'Sencilla', precio: 14000 }, { id: 'v-doble', nombre: 'Doble carne', precio: 19000 }],
    gruposOpciones: [
      { id: 'g-punto', nombre: 'Punto de la carne', tipo: 'unica', min: 1, max: 1, opciones: [{ id: 'o-termino', nombre: 'Término medio', precioExtra: 0 }, { id: 'o-bien', nombre: 'Bien cocida', precioExtra: 0 }] },
      { id: 'g-add', nombre: 'Adicionales', tipo: 'multiple', min: 0, max: 5, opciones: [{ id: 'a-queso', nombre: 'Queso extra', precioExtra: 3000 }, { id: 'a-tocineta', nombre: 'Tocineta', precioExtra: 4000 }, { id: 'a-huevo', nombre: 'Huevo', precioExtra: 2500 }] },
    ] },
  { id: 'p2', categoria: 'hamburguesas', nombre: 'Hamburguesa de Pollo', descripcion: 'Pechuga apanada crujiente, lechuga, tomate y salsa ranch.', foto: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&q=70', disponible: true, orden: 2, precio: 16000,
    gruposOpciones: [{ id: 'g-add2', nombre: 'Adicionales', tipo: 'multiple', min: 0, max: 4, opciones: [{ id: 'a-queso2', nombre: 'Queso extra', precioExtra: 3000 }, { id: 'a-aguacate', nombre: 'Aguacate', precioExtra: 3500 }] }] },
  { id: 'p3', categoria: 'salchipapas', nombre: 'Salchipapa', descripcion: 'Papa a la francesa, salchicha y nuestras salsas.', foto: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&q=70', disponible: true, orden: 3,
    variantes: [{ id: 'v-personal', nombre: 'Personal', precio: 12000 }, { id: 'v-familiar', nombre: 'Familiar', precio: 22000 }],
    gruposOpciones: [{ id: 'g-salsas', nombre: 'Salsas (hasta 3)', tipo: 'multiple', min: 0, max: 3, opciones: [{ id: 's-rosada', nombre: 'Rosada', precioExtra: 0 }, { id: 's-bbq', nombre: 'BBQ', precioExtra: 0 }, { id: 's-ajo', nombre: 'Ajo', precioExtra: 0 }, { id: 's-picante', nombre: 'Picante', precioExtra: 0 }] }] },
  { id: 'p4', categoria: 'combos', nombre: 'Combo Clásico', descripcion: 'Hamburguesa clásica + papas + bebida a elección.', foto: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=500&q=70', disponible: true, orden: 4, precio: 23000,
    gruposOpciones: [{ id: 'g-bebida', nombre: 'Elige tu bebida', tipo: 'unica', min: 1, max: 1, opciones: [{ id: 'b-gaseosa', nombre: 'Gaseosa', precioExtra: 0 }, { id: 'b-limonada', nombre: 'Limonada', precioExtra: 1000 }, { id: 'b-agua', nombre: 'Agua', precioExtra: 0 }] }] },
  { id: 'p5', categoria: 'bebidas', nombre: 'Gaseosa', descripcion: 'Bien fría.', foto: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=500&q=70', disponible: true, orden: 5,
    variantes: [{ id: 'g-350', nombre: '350 ml', precio: 4000 }, { id: 'g-15', nombre: '1.5 L', precio: 7000 }] },
  { id: 'p6', categoria: 'bebidas', nombre: 'Limonada Natural', descripcion: 'Hecha al momento.', foto: 'https://images.unsplash.com/photo-1497534446932-c925b458314a?w=500&q=70', disponible: true, orden: 6, precio: 6000 },
]

// ====== EJECUCIÓN ======
async function run() {
  // El doc del local usa el slug como id (simple y único)
  const localRef = db.collection('locales').doc(SLUG)
  await guardSeed(db, SLUG)
  await localRef.set(LOCAL, { merge: true })
  console.log(`✓ Local creado: locales/${SLUG} (${LOCAL.nombre})`)

  for (const p of PRODUCTOS) {
    const { id, ...data } = p
    // No pisar con '' la foto que el dueño haya subido desde el panel.
    if (!data.foto) delete data.foto
    await localRef.collection('productos').doc(id).set(data, { merge: true })
  }
  console.log(`✓ ${PRODUCTOS.length} productos cargados`)
  console.log(`\n🔗 Link del local: /${SLUG}`)
  console.log(`🔐 Admin: ${ADMIN_EMAIL} → /${SLUG}/admin`)
  process.exit(0)
}

run().catch(err => { console.error('Error en el seed:', err); process.exit(1) })
