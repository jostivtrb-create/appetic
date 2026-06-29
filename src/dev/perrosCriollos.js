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
// Cada uno trae emoji (respaldo visual) y foto (ruta a la imagen apetitosa).
// La foto puede venir de aquí (archivo en public/) o subirse luego desde el panel.
const TOPPINGS = [
  ['Queso rallado', '🧀'], ['Maíz tierno', '🌽'], ['Chicharrón rayado', '🥓'],
  ['Trozos de piña', '🍍'], ['Maní', '🥜'], ['Jalapeños', '🌶️'],
  ['Pepinillos', '🥒'], ['Pico de gallo', '🍅'], ['Platanitos', '🍌'],
  ['Papa chip', '🍟'], ['Zanahoria rayada', '🥕'], ['Cebolla rayada', '🧅'],
].map(([nombre, emoji], i) => ({
  id: `t${i + 1}`, nombre, emoji, precioExtra: 0,
  foto: `/locales/perros-criollos/toppings/t${i + 1}.webp`,
}))

// Salsas: también gratis y sin límite.
const SALSAS = [
  ['BBQ', '🍖'], ['Maíz dulce', '🌽'], ['Piña', '🍍'], ['Tomate', '🍅'],
  ['Guacamole', '🥑'], ['Showy', '🩷'], ['Queso cheddar', '🧀'],
].map(([nombre, emoji], i) => ({
  id: `s${i + 1}`, nombre, emoji, precioExtra: 0,
  foto: `/locales/perros-criollos/salsas/s${i + 1}.webp`,
}))

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
  // Oculta la barra de pestañas de categorías (son pocos productos).
  ocultarNav: true,
  // SIN ubicación de ejemplo: hasta que el dueño la fije desde el panel
  // (📍 Usar mi ubicación actual), el checkout no ofrece domicilio (solo recoger).
  // 24 horas (abre === cierra). Útil para pruebas; el dueño lo ajusta en el panel.
  horario: { abre: '00:00', cierra: '00:00' },
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
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🥤' },
  ],
  admins: [ADMIN_EMAIL],
  // Suscripción (Capa 2): visible en el buscador del inicio. Se controla en /superadmin.
  suscripcion: { activa: true, plan: 'piloto' },
  // Súbelo cada vez que cambie el menú: invalida la caché del menú en los clientes.
  // v2: armador por pasos + fotos de toppings/salsas.
  menuVersion: 2,
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
    // 🪄 Modo "pasos": abre el armador por pasos (toppings → salsas → resumen)
    // en vez de la lista corrida. Cada perro se arma de cero y entra único al carrito.
    modo: 'pasos',
    gruposOpciones: [
      // Sin `max` => sin tope: puede elegir todos los que quiera (gratis).
      // emoji/paso para el armador visual.
      { id: 'g-toppings', nombre: 'Toppings', subtitulo: 'Los que quieras · todos gratis 🎉', emoji: '🧀', tipo: 'multiple', min: 0, opciones: TOPPINGS },
      { id: 'g-salsas', nombre: 'Salsas', subtitulo: 'Las que quieras · todas gratis 🎉', emoji: '🥫', tipo: 'multiple', min: 0, opciones: SALSAS },
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
  // Bebidas: todas $3.000, se agregan directo al carrito (sin opciones).
  { id: 'coca-cola', categoria: 'bebidas', nombre: 'Coca-Cola personal', foto: '', emoji: '🥤', disponible: true, orden: 3, precio: 3000 },
  { id: 'coca-cola-zero', categoria: 'bebidas', nombre: 'Coca-Cola Zero', foto: '', emoji: '🥤', disponible: true, orden: 4, precio: 3000 },
  { id: 'jugo-del-valle', categoria: 'bebidas', nombre: 'Jugo del Valle', foto: '', emoji: '🧃', disponible: true, orden: 5, precio: 3000 },
  { id: 'agua-manantial', categoria: 'bebidas', nombre: 'Agua Manantial', foto: '', emoji: '💧', disponible: true, orden: 6, precio: 3000 },
]
