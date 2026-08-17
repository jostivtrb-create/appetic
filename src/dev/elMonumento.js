// 🍔🍨 EL MONUMENTO — Frutería-Heladería & Comidas Rápidas · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-el-monumento.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// 🎨 Estética sacada del ADN de ESTA marca (su letrero de la calle): fondo VERDE brillante que
//    degrada a AMARILLO, "FRUTERIA-HELADERIA & COMIDAS RAPIDAS" en azul cielo con contorno blanco y
//    "El Monumento" en script NARANJA. De ahí salen: verde de marca (botones, precios, chips),
//    acento NARANJA (nav activo, detalles) y un "mundo" crema verde-limón. Fresco y frutal por un
//    lado, callejero y apetitoso por el otro — distinto a Fruti Tentación (azul sobre amarillo).
//
// 📷 IMÁGENES: NO se generan aquí. Todos los `foto: ''` van vacíos; los prompts están en
//    public/locales/el-monumento/PROMPTS.md y el dueño sube cada foto desde su panel
//    (editar producto → ✨ Crear con IA o 📱 Del dispositivo). Mientras tanto, cada tarjeta se ve
//    con su emoji.
//
// 🧩 MODELO DEL MENÚ (fiel a su carta impresa):
//    • Hamburguesas y perros: en la carta cada uno trae su fila "COMBO (papa francesa + gaseosa)".
//      Aquí se modela como UN producto con el grupo "Presentación" (elige 1: Sola / En combo), que
//      suma la diferencia exacta de su carta. Así el menú no se llena de filas repetidas.
//    • Salchipapas, crepes y ensaladas de fruta: un producto con `variantes` (elige la tuya).
//    • Jugos: un producto con "Sabor" (11 frutas) + "Preparación" (en agua / en leche +$1.000).

export const SLUG = 'el-monumento'

// Correo del DUEÑO que administra el local (entra a /el-monumento/admin con ese Google).
// ⚠️ POR DEFECTO: 'sinfiniity@gmail.com' (NUESTRA cuenta, no la del cliente) hasta que dé su Gmail.
//    Se cambia sin tocar código desde /superadmin (campo 👤) o re-corriendo el seed.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

export const MONUMENTO_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'El Monumento',
  descripcion: 'Frutería-Heladería & Comidas Rápidas · fruta fresca, helado y antojos a la parrilla 🍨🍔',
  // 📱 Número POR DEFECTO (320 843 5143), no el del local: deja el checkout funcionando desde el
  //    minuto uno. Los pedidos llegan a nosotros, no a ellos → el local sigue inactivo en el
  //    buscador (ver `suscripcion`). El dueño pone el real en ⚙️ Configuración → Datos del negocio.
  whatsapp: '573208435143',

  // 🖼️ Logo generado con IA a partir del prompt de PROMPTS.md y recortado a transparente
  //    (el JPEG de Gemini traía el damero de "transparencia" quemado en los píxeles).
  //    Como el emblema YA trae el nombre, el hero lo protagoniza (`hero: 'logo'`).
  logo: '/locales/el-monumento/logo.webp',    // emblema circular transparente (720px = 2× el hero)
  icono: '/locales/el-monumento/icono.webp',  // cuadrado 256px (buscador de locales)
  banner: '',                                 // hero con logo, no banner de foto
  logoAnim: 'arriba',                         // el emblema entra cayendo desde arriba

  tema: {
    primary: '#3FA62E',        // verde brillante del letrero (botones, precios, chips activos)
    primaryStrong: '#25731B',  // verde profundo (variante oscura / degradado)
    primarySoft: '#B7E04A',    // verde-limón que degrada al amarillo del letrero (hero)
    onPrimary: '#FFFFFF',      // texto sobre el verde
    accent: '#F2891C',         // naranja del script "El Monumento" (nav activo, detalles)
    bg: '#F4F6E3',             // "mundo" crema verde-limón, fresco y luminoso
    hero: 'logo',              // hero protagonizado por el emblema (ya trae el nombre dentro)
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
    { id: 'perros', nombre: 'Perros Calientes', emoji: '🌭' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🍟' },
    { id: 'sandwiches', nombre: 'Sándwiches', emoji: '🥪' },
    { id: 'varios', nombre: 'Burritos y Más', emoji: '🌯' },
    { id: 'platos', nombre: 'Platos Fuertes', emoji: '🍖' },
    { id: 'crepes', nombre: 'Crepes', emoji: '🥞' },
    { id: 'ensaladas', nombre: 'Ensaladas de Fruta', emoji: '🍉' },
    { id: 'helados', nombre: 'Helados', emoji: '🍦' },
    { id: 'postres', nombre: 'Postres', emoji: '🍨' },
    { id: 'jugos', nombre: 'Jugos Naturales', emoji: '🧃' },
    { id: 'combos', nombre: 'Combos', emoji: '🍱' },
  ],

  // 🗂️ Etiquetas del INICIO (chips de categorías, catálogo en src/config/categoriasLocales.js).
  etiquetas: ['comida-rapida', 'postres', 'bebidas'],

  admins: [ADMIN_EMAIL],
  // activa:false → NO sale todavía en el buscador del inicio. Se enciende desde /superadmin cuando el
  // local tenga su WhatsApp real (si saliera ahora, un cliente pediría y el pedido llegaría al número
  // por defecto, no al de El Monumento).
  suscripcion: { activa: false, plan: 'piloto' },
  menuVersion: 1,
}

