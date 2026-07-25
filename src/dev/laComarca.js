// 🔥 LA COMARCA — Comida artesanal · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-la-comarca.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// Estética sacada del ADN de ESTA marca (su logo rústico "ARTESANAL · LA COMARCA"): un emblema
// de horno de leña con casas de campo al atardecer, chorizo y hamburguesa sobre madera, sobre un
// fondo ÁMBAR cálido y una cinta de madera CAFÉ con el nombre en crema. De ahí sale la paleta:
// CAFÉ artesanal de marca (barra de pestañas, botones, precios), ÁMBAR dorado de acento y un
// "mundo" crema tostada — cálido, campesino y apetitoso, distinto a los demás locales.

export const SLUG = 'la-comarca'

// Correo del DUEÑO que administra el local (entra a /la-comarca/admin con ese Google).
// ⚠️ POR DEFECTO: queda 'sinfiniity@gmail.com' (NUESTRA cuenta, no la del cliente) porque el
//    dueño aún no dio su Gmail. Se cambia sin tocar código desde el panel de superadmin
//    (campo 👤 del local) o re-corriendo el seed con el correo real.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

export const COMARCA_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'La Comarca',
  descripcion: 'Comida artesanal · hamburguesas, chorizos y perros hechos con amor 🔥',
  // 📱 Número POR DEFECTO (320 843 5143), no el del local: deja el checkout funcionando desde el
  //    minuto uno mientras La Comarca da el suyo. Los pedidos llegan a nosotros, no a ellos → por
  //    eso el local sigue inactivo en el buscador (ver `suscripcion` abajo). El dueño pone el real
  //    desde su panel (⚙️ Configuración → Datos del negocio); es también el número del afiche de
  //    domicilios de la pestaña 📣 Difundir.
  whatsapp: '573208435143',

  // 🎨 IDENTIDAD VISUAL — paleta CAFÉ/ÁMBAR sacada del logo.
  // Hero "manchón": el LOGO transparente (fondo blanco quitado con IA) se pinta en zigzag,
  // igual que Jasbury. El icono cuadrado es para el buscador de locales.
  logo: '/locales/la-comarca/logo.webp',      // emblema transparente (fondo quitado con IA)
  logoAnim: 'manchon',                        // hero: se pinta en zigzag (LogoManchon)
  icono: '/locales/la-comarca/icono.webp',    // cuadrado (buscador de locales)
  banner: '',                                 // sin banner de foto: el hero es el logo
  tema: {
    primary: '#6F4A2F',        // café artesanal del logo (barra de pestañas, botones, precios)
    primaryStrong: '#4E3220',  // café oscuro (degradado / variante oscura)
    primarySoft: '#C77B3B',    // terracota/ámbar cálido para el degradado del hero
    onPrimary: '#FFFFFF',      // texto sobre el café
    accent: '#D98E2B',         // dorado ámbar del fondo del logo (acento, detalles)
    bg: '#F7EEDD',             // "mundo" crema tostada (tinte cálido de la marca)
    hero: 'logo',              // hero protagonizado por el logo (manchón), no banner de foto
  },

  // 24 horas (abre === cierra): útil para probar a cualquier hora. El dueño ajusta el real.
  horario: { abre: '00:00', cierra: '00:00' },
  recoger: true,
  domicilio: { activo: false, maxKm: 3, tarifas: {} },
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],
  categorias: [
    { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔' },
    { id: 'chorizos', nombre: 'Chorizos', emoji: '🌭' },
    { id: 'perros', nombre: 'Perros', emoji: '🥖' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🍟' },
    { id: 'empanadas', nombre: 'Empanadas', emoji: '🥟' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🥤' },
  ],
  admins: [ADMIN_EMAIL],
  // activa:false → NO sale todavía en el buscador del inicio. Se enciende desde el panel de
  // superadmin cuando el local ya tenga su WhatsApp real y el dueño dé el visto bueno (si saliera
  // ahora, un cliente podría pedir y el pedido llegaría al número por defecto, no al de La Comarca).
  suscripcion: { activa: false, plan: 'piloto' },
  menuVersion: 1,
}

export const COMARCA_PRODUCTOS = [
  // ══════════════════ 🍔 HAMBURGUESAS ══════════════════
  { id: 'ham-sencilla', categoria: 'hamburguesas', nombre: 'Hamburguesa Artesanal Sencilla',
    descripcion: 'Carne artesanal a la parrilla, queso y todas las salsas de la casa. Hecha con amor.',
    foto: '', emoji: '🍔', destacado: true, disponible: true, orden: 1, precio: 15000 },
  { id: 'ham-chorizo', categoria: 'hamburguesas', nombre: 'Hamburguesa con Chorizo Artesanal',
    descripcion: 'Carne artesanal más nuestro chorizo de la casa, queso y todas las salsas. La favorita.',
    foto: '', emoji: '🍔', destacado: true, disponible: true, orden: 2, precio: 20000 },
  { id: 'ham-doble', categoria: 'hamburguesas', nombre: 'Hamburguesa Artesanal Doble Carne',
    descripcion: 'Doble carne artesanal a la parrilla, doble queso y todas las salsas. Para el hambre grande.',
    foto: '', emoji: '🍔', destacado: true, disponible: true, orden: 3, precio: 24000 },

  // ══════════════════ 🌭 CHORIZOS ══════════════════
  { id: 'chorizo-arepa', categoria: 'chorizos', nombre: 'Chorizo Artesanal con Arepa',
    descripcion: 'Chorizo artesanal doradito a la parrilla, con arepa y salsas de la casa.',
    foto: '', emoji: '🌭', disponible: true, orden: 1, precio: 6000 },
  { id: 'chorizo-arepa-queso', categoria: 'chorizos', nombre: 'Chorizo con Arepa de Queso',
    descripcion: 'Chorizo artesanal a la parrilla, con arepa de queso y salsas de la casa.',
    foto: '', emoji: '🧀', disponible: true, orden: 2, precio: 8000 },
  { id: 'choripapa-francesa', categoria: 'chorizos', nombre: 'Chori Papa Francesa',
    descripcion: 'Chorizo artesanal en trozos sobre papa a la francesa doradita y todas las salsas.',
    foto: '', emoji: '🍟', destacado: true, disponible: true, orden: 3, precio: 9000 },

  // ══════════════════ 🥖 PERROS ══════════════════
  { id: 'perro-sencillo', categoria: 'perros', nombre: 'Perro Sencillo',
    descripcion: 'Pan, salchicha, queso, papa triturada y todas las salsas de la casa.',
    foto: '', emoji: '🌭', disponible: true, orden: 1, precio: 12000 },
  { id: 'perro-especial', categoria: 'perros', nombre: 'Perro Especial',
    descripcion: 'Pan, salchicha, queso, jamón, papa triturada y todas las salsas. Más completo.',
    foto: '', emoji: '🌭', destacado: true, disponible: true, orden: 2, precio: 15000 },
  { id: 'choriperro', categoria: 'perros', nombre: 'Choriperro',
    descripcion: 'Pan, chorizo artesanal, queso, papa triturada y todas las salsas de la casa.',
    foto: '', emoji: '🌭', disponible: true, orden: 3, precio: 10000 },
  { id: 'choriperro-especial', categoria: 'perros', nombre: 'Choriperro Especial',
    descripcion: 'Pan, chorizo artesanal, queso, jamón, papa triturada y todas las salsas. Bien cargado.',
    foto: '', emoji: '🌭', destacado: true, disponible: true, orden: 4, precio: 15000 },

  // ══════════════════ 🍟 SALCHIPAPAS ══════════════════
  // Salchipapas por TAMAÑO (sencilla / normal / especial) → un producto con variantes.
  { id: 'salchipapas', categoria: 'salchipapas', nombre: 'Salchipapas',
    descripcion: 'Papa a la francesa, salchicha y todas las salsas de la casa. Elige el tamaño.',
    foto: '', emoji: '🍟', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'salchi-sencilla', nombre: 'Sencilla', precio: 7000 },
      { id: 'salchi-normal', nombre: 'Normal', precio: 11000 },
      { id: 'salchi-especial', nombre: 'Especial', precio: 15000 },
    ] },
  // Salchipicada por TAMAÑO (normal / especial) → un producto con variantes.
  { id: 'salchipicada', categoria: 'salchipapas', nombre: 'Salchipicada',
    descripcion: 'Papa, variedad de carnes y salchichas picadas, queso y todas las salsas. Para compartir. Elige el tamaño.',
    foto: '', emoji: '🍢', destacado: true, disponible: true, orden: 2,
    variantes: [
      { id: 'picada-normal', nombre: 'Normal', precio: 20000 },
      { id: 'picada-especial', nombre: 'Especial', precio: 30000 },
    ] },

  // ══════════════════ 🥟 EMPANADAS ══════════════════
  { id: 'emp-arroz-pollo', categoria: 'empanadas', nombre: 'Empanada de Arroz y Pollo',
    descripcion: 'Crocante y recién hecha, rellena de arroz y pollo.',
    foto: '', emoji: '🥟', disponible: true, orden: 1, precio: 2500 },
  { id: 'emp-papa-carne', categoria: 'empanadas', nombre: 'Empanada de Papa y Carne',
    descripcion: 'Crocante y recién hecha, rellena de papa y carne.',
    foto: '', emoji: '🥟', disponible: true, orden: 2, precio: 2500 },

  // ══════════════════ 🥤 BEBIDAS ══════════════════
  // Coca-Cola por TAMAÑO.
  { id: 'coca-cola', categoria: 'bebidas', nombre: 'Coca-Cola',
    descripcion: 'Bien fría. Elige el tamaño.',
    foto: '', emoji: '🥤', disponible: true, orden: 1,
    variantes: [
      { id: 'coca-mini', nombre: 'Mini', precio: 3000 },
      { id: 'coca-personal', nombre: 'Personal', precio: 4000 },
      { id: 'coca-15', nombre: '1.5 L', precio: 8000 },
    ] },
]
