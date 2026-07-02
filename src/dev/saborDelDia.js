// 🍛 SABOR DEL DÍA — datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-sabor-del-dia.mjs)
//
// Es JS plano (sin React ni imports de imágenes): así funciona igual en el
// navegador y en Node.
//
// Es un local de ALMUERZOS: el corazón es el "Almuerzo del día", que cambia a
// diario. El dueño lo edita desde el panel (pestaña 🍽️ Menú → Almuerzo del día):
//   • La SOPA de hoy va en la descripción del producto.
//   • Las PROTEÍNAS / PRINCIPIOS / JUGOS son grupos de "elige 1": el dueño
//     agrega/quita opciones cada día. Si un día no hay almuerzo, lo pone "Agotado".
// El resto de la carta (ejecutivos, sopas, bebidas, postres, adicionales) es fija.

export const SLUG = 'sabor-del-dia'

// Correo del dueño que administra el local (queda anclado en `admins`).
// 👉 Cámbialo por el correo real del dueño; con ese correo entra a
//    /sabor-del-dia/admin a editar el menú del día, horario y WhatsApp.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

export const SABOR_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Sabor del Día',
  descripcion: 'Almuerzos caseros, hechos hoy · el menú del día cambia a diario',
  // El dueño lo configura desde el panel (Configuración → Datos del negocio).
  whatsapp: '',
  logo: '/locales/sabor-del-dia/logo.webp',
  banner: '/locales/sabor-del-dia/banner.webp',
  tema: {
    primary: '#C6472B',        // tomate / terracota (sazón de casa)
    primaryStrong: '#9E3418',
    primarySoft: '#E6A02C',    // mostaza / ámbar
    onPrimary: '#FFFFFF',
    accent: '#5A9A3C',         // verde de la ensalada
    bg: '#FBF3E9',             // crema cálida detrás del menú
  },
  // 24 horas (abre === cierra): útil para probar a cualquier hora.
  // El dueño ajusta el horario real desde el panel.
  horario: { abre: '00:00', cierra: '00:00' },
  recoger: true,
  // Domicilio apagado hasta que el dueño fije su ubicación y lo active en el panel
  // (muchos almuerzos son para recoger / oficinas). Así el checkout ofrece solo "recoger".
  domicilio: { activo: false, maxKm: 3, tarifas: {} },
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],
  categorias: [
    { id: 'almuerzo', nombre: 'Almuerzo del día', emoji: '🍛' },
    { id: 'ejecutivos', nombre: 'Ejecutivos y especiales', emoji: '🍗' },
    { id: 'sopas', nombre: 'Sopas y caldos', emoji: '🥣' },
    { id: 'bebidas', nombre: 'Bebidas naturales', emoji: '🥤' },
    { id: 'postres', nombre: 'Postres', emoji: '🍮' },
    { id: 'adicionales', nombre: 'Adicionales', emoji: '➕' },
  ],
  admins: [ADMIN_EMAIL],
  // Suscripción (Capa 2): visible en el buscador del inicio. Se controla en /superadmin.
  suscripcion: { activa: true, plan: 'piloto' },
  // Súbelo cada vez que cambie la CARTA FIJA (no hace falta por el menú del día).
  menuVersion: 1,
}

