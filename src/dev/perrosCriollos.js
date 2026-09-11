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

// Qué ids tienen una foto USABLE en public/. Los que no están aquí nacen con `foto: ''`
// para que el panel muestre el botón de generar con IA en vez de una imagen equivocada.
//
// Ojo con dos archivos que quedaron desfasados y por eso NO se listan:
//   • toppings/t11.webp es una zanahoria rallada, pero t11 hoy es "Takis endiablados".
//   • salsas/s6.webp es una salsa rosada, pero s6 hoy es "Showy" (crema con hierbas).
//     Esa foto sí sirve para la salsa Rosada, y por eso se copió a salsas/s9.webp.
// En producción casi todas estas opciones ya tienen foto propia subida al panel; estas
// rutas solo son el respaldo para la vista previa en DEV y para un alta desde cero.
const FOTOS_TOPPINGS = new Set(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't12'])
const FOTOS_SALSAS = new Set(['s1', 's2', 's3', 's4', 's5', 's7', 's9'])

// Toppings: todos gratis y sin límite (el corazón del "arma tu perro a tu gusto").
// Cada uno trae emoji (respaldo visual) y foto (ruta a la imagen apetitosa).
// La foto puede venir de aquí (archivo en public/) o subirse luego desde el panel.
//
// ⚠️ EL `id` MANDA, NO LA POSICIÓN. Las fotos de public/ están numeradas (t1.webp,
// t2.webp…) y se emparejan por id, así que un id NO se puede reciclar ni renumerar:
// si mañana sale un topping, su número se retira con él. Por eso esta lista ya no se
// genera con el índice del array — cada línea trae su id escrito a mano.
//   • t11 dejó de ser la zanahoria rayada: el dueño ya lo cambió a "Takis endiablados"
//     desde el panel, con su propia foto. El id se mantiene para no perderla.
//   • t13, t15 y t16 son los nuevos; nacen sin foto y se generan desde el panel.
//   • t14 (platanito salado) se pidió pero nunca se vendió: el local maneja el platanito
//     dulce y ya. Su id queda quemado para que no se reutilice.
// El nombre lleva el emoji al final porque así quedaron en producción: el armador por
// pasos los muestra tal cual, y quitarlos ahora cambiaría lo que el cliente ya ve.
const TOPPINGS = [
  ['t1',  'Queso rallado 🧀',          '🧀'],
  ['t2',  'Maíz tierno 🌽',            '🌽'],
  ['t3',  'Chicharrón rayado 🐷',      '🥓'],
  ['t4',  'Trozos de piña 🍍',         '🍍'],
  ['t5',  'Maní tostado 🥜',           '🥜'],
  ['t6',  'Jalapeños picantes 🌶️',    '🌶️'],
  ['t7',  'Pepinillos agridulces 🥒',  '🥒'],
  ['t8',  'Pico de gallo 🐓',          '🍅'],
  ['t9',  'Platanito dulce 🍌',        '🍌'],
  ['t10', 'Papa chip 🍟',              '🍟'],
  ['t11', 'Takis endiablados 🥵',      '🥵'],
  ['t12', 'Cebolla rayada 🧅',         '🧅'],
  ['t13', 'Chorizo picado 🍖',         '🍖'],
  ['t15', 'Coco rayado 🥥',            '🥥'],
  ['t16', 'Trocipollos crocantes 🍗',  '🍗'],
].map(([id, nombre, emoji]) => ({
  id, nombre, emoji, precioExtra: 0,
  foto: FOTOS_TOPPINGS.has(id) ? `/locales/perros-criollos/toppings/${id}.webp` : '',
}))

// Salsas: también gratis y sin límite. Mismas reglas de id que los toppings.
// Son DIEZ, en orden alfabético — que es el orden en que el dueño las canta.
//   • s8 (Ajo) ya lo había agregado el dueño desde el panel, con su foto.
//   • s9 (Rosada) y s10 (Buffalo) son las nuevas.
// A diferencia de los toppings, aquí el nombre NO lleva emoji: así están en producción.
const SALSAS = [
  ['s8',  'Ajo',           '🧄'],
  ['s1',  'BBQ',           '🍖'],
  ['s10', 'Buffalo',       '🌶️'],
  ['s5',  'Guacamole',     '🥑'],
  ['s2',  'Maíz dulce',    '🌽'],
  ['s3',  'Piña',          '🍍'],
  ['s7',  'Queso cheddar', '🧀'],
  ['s9',  'Rosada',        '🩷'],
  ['s6',  'Showy',         '💛'],
  ['s4',  'Tomate',        '🍅'],
].map(([id, nombre, emoji]) => ({
  id, nombre, emoji, precioExtra: 0,
  foto: FOTOS_SALSAS.has(id) ? `/locales/perros-criollos/salsas/${id}.webp` : '',
}))

export const PERROS_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Perros Criiollos',
  descripcion: 'Arma tu perro a tu gusto · siempre $8.000',
  // El dueño lo configura desde el panel (Configuración → Datos del negocio).
  whatsapp: '',
  logo: '/locales/perros-criollos/logo.png',
  // Ícono cuadrado (logo HD completo) para el cuadrito de la lista/superadmin.
  icono: '/locales/perros-criollos/icono-2.webp',
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
  // 🗂️ Etiquetas del INICIO (chips de categorías, catálogo en src/config/categoriasLocales.js).
  etiquetas: ['perros', 'pasabocas', 'comida-rapida'],
  // ⭐ Prioridad comercial: aparece arriba en el inicio con badge 'Recomendado' (nuestro local bandera).
  prioridad: 10,
  admins: [ADMIN_EMAIL],
  // Suscripción (Capa 2): visible en el buscador del inicio. Se controla en /superadmin.
  suscripcion: { activa: true, plan: 'piloto' },
  // Súbelo cada vez que cambie el menú: invalida la caché del menú en los clientes.
  // v2: armador por pasos + fotos de toppings/salsas.
  // v5: menú real de septiembre 2026 — 16 toppings y perro a $8.000.
  // v6: las salsas son DIEZ, no seis (la v5 salió corta y alcanzó a publicarse).
  // v7: los toppings son QUINCE — el platanito salado nunca entró a la carta.
  menuVersion: 7,
}

export const PERROS_PRODUCTOS = [
  {
    id: 'arma-tu-perro',
    categoria: 'perros',
    nombre: 'Arma Tu Perro',
    descripcion: 'Tu perro caliente como te gusta: súmale todos los toppings y salsas que quieras. Siempre $8.000.',
    foto: '',
    emoji: '🌭',
    destacado: true, // tarjeta resaltada: es el fuerte del local
    disponible: true,
    orden: 1,
    precio: 8000,
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
