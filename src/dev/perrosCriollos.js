// 🌭 PERROS CRIIOLLOS — datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en DEV  (src/pages/Local/LocalPage.jsx, AdminPage.jsx)
//   • El alta real en producción (scripts/seed-perros-criollos.mjs)
//
// Es JS plano (sin React ni imports de imágenes): el logo se referencia por su
// ruta pública, así funciona igual en el navegador y en Node.
//
// Estética basada en el logo (granja criolla): rojo tomate + dorado maíz +
// verde campo sobre crema cálida. El fuerte del local es "arma tu perro".

export const SLUG = 'perros-criollos'

// Correo del dueño que administra el local (queda anclado en `admins`).
// 👉 Cámbialo por el correo real del dueño cuando lo tengas; con ese correo
//    entra a /perros-criollos/admin para editar menú, horario y WhatsApp.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

// Toppings: todos gratis y sin límite (el corazón del "arma tu perro a tu gusto").
const TOPPINGS = [
  'Queso rallado', 'Maíz tierno', 'Chicharrón rayado', 'Trozos de piña', 'Maní',
  'Jalapeños', 'Pepinillos', 'Pico de gallo', 'Platanitos', 'Papa chip',
  'Zanahoria rayada', 'Cebolla rayada',
].map((nombre, i) => ({ id: `t${i + 1}`, nombre, precioExtra: 0 }))

// Salsas: también gratis y sin límite.
const SALSAS = [
  'BBQ', 'Maíz dulce', 'Piña', 'Tomate', 'Guacamole', 'Showy', 'Queso cheddar',
].map((nombre, i) => ({ id: `s${i + 1}`, nombre, precioExtra: 0 }))

export const PERROS_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Perros Criiollos',
  descripcion: 'Arma tu perro a tu gusto · siempre $7.000',
  // El dueño lo configura desde el panel (Configuración → Datos del negocio).
  whatsapp: '',
  logo: '/locales/perros-criollos/logo.png',
  // Sin foto de banner: el hero protagoniza el logo sobre crema (variante 'logo').
  banner: '',
  tema: {
    primary: '#C8341F',       // rojo "PERROS"
    primaryStrong: '#9E2614',
    primarySoft: '#E89A33',   // dorado "CRIIOLLOS" / maíz
    onPrimary: '#FFFFFF',
    accent: '#3E7C3A',        // verde del campo / la cinta del logo
    hero: 'logo',             // hero con el logo grande sobre crema (no foto)
    bg: '#FBF3E2',            // "mundo" crema cálido detrás del menú
  },
  // Ubicación de ejemplo (Bogotá). El dueño la fija desde el panel.
  ubicacion: { lat: 4.6486, lng: -74.0639 },
  horario: { abre: '16:00', cierra: '23:00' },
  recoger: true,
  domicilio: {
    activo: true,
    maxKm: 4,
    tarifas: {
      '0.5': 2000, '1.0': 2000, '1.5': 3000, '2.0': 3500,
      '2.5': 4000, '3.0': 5000, '3.5': 6000, '4.0': 7000,
    },
  },
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],
  categorias: [
    { id: 'perros', nombre: 'Arma Tu Perro', emoji: '🌭' },
    { id: 'empanadas', nombre: 'Empanadas', emoji: '🥟' },
  ],
  admins: [ADMIN_EMAIL],
  // Suscripción (Capa 2): visible en el buscador del inicio. Se controla en /superadmin.
  suscripcion: { activa: true, plan: 'piloto' },
  menuVersion: 1,
}

export const PERROS_PRODUCTOS = [
  {
    id: 'arma-tu-perro',
    categoria: 'perros',
    nombre: 'Arma Tu Perro',
    descripcion: 'Tu perro caliente como te gusta: súmale todos los toppings y salsas que quieras. Siempre $7.000.',
    foto: '',
    emoji: '🌭',
    destacado: true, // tarjeta resaltada: es el fuerte del local
    disponible: true,
    orden: 1,
    precio: 7000,
    gruposOpciones: [
      // Sin `max` => sin tope: puede elegir todos los que quiera (gratis).
      { id: 'g-toppings', nombre: 'Toppings · los que quieras, gratis', tipo: 'multiple', min: 0, opciones: TOPPINGS },
      { id: 'g-salsas', nombre: 'Salsas · las que quieras, gratis', tipo: 'multiple', min: 0, opciones: SALSAS },
    ],
  },
  {
    id: 'empanadas',
    categoria: 'empanadas',
    nombre: 'Empanada',
    descripcion: 'Crocante y recién hecha. Elige tu relleno.',
    foto: '',
    emoji: '🥟',
    disponible: true,
    orden: 2,
    variantes: [
      { id: 'v-carne', nombre: 'Carne', precio: 4000 },
      { id: 'v-pollo', nombre: 'Pollo', precio: 4000 },
    ],
  },
]