export const SABOR_PRODUCTOS = [
  // ⭐ EL MENÚ DEL DÍA — lo que el dueño cambia a diario desde el panel.
  {
    id: 'almuerzo-del-dia',
    categoria: 'almuerzo',
    nombre: 'Almuerzo del día',
    // 👉 El dueño edita esta descripción cada día con la SOPA de hoy.
    descripcion: 'Hoy: sopa de sancocho de costilla. Incluye arroz, ensalada fresca y tajada de plátano + jugo natural. Elige tu proteína, principio y jugo.',
    foto: '/locales/sabor-del-dia/almuerzo-del-dia.webp',
    emoji: '🍛',
    destacado: true, // tarjeta resaltada: es el fuerte del local
    disponible: true, // el día que no haya, el dueño lo pone en "Agotado"
    orden: 1,
    precio: 15000,
    gruposOpciones: [
      {
        id: 'g-proteina', nombre: 'Proteína', subtitulo: 'Elige 1', emoji: '🍗',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'pr1', nombre: 'Sudado de pollo', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'pr2', nombre: 'Carne en bistec a la criolla', emoji: '🥩', precioExtra: 0, foto: '' },
          { id: 'pr3', nombre: 'Pescado apanado', emoji: '🐟', precioExtra: 0, foto: '' },
        ],
      },
      {
        id: 'g-principio', nombre: 'Principio', subtitulo: 'Elige 1', emoji: '🫘',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'pc1', nombre: 'Fríjol rojo', emoji: '🫘', precioExtra: 0, foto: '' },
          { id: 'pc2', nombre: 'Arveja con zanahoria', emoji: '🥕', precioExtra: 0, foto: '' },
          { id: 'pc3', nombre: 'Espagueti al ajillo', emoji: '🍝', precioExtra: 0, foto: '' },
        ],
      },
      {
        id: 'g-jugo', nombre: 'Jugo natural', subtitulo: 'Elige 1', emoji: '🧃',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'ju1', nombre: 'Mora', emoji: '🫐', precioExtra: 0, foto: '' },
          { id: 'ju2', nombre: 'Lulo', emoji: '🟢', precioExtra: 0, foto: '' },
          { id: 'ju3', nombre: 'Guayaba', emoji: '🩷', precioExtra: 0, foto: '' },
        ],
      },
      {
        id: 'g-adiciones', nombre: '¿Algo más?', subtitulo: 'Opcional', emoji: '➕',
        tipo: 'multiple', min: 0,
        opciones: [
          { id: 'ad1', nombre: 'Porción extra de proteína', emoji: '🍖', precioExtra: 7000, foto: '' },
          { id: 'ad2', nombre: 'Jugo en leche', emoji: '🥛', precioExtra: 1500, foto: '' },
          { id: 'ad3', nombre: 'Aguacate', emoji: '🥑', precioExtra: 4000, foto: '' },
          { id: 'ad4', nombre: 'Postre del día', emoji: '🍮', precioExtra: 4000, foto: '' },
        ],
      },
    ],
  },

  // 🍗 EJECUTIVOS Y ESPECIALES (carta fija)
  {
    id: 'ejecutivo-casa', categoria: 'ejecutivos', nombre: 'Ejecutivo de la casa',
    descripcion: 'Sopa + seco con doble porción de proteína, jugo natural y postre del día.',
    foto: '/locales/sabor-del-dia/ejecutivo-casa.webp', emoji: '🍗', destacado: true, disponible: true, orden: 2, precio: 19000,
    gruposOpciones: [
      {
        id: 'g-eje-prot', nombre: 'Proteína', subtitulo: 'Elige 1', emoji: '🍗',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'ep1', nombre: 'Pechuga a la plancha', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'ep2', nombre: 'Sobrebarriga en salsa', emoji: '🥩', precioExtra: 2000, foto: '' },
          { id: 'ep3', nombre: 'Chuleta de cerdo', emoji: '🍖', precioExtra: 0, foto: '' },
        ],
      },
    ],
  },
  {
    id: 'bandeja-paisa', categoria: 'ejecutivos', nombre: 'Bandeja paisa',
    descripcion: 'Fríjol, arroz, chicharrón, carne molida, chorizo, huevo, arepa, aguacate y patacón.',
    foto: '/locales/sabor-del-dia/bandeja-paisa.webp', emoji: '🫘', disponible: true, orden: 3, precio: 24000,
  },
  {
    id: 'mojarra-frita', categoria: 'ejecutivos', nombre: 'Mojarra frita',
    descripcion: 'Mojarra entera crocante con arroz, patacón y ensalada.',
    foto: '/locales/sabor-del-dia/mojarra-frita.webp', emoji: '🐟', disponible: true, orden: 4, precio: 28000,
    gruposOpciones: [
      {
        id: 'g-moj-acomp', nombre: 'Acompañamiento', subtitulo: 'Elige 1', emoji: '🍚',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'mo1', nombre: 'Arroz de coco', emoji: '🥥', precioExtra: 0, foto: '' },
          { id: 'mo2', nombre: 'Arroz blanco', emoji: '🍚', precioExtra: 0, foto: '' },
          { id: 'mo3', nombre: 'Doble patacón', emoji: '🍌', precioExtra: 3000, foto: '' },
        ],
      },
    ],
  },

  // 🥣 SOPAS Y CALDOS (carta fija)
  { id: 'caldo-costilla', categoria: 'sopas', nombre: 'Caldo de costilla', descripcion: 'Caldo caliente con costilla, papa y cilantro. Perfecto para arrancar.', foto: '/locales/sabor-del-dia/caldo-costilla.webp', emoji: '🍲', disponible: true, orden: 5, precio: 9000 },
  { id: 'ajiaco', categoria: 'sopas', nombre: 'Ajiaco santafereño', descripcion: 'Tres papas, pollo, mazorca, crema, alcaparras y aguacate.', foto: '/locales/sabor-del-dia/ajiaco.webp', emoji: '🥣', destacado: true, disponible: true, orden: 6, precio: 18000 },
  { id: 'sancocho', categoria: 'sopas', nombre: 'Sancocho especial', descripcion: 'Sancocho de gallina con yuca, plátano y mazorca.', foto: '/locales/sabor-del-dia/sancocho.webp', emoji: '🍜', disponible: true, orden: 7, precio: 16000 },

  // 🥤 BEBIDAS NATURALES (carta fija)
  {
    id: 'jugo-natural', categoria: 'bebidas', nombre: 'Jugo natural', descripcion: 'Fruta fresca, bien frío.',
    foto: '/locales/sabor-del-dia/jugo-natural.webp', emoji: '🧃', disponible: true, orden: 8, precio: 5000,
    gruposOpciones: [
      {
        id: 'g-jugo-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🍓',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'js1', nombre: 'Mora', emoji: '🫐', precioExtra: 0, foto: '' },
          { id: 'js2', nombre: 'Lulo', emoji: '🟢', precioExtra: 0, foto: '' },
          { id: 'js3', nombre: 'Maracuyá', emoji: '🟡', precioExtra: 0, foto: '' },
          { id: 'js4', nombre: 'Mango', emoji: '🥭', precioExtra: 0, foto: '' },
        ],
      },
      {
        id: 'g-jugo-prep', nombre: 'Preparación', subtitulo: 'Elige 1', emoji: '🥛',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'jp1', nombre: 'En agua', emoji: '💧', precioExtra: 0, foto: '' },
          { id: 'jp2', nombre: 'En leche', emoji: '🥛', precioExtra: 1500, foto: '' },
        ],
      },
    ],
  },
  {
    id: 'limonada', categoria: 'bebidas', nombre: 'Limonada natural', descripcion: 'Limonada de la casa.',
    foto: '/locales/sabor-del-dia/limonada.webp', emoji: '🍋', disponible: true, orden: 9, precio: 5000,
    gruposOpciones: [
      {
        id: 'g-lim-tipo', nombre: 'Tipo', subtitulo: 'Elige 1', emoji: '🍋',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'lt1', nombre: 'Natural', emoji: '🍋', precioExtra: 0, foto: '' },
          { id: 'lt2', nombre: 'Cerezada', emoji: '🍒', precioExtra: 1500, foto: '' },
          { id: 'lt3', nombre: 'De coco', emoji: '🥥', precioExtra: 2500, foto: '' },
        ],
      },
    ],
  },
  {
    id: 'gaseosa', categoria: 'bebidas', nombre: 'Gaseosa', descripcion: 'Botella personal bien fría.',
    foto: '/locales/sabor-del-dia/gaseosa.webp', emoji: '🥤', disponible: true, orden: 10, precio: 4000,
    gruposOpciones: [
      {
        id: 'g-gas-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🥤',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'gs1', nombre: 'Cola', emoji: '🥤', precioExtra: 0, foto: '' },
          { id: 'gs2', nombre: 'Naranja', emoji: '🍊', precioExtra: 0, foto: '' },
          { id: 'gs3', nombre: 'Manzana', emoji: '🍎', precioExtra: 0, foto: '' },
          { id: 'gs4', nombre: 'Sin azúcar', emoji: '⚫', precioExtra: 0, foto: '' },
        ],
      },
    ],
  },
  { id: 'agua', categoria: 'bebidas', nombre: 'Agua', descripcion: 'Botella 600 ml.', foto: '/locales/sabor-del-dia/agua.webp', emoji: '💧', disponible: true, orden: 11, precio: 3000 },

  // 🍮 POSTRES (carta fija)
  { id: 'flan', categoria: 'postres', nombre: 'Flan de caramelo', descripcion: 'Cremoso, hecho en casa.', foto: '/locales/sabor-del-dia/flan.webp', emoji: '🍮', disponible: true, orden: 12, precio: 5000 },
  { id: 'arroz-leche', categoria: 'postres', nombre: 'Arroz con leche', descripcion: 'Con canela, a la antigua.', foto: '/locales/sabor-del-dia/arroz-leche.webp', emoji: '🍚', disponible: true, orden: 13, precio: 5000 },
  { id: 'gelatina', categoria: 'postres', nombre: 'Gelatina con fruta', descripcion: 'Ligerita para cerrar.', foto: '/locales/sabor-del-dia/gelatina.webp', emoji: '🍧', disponible: true, orden: 14, precio: 3500 },

  // ➕ ADICIONALES (carta fija)
  { id: 'porcion-proteina', categoria: 'adicionales', nombre: 'Porción de proteína', descripcion: 'Una porción extra.', foto: '/locales/sabor-del-dia/porcion-proteina.webp', emoji: '🍖', disponible: true, orden: 15, precio: 7000 },
  { id: 'porcion-arroz', categoria: 'adicionales', nombre: 'Porción de arroz', descripcion: 'Arroz blanco recién hecho.', foto: '/locales/sabor-del-dia/porcion-arroz.webp', emoji: '🍚', disponible: true, orden: 16, precio: 3000 },
  { id: 'porcion-aguacate', categoria: 'adicionales', nombre: 'Aguacate', descripcion: 'Mitad de aguacate fresco (según cosecha).', foto: '/locales/sabor-del-dia/porcion-aguacate.webp', emoji: '🥑', disponible: true, orden: 17, precio: 4000 },
  { id: 'huevo-frito', categoria: 'adicionales', nombre: 'Huevo frito', descripcion: 'Con la yema blandita.', foto: '/locales/sabor-del-dia/huevo-frito.webp', emoji: '🍳', disponible: true, orden: 18, precio: 2500 },
]