// Grupo reutilizable: "Sola o en combo". Cada producto pasa su propia diferencia de precio,
// tal cual la fila COMBO de su carta impresa.
const presentacion = (extraCombo, textoCombo = 'papa francesa + gaseosa') => ({
  id: 'g-presentacion',
  nombre: 'Presentación',
  subtitulo: 'Elige 1',
  emoji: '🍟',
  tipo: 'unica',
  min: 1,
  max: 1,
  opciones: [
    { id: 'sola', nombre: 'Sola', emoji: '🍔', precioExtra: 0, foto: '' },
    { id: 'combo', nombre: `En combo (${textoCombo})`, emoji: '🥤', precioExtra: extraCombo, foto: '' },
  ],
})

export const MONUMENTO_PRODUCTOS = [
  // ══════════════════ 🍔 HAMBURGUESAS ══════════════════
  { id: 'ham-sencilla', categoria: 'hamburguesas', nombre: 'Hamburguesa Sencilla',
    descripcion: 'Carne corriente grande, ½ queso, ½ jamón, tomate, cebolla y lechuga.',
    foto: '', emoji: '🍔', disponible: true, orden: 1, precio: 5200,
    gruposOpciones: [presentacion(4800, 'papa francesa + gaseosa pequeña')] },

  { id: 'ham-semi-ahumada', categoria: 'hamburguesas', nombre: 'Hamburguesa Semi-Ahumada',
    descripcion: 'Queso, jamón, tomate, cebolla y lechuga sobre carne semi-ahumada.',
    foto: '', emoji: '🍔', disponible: true, orden: 2, precio: 7500,
    gruposOpciones: [presentacion(3500)] },

  { id: 'ham-especial', categoria: 'hamburguesas', nombre: 'Hamburguesa Especial',
    descripcion: 'Carne, queso, jamón, tomate, cebolla y lechuga. La de siempre, bien servida.',
    foto: '', emoji: '🍔', destacado: true, disponible: true, orden: 3, precio: 7500,
    gruposOpciones: [presentacion(3500)] },

  { id: 'ham-apanada', categoria: 'hamburguesas', nombre: 'Hamburguesa Apanada',
    descripcion: 'Carne de pollo apanada, queso, jamón, mortadela, tomate, cebolla y lechuga.',
    foto: '', emoji: '🍗', disponible: true, orden: 4, precio: 9000,
    gruposOpciones: [presentacion(3500)] },

  { id: 'ham-ahumada', categoria: 'hamburguesas', nombre: 'Hamburguesa Ahumada',
    descripcion: 'Carne ahumada, queso, mortadela, 2 tocinetas, tomate, cebolla y lechuga.',
    foto: '', emoji: '🥓', destacado: true, disponible: true, orden: 5, precio: 9000,
    gruposOpciones: [presentacion(3500)] },

  { id: 'ham-ahumada-pollo', categoria: 'hamburguesas', nombre: 'Ahumada + Pollo',
    descripcion: 'Carne ahumada, pollo, jamón de cordero, queso, jamón, tomate, cebolla y lechuga.',
    foto: '', emoji: '🍔', disponible: true, orden: 6, precio: 9500,
    gruposOpciones: [presentacion(3500)] },

  { id: 'ham-ahumada-cerdo', categoria: 'hamburguesas', nombre: 'Ahumada + Cerdo',
    descripcion: 'Carne ahumada, cerdo, jamón de cordero, queso, mortadela, tocineta, tomate, cebolla y lechuga.',
    foto: '', emoji: '🍔', disponible: true, orden: 7, precio: 9500,
    gruposOpciones: [presentacion(4000)] },

  { id: 'ham-doble-queso', categoria: 'hamburguesas', nombre: 'Hamburguesa Doble Queso',
    descripcion: 'Carne ahumada, doble queso, carne picada con salsa de champiñones, cordero, tomate, cebolla y lechuga.',
    foto: '', emoji: '🧀', destacado: true, disponible: true, orden: 8, precio: 12500,
    gruposOpciones: [presentacion(1500)] },

  { id: 'ham-doble-carne', categoria: 'hamburguesas', nombre: 'Hamburguesa Doble Carne',
    descripcion: 'Apanada + carne semi-ahumada, queso, jamón, mortadela, tomate, cebolla y lechuga. Para el hambre grande.',
    foto: '', emoji: '🍔', disponible: true, orden: 9, precio: 13500,
    gruposOpciones: [presentacion(2500)] },

  // ══════════════════ 🌭 PERROS CALIENTES ══════════════════
  { id: 'perro-especial', categoria: 'perros', nombre: 'Perro Especial',
    descripcion: 'Salchicha, queso, jamón y papa. El clásico de la casa.',
    foto: '', emoji: '🌭', disponible: true, orden: 1, precio: 5500,
    gruposOpciones: [presentacion(4500, 'papa francesa + gaseosa 250 ml')] },

  { id: 'choriperro', categoria: 'perros', nombre: 'Choriperro',
    descripcion: 'Chorizo, salchicha ranchera grande, queso, cordero y papa.',
    foto: '', emoji: '🌭', destacado: true, disponible: true, orden: 2, precio: 8000,
    gruposOpciones: [presentacion(3500)] },

  { id: 'perro-super', categoria: 'perros', nombre: 'Perro Super',
    descripcion: 'Salchicha tipo americana, queso, jamón y papa.',
    foto: '', emoji: '🌭', disponible: true, orden: 3, precio: 8000,
    gruposOpciones: [presentacion(3500)] },

  { id: 'perro-super-carne', categoria: 'perros', nombre: 'Super + Carne',
    descripcion: 'Salchicha tipo americana, carne, queso, jamón de cordero y papa.',
    foto: '', emoji: '🌭', disponible: true, orden: 4, precio: 8500,
    gruposOpciones: [presentacion(3500)] },

  { id: 'perro-super-pollo', categoria: 'perros', nombre: 'Super + Pollo',
    descripcion: 'Salchicha tipo americana, pollo, queso, jamón de cordero y papa.',
    foto: '', emoji: '🌭', disponible: true, orden: 5, precio: 8500,
    gruposOpciones: [presentacion(3500)] },

  { id: 'perro-super-cerdo', categoria: 'perros', nombre: 'Super + Cerdo',
    descripcion: 'Salchicha tipo americana, carne de cerdo, queso, jamón de cordero y papa.',
    foto: '', emoji: '🌭', disponible: true, orden: 6, precio: 8500,
    gruposOpciones: [presentacion(3500)] },

  { id: 'perro-super-mixto', categoria: 'perros', nombre: 'Super Mixto',
    descripcion: 'Salchicha tipo americana, carne y pollo, queso, jamón de cordero, mortadela y papa.',
    foto: '', emoji: '🌭', destacado: true, disponible: true, orden: 7, precio: 10000,
    gruposOpciones: [presentacion(3500)] },

  { id: 'perro-super-tocineta', categoria: 'perros', nombre: 'Super + Tocineta',
    descripcion: 'Salchicha tipo americana, pollo en salsa de champiñones, cordero, queso y tocineta.',
    foto: '', emoji: '🥓', disponible: true, orden: 8, precio: 11500,
    gruposOpciones: [presentacion(2500)] },

  // ══════════════════ 🍟 SALCHIPAPAS ══════════════════
  // Toda la sección en UN producto: cambia la proteína, no el plato. Elige la tuya.
  { id: 'salchipapa', categoria: 'salchipapas', nombre: 'Salchipapa',
    descripcion: 'Papa francesa recién hecha con tus proteínas y salsas de la casa. Elige la tuya.',
    foto: '', emoji: '🍟', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'sp-sencilla', nombre: 'Sencilla (salchicha)', precio: 6500 },
      { id: 'sp-choripapa', nombre: 'Choripapa (chorizo)', precio: 7500 },
      { id: 'sp-especial', nombre: 'Especial (salchicha, jamón ahumado y queso)', precio: 10000 },
      { id: 'sp-carne', nombre: 'Carne (salchicha + carne)', precio: 12500 },
      { id: 'sp-cerdo', nombre: 'Cerdo (salchicha + cerdo)', precio: 12500 },
      { id: 'sp-pollo', nombre: 'Pollo (salchicha + pollo)', precio: 12500 },
      { id: 'sp-chorizo-carne', nombre: 'Chorizo-Carne', precio: 13500 },
      { id: 'sp-cerdo-res', nombre: 'Cerdo-Res', precio: 14000 },
      { id: 'sp-pollo-carne', nombre: 'Pollo-Carne', precio: 14000 },
      { id: 'sp-pollo-carne-cerdo', nombre: 'Pollo-Carne-Cerdo', precio: 15000 },
      { id: 'sp-completa', nombre: 'Pollo-Carne-Cerdo-Chorizo', precio: 18500 },
    ] },

  // ══════════════════ 🥪 SÁNDWICHES ══════════════════
  { id: 'sandwich-sencillo', categoria: 'sandwiches', nombre: 'Sándwich Sencillo',
    descripcion: 'Pan tajado, jamón ahumado y queso. Sencillo y rendidor.',
    foto: '', emoji: '🥪', disponible: true, orden: 1, precio: 2500 },

  { id: 'sandwich-especial', categoria: 'sandwiches', nombre: 'Sándwich Especial',
    descripcion: 'Pan blandito, jamón ahumado, jamón de cordero, mortadela jamonada, queso, lechuga, tomate y salsas.',
    foto: '', emoji: '🥪', destacado: true, disponible: true, orden: 2, precio: 7000 },

  { id: 'sandwich-pollo', categoria: 'sandwiches', nombre: 'Sándwich de Pollo',
    descripcion: 'Pan blandito, queso, pollo, lechuga, tomate y salsa.',
    foto: '', emoji: '🥪', disponible: true, orden: 3, precio: 9000 },

  { id: 'sandwich-super', categoria: 'sandwiches', nombre: 'Sándwich Super',
    descripcion: 'Pan blandito, jamón ahumado, queso, jamón de cordero, pollo, tocineta, mortadela jamonada, lechuga, tomate y salsas.',
    foto: '', emoji: '🥪', disponible: true, orden: 4, precio: 11000 },

  // ══════════════════ 🌯 BURRITOS Y MÁS ══════════════════
  { id: 'mazorcada', categoria: 'varios', nombre: 'Mazorcada',
    descripcion: 'Mazorca, pollo, carne, salchicha, queso, papa triturada y papa francesa. Plato para compartir.',
    foto: '', emoji: '🌽', destacado: true, disponible: true, orden: 1, precio: 14000 },

  { id: 'burrito-casero', categoria: 'varios', nombre: 'Burrito Casero',
    descripcion: 'Tortilla, queso, jamón de cordero, tocineta, maíz, pollo, carne, tomate y lechuga.',
    foto: '', emoji: '🌯', disponible: true, orden: 2, precio: 12000 },

  { id: 'burrito-carne', categoria: 'varios', nombre: 'Burrito de Carne',
    descripcion: 'Tortilla, queso y 250 g de carne molida sazonada con salsa de ají jalapeño y cebolla.',
    foto: '', emoji: '🌯', disponible: true, orden: 3, precio: 10000 },

  { id: 'burrito-saludable', categoria: 'varios', nombre: 'Burrito Saludable',
    descripcion: 'Tortilla, lechuga, queso, cordero, pollo y tomate. Fresco y liviano.',
    foto: '', emoji: '🥗', disponible: true, orden: 4, precio: 6500 },

  { id: 'club-house', categoria: 'varios', nombre: 'Club House',
    descripcion: 'Pan tajado, tocineta, pollo, huevo, jamón, queso, lechuga y papa francesa.',
    foto: '', emoji: '🥪', disponible: true, orden: 5, precio: 10000 },

  // ══════════════════ 🍖 PLATOS FUERTES ══════════════════
  { id: 'pechuga-gratinada', categoria: 'platos', nombre: 'Pechuga Gratinada',
    descripcion: 'Pechuga gratinada con maíz tierno, papa y ensalada fresca.',
    foto: '', emoji: '🍗', destacado: true, disponible: true, orden: 1, precio: 20500 },

  { id: 'carne-asada', categoria: 'platos', nombre: 'Carne Asada',
    descripcion: 'Carne asada al punto con papa francesa y ensalada fresca.',
    foto: '', emoji: '🥩', destacado: true, disponible: true, orden: 2, precio: 22500 },

  // ══════════════════ 🥞 CREPES ══════════════════
  { id: 'crepe', categoria: 'crepes', nombre: 'Crepe',
    descripcion: 'Crepe recién hecho, dulce o salado. Elige tu relleno.',
    foto: '', emoji: '🥞', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'crepe-queso-bocadillo', nombre: 'Queso y bocadillo', precio: 5000 },
      { id: 'crepe-solo-queso', nombre: 'Solo queso', precio: 5500 },
      { id: 'crepe-queso-arequipe', nombre: 'Queso y arequipe', precio: 5500 },
      { id: 'crepe-cordero', nombre: 'Cordero, jamón ahumado, mortadela y queso', precio: 6000 },
      { id: 'crepe-pollo-champinones', nombre: 'Queso, pollo desmenuzado y salsa de champiñones', precio: 10000 },
    ] },

  // ══════════════════ 🍉 ENSALADAS DE FRUTA ══════════════════
  { id: 'ensalada-fruta', categoria: 'ensaladas', nombre: 'Ensalada de Fruta',
    descripcion: 'Fruta fresca picada con crema, queso rallado, salsas y toppings. Elige el tamaño.',
    foto: '', emoji: '🍨', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'ens-mini', nombre: 'Mini', precio: 3000 },
      { id: 'ens-junior-sin', nombre: 'Junior sin helado', precio: 5000 },
      { id: 'ens-natural', nombre: 'Natural (solo fruta)', precio: 7000 },
      { id: 'ens-junior-con', nombre: 'Junior con helado', precio: 7500 },
      { id: 'ens-sencilla-sin', nombre: 'Sencilla sin helado', precio: 8000 },
      { id: 'ens-especial-con', nombre: 'Especial con helado', precio: 9500 },
      { id: 'ens-especial-mixta', nombre: 'Especial mixta', precio: 10000 },
      { id: 'ens-granola-yogurt', nombre: 'Con granola y yogurt', precio: 10000 },
      { id: 'ens-super-especial', nombre: 'Super especial', precio: 12500 },
      { id: 'ens-mega', nombre: 'Mega', precio: 18000 },
    ] },

  // ══════════════════ 🍦 HELADOS ══════════════════
  { id: 'helado-buho', categoria: 'helados', nombre: 'Búho',
    descripcion: 'Helado decorado con carita de búho. El favorito de los niños.',
    foto: '', emoji: '🦉', disponible: true, orden: 1, precio: 4000 },

  { id: 'helado-mickey', categoria: 'helados', nombre: 'Mickey',
    descripcion: 'Helado decorado con orejitas y carita de Mickey.',
    foto: '', emoji: '🐭', destacado: true, disponible: true, orden: 2, precio: 4000 },

  { id: 'helado-ratoncito', categoria: 'helados', nombre: 'Ratoncito',
    descripcion: 'Helado decorado con carita de ratoncito y grageas de colores.',
    foto: '', emoji: '🐭', disponible: true, orden: 3, precio: 4000 },

  { id: 'helado-minnie', categoria: 'helados', nombre: 'Minnie',
    descripcion: 'Helado decorado con moñito y carita de Minnie.',
    foto: '', emoji: '🎀', disponible: true, orden: 4, precio: 5000 },

  { id: 'copa-payasito', categoria: 'helados', nombre: 'Copa de Helado Payasito',
    descripcion: 'Copa de helado con cono de sombrero, grageas y carita de payasito.',
    foto: '', emoji: '🤡', disponible: true, orden: 5, precio: 5000 },

  { id: 'copa-cuncum', categoria: 'helados', nombre: 'Copa de Helado Cuncum',
    descripcion: 'Copa de helado decorada con galleta, grageas y salsas de colores.',
    foto: '', emoji: '🍦', disponible: true, orden: 6, precio: 7000 },

  { id: 'copa-frutas', categoria: 'helados', nombre: 'Copa de Helado con Frutas',
    descripcion: 'Copa de helado con fruta fresca, crema chantilly y salsas.',
    foto: '', emoji: '🍧', destacado: true, disponible: true, orden: 7, precio: 7000 },

  { id: 'helado-nieve', categoria: 'helados', nombre: 'Helado de Nieve',
    descripcion: 'Helado de nieve en cono, decorado con grageas y salsas.',
    foto: '', emoji: '🍦', disponible: true, orden: 8, precio: 7000 },

  { id: 'canasta-helado', categoria: 'helados', nombre: 'Canasta de Helado',
    descripcion: 'Canastica crocante con helado, fruta y salsa de frutos rojos.',
    foto: '', emoji: '🧺', disponible: true, orden: 9, precio: 7000 },

  // ══════════════════ 🍨 POSTRES ══════════════════
  { id: 'milo-frio', categoria: 'postres', nombre: 'Milo Frío',
    descripcion: 'Milo bien frío y cremoso, servido en copa.',
    foto: '', emoji: '🥛', disponible: true, orden: 1, precio: 6000 },

  { id: 'copa-helado-pequena', categoria: 'postres', nombre: 'Copa de Helado Pequeña',
    descripcion: 'Copa de helado con salsas y toppings, en porción personal.',
    foto: '', emoji: '🍨', disponible: true, orden: 2, precio: 6000 },

  { id: 'salpicon', categoria: 'postres', nombre: 'Salpicón',
    descripcion: 'Salpicón de frutas bien frío, servido en copa alta.',
    foto: '', emoji: '🍹', disponible: true, orden: 3, precio: 7500 },

  { id: 'merengon', categoria: 'postres', nombre: 'Merengón',
    descripcion: 'Merengue crocante con crema de leche, fruta y salsa de frutos rojos.',
    foto: '', emoji: '🍰', destacado: true, disponible: true, orden: 4, precio: 8000 },

  { id: 'fresas-crema', categoria: 'postres', nombre: 'Fresas con Crema',
    descripcion: 'Fresas frescas con crema de leche y salsa.',
    foto: '', emoji: '🍓', destacado: true, disponible: true, orden: 5, precio: 8000 },

  { id: 'brownie-helado', categoria: 'postres', nombre: 'Brownie con Helado',
    descripcion: 'Brownie de chocolate tibio con helado, crema chantilly y salsas.',
    foto: '', emoji: '🍫', destacado: true, disponible: true, orden: 6, precio: 8500 },

  { id: 'fresas-crema-helado', categoria: 'postres', nombre: 'Fresas con Crema y Helado',
    descripcion: 'Fresas frescas con crema de leche, helado y salsa de frutos rojos.',
    foto: '', emoji: '🍓', disponible: true, orden: 7, precio: 9000 },

  { id: 'salpicon-helado', categoria: 'postres', nombre: 'Salpicón con Helado',
    descripcion: 'Salpicón de frutas coronado con una bola de helado.',
    foto: '', emoji: '🍹', disponible: true, orden: 8, precio: 9000 },

  { id: 'banana-split', categoria: 'postres', nombre: 'Banana Split',
    descripcion: 'Banano abierto con helado, crema chantilly, salsas y maní.',
    foto: '', emoji: '🍌', disponible: true, orden: 9, precio: 9000 },

  { id: 'postre-helado', categoria: 'postres', nombre: 'Postre de Helado',
    descripcion: 'Postre de helado con fruta, crema y salsas de la casa.',
    foto: '', emoji: '🍨', disponible: true, orden: 10, precio: 9000 },

  { id: 'copa-helado-grande', categoria: 'postres', nombre: 'Copa de Helado',
    descripcion: 'Copa grande de helado con salsas, grageas y crema chantilly.',
    foto: '', emoji: '🍨', disponible: true, orden: 11, precio: 9000 },

  { id: 'postre-galleta', categoria: 'postres', nombre: 'Postre Helado con Galleta',
    descripcion: 'Helado con galleta, chocolate, crema y toppings de colores.',
    foto: '', emoji: '🍪', disponible: true, orden: 12, precio: 9500 },

  { id: 'choky-helado', categoria: 'postres', nombre: 'Choky-Helado',
    descripcion: 'Helado con chocolate, mora, crema chantilly y barquillos.',
    foto: '', emoji: '🍫', disponible: true, orden: 13, precio: 9500 },

  { id: 'malteada', categoria: 'postres', nombre: 'Malteada',
    descripcion: 'Malteada cremosa servida en copa alta con crema.',
    foto: '', emoji: '🥤', destacado: true, disponible: true, orden: 14, precio: 10000 },

  { id: 'malteada-brownie', categoria: 'postres', nombre: 'Malteada Especial + Brownie',
    descripcion: 'Malteada especial acompañada de brownie de chocolate.',
    foto: '', emoji: '🥤', disponible: true, orden: 15, precio: 13000 },

  // ══════════════════ 🧃 JUGOS NATURALES ══════════════════
  // Un solo producto: elige la fruta y si lo quieres en agua o en leche (+$1.000).
  { id: 'jugo-natural', categoria: 'jugos', nombre: 'Jugo Natural',
    descripcion: 'Jugo de fruta natural, hecho al momento. Elige la fruta y la preparación.',
    foto: '', emoji: '🧃', destacado: true, disponible: true, orden: 1, precio: 5000,
    gruposOpciones: [
      { id: 'g-sabor', nombre: 'Fruta', subtitulo: 'Elige 1', emoji: '🍓',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'j-guanabana', nombre: 'Guanábana', emoji: '🥭', precioExtra: 0, foto: '' },
          { id: 'j-fresa', nombre: 'Fresa', emoji: '🍓', precioExtra: 0, foto: '' },
          { id: 'j-lulo', nombre: 'Lulo', emoji: '🍊', precioExtra: 0, foto: '' },
          { id: 'j-mora', nombre: 'Mora', emoji: '🫐', precioExtra: 0, foto: '' },
          { id: 'j-melon', nombre: 'Melón', emoji: '🍈', precioExtra: 0, foto: '' },
          { id: 'j-mango', nombre: 'Mango', emoji: '🥭', precioExtra: 0, foto: '' },
          { id: 'j-papaya', nombre: 'Papaya', emoji: '🍑', precioExtra: 0, foto: '' },
          { id: 'j-banano', nombre: 'Banano', emoji: '🍌', precioExtra: 0, foto: '' },
          { id: 'j-maracuya', nombre: 'Maracuyá', emoji: '🍋', precioExtra: 0, foto: '' },
          { id: 'j-borojo', nombre: 'Borojó', emoji: '🟤', precioExtra: 0, foto: '' },
          { id: 'j-tomate-arbol', nombre: 'Tomate de árbol', emoji: '🍅', precioExtra: 0, foto: '' },
        ] },
      { id: 'g-preparacion', nombre: 'Preparación', subtitulo: 'Elige 1', emoji: '🥛',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'j-agua', nombre: 'En agua', emoji: '💧', precioExtra: 0, foto: '' },
          { id: 'j-leche', nombre: 'En leche', emoji: '🥛', precioExtra: 1000, foto: '' },
        ] },
    ] },

  // ══════════════════ 🍱 COMBOS ══════════════════
  { id: 'combo-2', categoria: 'combos', nombre: 'Combo 2 · Ensalada Natural + Jugo',
    descripcion: 'Ensalada de fruta natural acompañada de un jugo a tu elección.',
    foto: '', emoji: '🥤', disponible: true, orden: 2, precio: 8500 },

  { id: 'combo-1', categoria: 'combos', nombre: 'Combo 1 · Porción de Fruta + Sándwich + Jugo',
    descripcion: 'Porción de fruta fresca, sándwich y jugo natural. El desayuno completo.',
    foto: '', emoji: '🍱', destacado: true, disponible: true, orden: 1, precio: 9000 },

  { id: 'combo-5', categoria: 'combos', nombre: 'Combo 5 · Ensalada Especial + Jugo',
    descripcion: 'Ensalada de fruta especial con helado y un jugo natural.',
    foto: '', emoji: '🍨', disponible: true, orden: 5, precio: 12500 },

  { id: 'combo-6', categoria: 'combos', nombre: 'Combo 6 · Sándwich Especial + Jugo',
    descripcion: 'Sándwich especial de la casa con un jugo natural.',
    foto: '', emoji: '🥪', disponible: true, orden: 6, precio: 12500 },

  { id: 'combo-3', categoria: 'combos', nombre: 'Combo 3 · Malteada + Ensalada Especial',
    descripcion: 'Malteada cremosa junto a una ensalada de fruta especial.',
    foto: '', emoji: '🥤', destacado: true, disponible: true, orden: 3, precio: 13500 },

  { id: 'combo-4', categoria: 'combos', nombre: 'Combo 4 · Ensalada Sencilla + Jugo + Sándwich',
    descripcion: 'Ensalada de fruta sencilla, jugo natural y sándwich. Para quedar bien lleno.',
    foto: '', emoji: '🍱', disponible: true, orden: 4, precio: 14000 },
]
