// ✈️ PILOTOS BURGER HOUSE — datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-pilotos.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// Estética basada en el logo (aviación / "Top Gun"): rojo aeronáutico + cromo/acero +
// brasa de fuego, sobre un "mundo" acero-cielo frío (distinto del crema de los otros locales).
// Carta enorme (hamburguesas, perros, mazorcadas, pizzas, especiales, bebidas...): cada ítem
// se modela para que sus opciones FUNCIONEN (variantes de tamaño / "elige 1" / adiciones).

export const SLUG = 'pilotos'

// Correo del DUEÑO que administra el local (entra a /pilotos/admin con ese Google).
// 👉 De momento queda el correo de pruebas; cámbialo por el del dueño real antes de entregar
//    (basta re-correr el seed con el correo correcto).
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

// ➕ Hangar de adiciones: aplica a las hamburguesas (elige las que quieras).
const ADICIONES = {
  id: 'g-adic', nombre: 'Hangar de adiciones', subtitulo: 'Opcional · las que quieras', emoji: '➕',
  tipo: 'multiple', min: 0,
  opciones: [
    { id: 'ad-huevo', nombre: 'Huevo', emoji: '🍳', precioExtra: 2000, foto: '' },
    { id: 'ad-tocineta', nombre: 'Tocineta', emoji: '🥓', precioExtra: 2000, foto: '' },
    { id: 'ad-maiz', nombre: 'Maíz', emoji: '🌽', precioExtra: 2000, foto: '' },
    { id: 'ad-champinon', nombre: 'Champiñón', emoji: '🍄', precioExtra: 1800, foto: '' },
    { id: 'ad-pepinillos', nombre: 'Pepinillos', emoji: '🥒', precioExtra: 2300, foto: '' },
    { id: 'ad-pepperoni', nombre: 'Pepperoni', emoji: '🍕', precioExtra: 2200, foto: '' },
    { id: 'ad-carne', nombre: 'Carne de res', emoji: '🥩', precioExtra: 6000, foto: '' },
    { id: 'ad-pollo', nombre: 'Pollo apanado', emoji: '🍗', precioExtra: 6000, foto: '' },
    { id: 'ad-chorizo', nombre: 'Chorizo (tajadas)', emoji: '🌭', precioExtra: 2000, foto: '' },
    { id: 'ad-cheddar', nombre: 'Queso cheddar', emoji: '🧀', precioExtra: 1600, foto: '' },
    { id: 'ad-patacon', nombre: 'Láminas de patacón x2', emoji: '🫓', precioExtra: 2000, foto: '' },
    { id: 'ad-pina', nombre: 'Cubos de piña', emoji: '🍍', precioExtra: 1800, foto: '' },
  ],
}

// 🥤 Combo opcional para hamburguesas (papas + bebida).
const COMBO = {
  id: 'g-combo', nombre: '¿Lo llevas en combo?', subtitulo: 'Opcional', emoji: '🥤',
  tipo: 'unica', min: 0, max: 1,
  opciones: [
    { id: 'cb-no', nombre: 'Sin combo (solo la hamburguesa)', emoji: '🍔', precioExtra: 0, foto: '' },
    { id: 'cb-gaseosa', nombre: 'Papas + gaseosa', emoji: '🥤', precioExtra: 7500, foto: '' },
    { id: 'cb-jugo', nombre: 'Papas + jugo natural', emoji: '🧃', precioExtra: 11000, foto: '' },
  ],
}

export const PILOTOS_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Pilotos Burger House',
  descripcion: 'Volamos por los sabores · hamburguesas, perros, pizzas y más 🛫',
  // El dueño lo confirma desde el panel. Pre-cargado con la línea de DOMICILIOS del menú.
  whatsapp: '573214226828',
  logo: '/locales/pilotos/logo.png',
  banner: '/locales/pilotos/banner.webp',
  tema: {
    primary: '#D11A2A',        // rojo aeronáutico (bandas del logo)
    primaryStrong: '#9E0E1E',  // rojo oscuro
    primarySoft: '#F26A21',    // brasa / fuego (glow del logo)
    onPrimary: '#FFFFFF',
    accent: '#3B4A5A',         // gunmetal / acero de las alas
    bg: '#ECEFF4',             // "mundo" acero-cielo frío detrás del menú
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
    { id: 'despegue', nombre: 'Zona de Despegue', emoji: '🛫' },
    { id: 'porciones', nombre: 'Porciones de Vuelo', emoji: '🍟' },
    { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔' },
    { id: 'perros', nombre: 'Perros Calientes', emoji: '🌭' },
    { id: 'papas', nombre: 'Papas Turbulentas', emoji: '🍟' },
    { id: 'mazorcadas', nombre: 'Mazorcadas', emoji: '🌽' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🥓' },
    { id: 'patacones', nombre: 'Patacones', emoji: '🫓' },
    { id: 'burritos', nombre: 'Burritos & Dorilocos', emoji: '🌯' },
    { id: 'alitas', nombre: 'Alitas', emoji: '🍗' },
    { id: 'costillas', nombre: 'Costillas BBQ', emoji: '🍖' },
    { id: 'picadas', nombre: 'Picadas', emoji: '🍢' },
    { id: 'sandwich', nombre: 'Sándwich', emoji: '🥪' },
    { id: 'especiales', nombre: 'Especiales', emoji: '🥩' },
    { id: 'lasanas', nombre: 'Lasañas', emoji: '🍝' },
    { id: 'panzerottis', nombre: 'Panzerottis', emoji: '🥟' },
    { id: 'pizzas', nombre: 'Pizzas', emoji: '🍕' },
    { id: 'infantil', nombre: 'Menú Infantil', emoji: '🧒' },
    { id: 'malteadas', nombre: 'Malteadas', emoji: '🥤' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🧃' },
    { id: 'cervezas', nombre: 'Cervezas', emoji: '🍺' },
  ],
  admins: [ADMIN_EMAIL],
  suscripcion: { activa: true, plan: 'piloto' },
  menuVersion: 1,
}

export const PILOTOS_PRODUCTOS = [
  // ── 🛫 ZONA DE DESPEGUE (entradas para picar)
  { id: 'empanadas-coctel', categoria: 'despegue', nombre: 'Empanadas tipo cóctel', descripcion: '8 unidades crocantes acompañadas de papa criolla.', foto: '', emoji: '🥟', disponible: true, orden: 1, precio: 11800 },
  { id: 'laminas-patacon', categoria: 'despegue', nombre: 'Láminas de patacón con ahogado', descripcion: 'Patacón en láminas bañado en ahogado de la casa.', foto: '', emoji: '🫓', disponible: true, orden: 2, precio: 9800 },
  { id: 'chorizos-santarrosanos', categoria: 'despegue', nombre: 'Chorizos santarrosanos', descripcion: '2 unidades a la parrilla con arepa.', foto: '', emoji: '🌭', disponible: true, orden: 3, precio: 12800 },
  { id: 'nachos-pista09', categoria: 'despegue', nombre: 'Nachos Pista 09', descripcion: 'Nachos con carne, chorizo, guacamole y pico de gallo.', foto: '/locales/pilotos/nachos.webp', emoji: '🧀', destacado: true, disponible: true, orden: 4, precio: 16000 },
  { id: 'mini-picada', categoria: 'despegue', nombre: 'Mini picada', descripcion: 'Papa criolla + 5 empanadas y chorizo. Para compartir.', foto: '/locales/pilotos/picada.webp', emoji: '🍢', disponible: true, orden: 5, precio: 15000 },

  // ── 🍟 PORCIONES DE VUELO
  { id: 'porcion-papa-criolla', categoria: 'porciones', nombre: 'Papas criollas', descripcion: 'Doraditas y crocantes.', foto: '', emoji: '🥔', disponible: true, orden: 6, precio: 5000 },
  { id: 'porcion-papa-francesa', categoria: 'porciones', nombre: 'Papas francesas', descripcion: 'Recién hechas, con sal.', foto: '', emoji: '🍟', disponible: true, orden: 7, precio: 6000 },
  { id: 'porcion-papa-francesa-xl', categoria: 'porciones', nombre: 'Papas francesas XL', descripcion: 'Porción grande para compartir.', foto: '', emoji: '🍟', disponible: true, orden: 8, precio: 11000 },
  { id: 'porcion-aros-cebolla', categoria: 'porciones', nombre: 'Aros de cebolla x6', descripcion: '6 aros de cebolla apanados y crocantes.', foto: '', emoji: '🧅', disponible: true, orden: 9, precio: 6000 },
  { id: 'porcion-chorizo', categoria: 'porciones', nombre: 'Chorizo santarrosano', descripcion: 'Un chorizo a la parrilla.', foto: '', emoji: '🌭', disponible: true, orden: 10, precio: 5500 },
  { id: 'porcion-nuggets', categoria: 'porciones', nombre: 'Nuggets (5 und)', descripcion: '5 nuggets de pollo crocantes.', foto: '', emoji: '🍗', disponible: true, orden: 11, precio: 5500 },
  { id: 'porcion-huevos-codorniz', categoria: 'porciones', nombre: 'Huevos de codorniz x5', descripcion: '5 huevitos de codorniz.', foto: '', emoji: '🥚', disponible: true, orden: 12, precio: 3000 },

  // ── 🍔 HAMBURGUESAS (con hangar de adiciones + combo opcional)
  { id: 'burger-clasica', categoria: 'hamburguesas', nombre: 'La Clásica', descripcion: 'Carne artesanal 100% de res, queso cheddar, vegetales frescos y salsas de la casa.', foto: '/locales/pilotos/burger-clasica.webp', emoji: '🍔', destacado: true, disponible: true, orden: 13, precio: 15000, gruposOpciones: [ADICIONES, COMBO] },
  { id: 'burger-pollo-clasica', categoria: 'hamburguesas', nombre: 'Pollo Clásica', descripcion: 'Pollo apanado crocante, queso cheddar, vegetales y salsas.', foto: '/locales/pilotos/burger-pollo.webp', emoji: '🍔', disponible: true, orden: 14, precio: 15000, gruposOpciones: [ADICIONES, COMBO] },
  { id: 'burger-turbina-mexicana', categoria: 'hamburguesas', nombre: 'Turbina Mexicana', descripcion: 'Carne 100% de res, cheddar, jamón, tocineta, guacamole, nachos, jalapeños y vegetales.', foto: '/locales/pilotos/burger-mexicana.webp', emoji: '🌶️', destacado: true, disponible: true, orden: 15, precio: 22500, gruposOpciones: [ADICIONES, COMBO] },
  { id: 'burger-avioneta-criolla', categoria: 'hamburguesas', nombre: 'Avioneta Criolla', descripcion: 'Carne 100% de res, cheddar, jamón, tocineta, huevo frito, maíz, vegetales y salsas.', foto: '/locales/pilotos/burger-criolla.webp', emoji: '🍳', disponible: true, orden: 16, precio: 22700, gruposOpciones: [ADICIONES, COMBO] },
  { id: 'burger-air-for-one', categoria: 'hamburguesas', nombre: 'Air For One', descripcion: 'Carne 100% de res + pollo apanado, cheddar, jamón, vegetales y salsas.', foto: '/locales/pilotos/burger-mexicana.webp', emoji: '🍔', disponible: true, orden: 17, precio: 24000, gruposOpciones: [ADICIONES, COMBO] },
  { id: 'burger-todo-terreno', categoria: 'hamburguesas', nombre: 'Pilotos Todo Terreno', descripcion: 'Carne 100% de res, cheddar, jamón, tocineta, aritos de cebolla, plátano maduro y salsas.', foto: '/locales/pilotos/burger-criolla.webp', emoji: '🍔', disponible: true, orden: 18, precio: 25800, gruposOpciones: [ADICIONES, COMBO] },
  { id: 'burger-hercules-doble', categoria: 'hamburguesas', nombre: 'Hércules Doble Carne', descripcion: 'Doble carne 100% de res, cheddar, jamón, tocineta, vegetales y salsas.', foto: '/locales/pilotos/burger-destroyer.webp', emoji: '🍔', disponible: true, orden: 19, precio: 24200, gruposOpciones: [ADICIONES, COMBO] },
  { id: 'burger-destroyer', categoria: 'hamburguesas', nombre: 'Destroyer', descripcion: 'Triple carne 100% de res, cheddar, mozzarella, doble jamón, tocineta y vegetales. Para valientes.', foto: '/locales/pilotos/burger-destroyer.webp', emoji: '🔥', destacado: true, disponible: true, orden: 20, precio: 33000, gruposOpciones: [ADICIONES, COMBO] },

  // ── 🌭 PERROS CALIENTES
  { id: 'perro-americano', categoria: 'perros', nombre: 'Americano', descripcion: 'Salchicha americana, papa chips, 1 huevo de codorniz, queso y salsas.', foto: '/locales/pilotos/perro.webp', emoji: '🌭', disponible: true, orden: 21, precio: 12000 },
  { id: 'perro-maverick', categoria: 'perros', nombre: 'Maverick Especial', descripcion: 'Salchicha americana, papa chips, 2 huevos de codorniz, tocineta, queso y salsas.', foto: '/locales/pilotos/perro.webp', emoji: '🌭', destacado: true, disponible: true, orden: 22, precio: 14000 },
  { id: 'perro-choriperro', categoria: 'perros', nombre: 'Choriperro', descripcion: 'Chorizo ahumado, papa chips, 2 huevos de codorniz, queso y salsas.', foto: '/locales/pilotos/perro.webp', emoji: '🌭', disponible: true, orden: 23, precio: 15000 },
  { id: 'perro-hawaiano', categoria: 'perros', nombre: 'Hawaiano', descripcion: 'Salchicha americana, papa chips, piña en cubos, jamón, queso, 1 huevo de codorniz y salsas.', foto: '/locales/pilotos/perro.webp', emoji: '🍍', disponible: true, orden: 24, precio: 15000 },
  { id: 'perro-pilotos-house', categoria: 'perros', nombre: "Piloto's House", descripcion: 'Salchicha americana, papa chips, carne desmechada, queso, 2 huevos de codorniz y salsas.', foto: '/locales/pilotos/perro.webp', emoji: '🌭', disponible: true, orden: 25, precio: 16600 },
  { id: 'perro-boing-mixto', categoria: 'perros', nombre: 'Boing Mixto', descripcion: 'Salchicha americana, carne y pollo desmechado, 3 huevos de codorniz, queso, papa chips y salsas.', foto: '/locales/pilotos/perro.webp', emoji: '🌭', disponible: true, orden: 26, precio: 21000 },

  // ── 🍟 PAPAS TURBULENTAS (papas cargadas)
  { id: 'papas-rancheras', categoria: 'papas', nombre: 'Rancheras', descripcion: 'Papas a la francesa, carne desmechada, chorizo, maíz, tocineta y salsas.', foto: '/locales/pilotos/papas-turbulentas.webp', emoji: '🍟', destacado: true, disponible: true, orden: 27, precio: 21000 },
  { id: 'papas-viejo-oeste', categoria: 'papas', nombre: 'Viejo Oeste', descripcion: 'Papas a la francesa, costillas de cerdo ahumadas, tocineta, queso cheddar y salsas.', foto: '/locales/pilotos/papas-turbulentas.webp', emoji: '🍖', disponible: true, orden: 28, precio: 20000 },
  { id: 'papas-mixtas', categoria: 'papas', nombre: 'Mixtas', descripcion: 'Papas a la francesa, pollo y carne desmechada, chorizo, tocineta, queso cheddar y salsas.', foto: '/locales/pilotos/papas-turbulentas.webp', emoji: '🍟', disponible: true, orden: 29, precio: 24000 },

  // ── 🌽 MAZORCADAS
  { id: 'mazorcada-cessna', categoria: 'mazorcadas', nombre: 'Avioneta Cessna', descripcion: 'Maíz dulce, carne y pollo desmechado, queso, papa chips, huevo de codorniz y salsas.', foto: '/locales/pilotos/mazorcada.webp', emoji: '🌽', destacado: true, disponible: true, orden: 30, precio: 23000 },
  { id: 'mazorcada-airbus', categoria: 'mazorcadas', nombre: 'Air Bus A320', descripcion: 'Maíz dulce, carne y pollo desmechado, chorizo, tocineta, queso, papa chips, huevo de codorniz y salsas.', foto: '/locales/pilotos/mazorcada.webp', emoji: '🌽', disponible: true, orden: 31, precio: 25000 },
  { id: 'mazorcada-pilotos-house', categoria: 'mazorcadas', nombre: "Piloto's House", descripcion: 'Maíz dulce, carne y pollo desmechado, chorizo, tocineta, maduro, queso, 4 huevos de codorniz y salsas.', foto: '/locales/pilotos/mazorcada.webp', emoji: '🌽', disponible: true, orden: 32, precio: 29000 },

  // ── 🥓 SALCHIPAPAS
  { id: 'salchipapa-house', categoria: 'salchipapas', nombre: 'The House', descripcion: 'Salchicha americana, papas francesas, 2 huevos de codorniz, queso, paprika y salsas.', foto: '/locales/pilotos/salchipapas.webp', emoji: '🍟', disponible: true, orden: 33, precio: 15000 },
  { id: 'salchipapa-especial', categoria: 'salchipapas', nombre: 'Especial', descripcion: 'Salchicha americana, papa francesa, 4 huevos de codorniz, 2 tocinetas, queso, paprika y salsas.', foto: '/locales/pilotos/salchipapas.webp', emoji: '🍟', destacado: true, disponible: true, orden: 34, precio: 18000 },
  { id: 'salchipapa-super', categoria: 'salchipapas', nombre: 'Super', descripcion: 'Salchicha americana, papa francesa, 4 huevos de codorniz, tocineta, carne y pollo desmechado, queso, paprika y salsas.', foto: '/locales/pilotos/salchipapas.webp', emoji: '🍟', disponible: true, orden: 35, precio: 24000 },

  // ── 🫓 PATACONES
  { id: 'patacon-especial-mixto', categoria: 'patacones', nombre: 'Especial Mixto', descripcion: 'Patacón con carne y pollo desmechado, champiñón, tocineta, queso y salsas.', foto: '/locales/pilotos/patacon.webp', emoji: '🫓', disponible: true, orden: 36, precio: 25000 },
  { id: 'patacon-super', categoria: 'patacones', nombre: 'Super', descripcion: 'Patacón con carne y pollo desmechado, champiñón, chorizo, tocineta, maíz, queso y salsas.', foto: '/locales/pilotos/patacon.webp', emoji: '🫓', destacado: true, disponible: true, orden: 37, precio: 27000 },

  // ── 🌯 BURRITOS & DORILOCOS
  { id: 'burrito-tradicional', categoria: 'burritos', nombre: 'Burrito Tradicional', descripcion: 'Tortilla con maíz, chorizo, pico de gallo, queso, guacamole y lechuga. Elige tu proteína.', foto: '/locales/pilotos/burrito.webp', emoji: '🌯', destacado: true, disponible: true, orden: 38, precio: 21500,
    gruposOpciones: [
      { id: 'g-burr-prot', nombre: 'Proteína', subtitulo: 'Elige 1', emoji: '🍗', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'bp-carne', nombre: 'Carne desmechada', emoji: '🥩', precioExtra: 0, foto: '' },
          { id: 'bp-pollo', nombre: 'Pollo desmechado', emoji: '🍗', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'burrito-ranchero-mixto', categoria: 'burritos', nombre: 'Burrito Ranchero Mixto', descripcion: 'Tortilla con carne y pollo desmechado, maíz, chorizo, pico de gallo, queso, guacamole y lechuga.', foto: '/locales/pilotos/burrito.webp', emoji: '🌯', disponible: true, orden: 39, precio: 24500 },
  { id: 'dorilocos-despegue', categoria: 'burritos', nombre: 'Dorilocos Despegue', descripcion: 'Doritos con carne desmechada, maíz, pico de gallo, chorizo, guacamole, tocineta, papa chips y salsas.', foto: '/locales/pilotos/dorilocos.webp', emoji: '🌮', disponible: true, orden: 40, precio: 16000 },
  { id: 'dorilocos-mixto', categoria: 'burritos', nombre: 'Dorilocos Mixto', descripcion: 'Doritos con carne y pollo desmechado, maíz, pico de gallo, guacamole, tocineta, papa chips y salsas.', foto: '/locales/pilotos/dorilocos.webp', emoji: '🌮', disponible: true, orden: 41, precio: 17000 },

  // ── 🍗 ALITAS (elige salsa según cantidad)
  { id: 'alitas-6', categoria: 'alitas', nombre: '6 Alitas', descripcion: 'Con papas francesas y ensalada. Elige 1 salsa.', foto: '/locales/pilotos/alitas.webp', emoji: '🍗', destacado: true, disponible: true, orden: 42, precio: 20000,
    gruposOpciones: [
      { id: 'g-ali6-salsa', nombre: 'Salsa', subtitulo: 'Elige 1', emoji: '🥣', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 's-bbq', nombre: 'BBQ', emoji: '🍖', precioExtra: 0, foto: '' },
          { id: 's-bufalo', nombre: 'Búfalo', emoji: '🌶️', precioExtra: 0, foto: '' },
          { id: 's-miel', nombre: 'Miel mostaza', emoji: '🍯', precioExtra: 0, foto: '' },
          { id: 's-maracuya', nombre: 'Maracuyá', emoji: '🟡', precioExtra: 0, foto: '' },
          { id: 's-ajo', nombre: 'Ajo parmesano', emoji: '🧄', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'alitas-12', categoria: 'alitas', nombre: '12 Alitas', descripcion: 'Con 2 porciones de papas francesas y ensalada. Elige 2 salsas.', foto: '/locales/pilotos/alitas.webp', emoji: '🍗', disponible: true, orden: 43, precio: 36000,
    gruposOpciones: [
      { id: 'g-ali12-salsa', nombre: 'Salsas', subtitulo: 'Elige 2', emoji: '🥣', tipo: 'multiple', min: 2, max: 2,
        opciones: [
          { id: 's12-bbq', nombre: 'BBQ', emoji: '🍖', precioExtra: 0, foto: '' },
          { id: 's12-bufalo', nombre: 'Búfalo', emoji: '🌶️', precioExtra: 0, foto: '' },
          { id: 's12-miel', nombre: 'Miel mostaza', emoji: '🍯', precioExtra: 0, foto: '' },
          { id: 's12-maracuya', nombre: 'Maracuyá', emoji: '🟡', precioExtra: 0, foto: '' },
          { id: 's12-ajo', nombre: 'Ajo parmesano', emoji: '🧄', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'alitas-24', categoria: 'alitas', nombre: '24 Alitas', descripcion: 'Con 3 porciones de papas francesas y ensalada. Elige 3 salsas.', foto: '/locales/pilotos/alitas.webp', emoji: '🍗', disponible: true, orden: 44, precio: 60000,
    gruposOpciones: [
      { id: 'g-ali24-salsa', nombre: 'Salsas', subtitulo: 'Elige 3', emoji: '🥣', tipo: 'multiple', min: 3, max: 3,
        opciones: [
          { id: 's24-bbq', nombre: 'BBQ', emoji: '🍖', precioExtra: 0, foto: '' },
          { id: 's24-bufalo', nombre: 'Búfalo', emoji: '🌶️', precioExtra: 0, foto: '' },
          { id: 's24-miel', nombre: 'Miel mostaza', emoji: '🍯', precioExtra: 0, foto: '' },
          { id: 's24-maracuya', nombre: 'Maracuyá', emoji: '🟡', precioExtra: 0, foto: '' },
          { id: 's24-ajo', nombre: 'Ajo parmesano', emoji: '🧄', precioExtra: 0, foto: '' },
        ] },
    ] },

  // ── 🍖 COSTILLAS BBQ (variantes por peso)
  { id: 'costillas-bbq', categoria: 'costillas', nombre: 'Costillas BBQ', descripcion: 'Deliciosas costillas de cerdo en salsa BBQ, con papa francesa y ensalada.', foto: '/locales/pilotos/costillas.webp', emoji: '🍖', destacado: true, disponible: true, orden: 45,
    variantes: [
      { id: 'cost-300', nombre: '300 gr', precio: 26000 },
      { id: 'cost-500', nombre: '500 gr', precio: 30000 },
    ] },

  // ── 🍢 PICADAS (para compartir)
  { id: 'picada-dos', categoria: 'picadas', nombre: 'Picada para dos', descripcion: 'Carne de res, pechuga de pollo, costillas de cerdo, 1 chorizo, papa criolla, papa francesa y ensalada.', foto: '/locales/pilotos/picada.webp', emoji: '🍢', destacado: true, disponible: true, orden: 46, precio: 45000 },
  { id: 'picada-rumbera', categoria: 'picadas', nombre: 'Rumbera', descripcion: 'Carne de res, pechuga, 1 lb de costilla de cerdo, 10 nuggets, 5 aros de cebolla, 1 chorizo, papa criolla, papa francesa y ensalada.', foto: '/locales/pilotos/picada.webp', emoji: '🍢', disponible: true, orden: 47, precio: 60000 },

  // ── 🥪 SÁNDWICH (pan árabe de masa madre)
  { id: 'sandwich-pollo-carne', categoria: 'sandwich', nombre: 'Sándwich Pollo o Carne', descripcion: 'Pan árabe de masa madre, mozzarella, lechuga, tomate, salsa ranch y ajo. Elige tu proteína.', foto: '/locales/pilotos/sandwich.webp', emoji: '🥪', disponible: true, orden: 48, precio: 20000,
    gruposOpciones: [
      { id: 'g-sand-prot', nombre: 'Proteína', subtitulo: 'Elige 1', emoji: '🍗', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'sp-pollo', nombre: 'Pollo', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'sp-carne', nombre: 'Carne', emoji: '🥩', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'sandwich-mixto', categoria: 'sandwich', nombre: 'Sándwich Mixto', descripcion: 'Pan árabe de masa madre, pollo y carne, mozzarella, lechuga, tomate, salsa ranch y ajo.', foto: '/locales/pilotos/sandwich.webp', emoji: '🥪', disponible: true, orden: 49, precio: 22500 },
  { id: 'sandwich-americano', categoria: 'sandwich', nombre: 'Sándwich Americano', descripcion: 'Pan árabe de masa madre, jamón, tocineta, pepperoni, mozzarella, lechuga, tomate, salsa ranch y ajo.', foto: '/locales/pilotos/sandwich.webp', emoji: '🥪', disponible: true, orden: 50, precio: 20000 },

  // ── 🥩 ESPECIALES (carnes y pechugas con papa francesa y ensalada)
  { id: 'especial-pechuga', categoria: 'especiales', nombre: 'Pechuga a la plancha', descripcion: 'Pechuga asada con papa francesa y ensalada. Elige tu estilo.', foto: '/locales/pilotos/pechuga.webp', emoji: '🍗', destacado: true, disponible: true, orden: 51,
    variantes: [
      { id: 'pech-plancha', nombre: 'A la plancha', precio: 24500 },
      { id: 'pech-gratinada', nombre: 'Gratinada (queso fundido)', precio: 26000 },
      { id: 'pech-campesina', nombre: 'Campesina (maíz y champiñones)', precio: 28000 },
      { id: 'pech-hawaiana', nombre: 'Hawaiana (queso y piña)', precio: 29000 },
      { id: 'pech-salsa', nombre: 'En salsa de champiñones', precio: 31000 },
    ] },
  { id: 'especial-churrasco', categoria: 'especiales', nombre: 'Churrasco Argentino', descripcion: '300 gr de churrasco con papa francesa y ensalada.', foto: '/locales/pilotos/churrasco.webp', emoji: '🥩', disponible: true, orden: 52, precio: 35000 },
  { id: 'especial-punta-anca', categoria: 'especiales', nombre: 'Punta de Anca', descripcion: '300 gr de punta de anca con papa francesa y ensalada.', foto: '/locales/pilotos/churrasco.webp', emoji: '🥩', disponible: true, orden: 53, precio: 38000 },
  { id: 'especial-carne-asada', categoria: 'especiales', nombre: 'Carne Asada', descripcion: 'Corte de carne de res con papa francesa y ensalada.', foto: '/locales/pilotos/churrasco.webp', emoji: '🥩', disponible: true, orden: 54, precio: 26000 },
  { id: 'especial-lomo-cerdo', categoria: 'especiales', nombre: 'Lomo de Cerdo', descripcion: '300 gr de fino lomito de cerdo con papa francesa y ensalada.', foto: '/locales/pilotos/churrasco.webp', emoji: '🥩', disponible: true, orden: 55, precio: 26000 },
  { id: 'especial-mixto-tres-carnes', categoria: 'especiales', nombre: 'Mixto Tres Carnes', descripcion: '150 gr de pechuga, 150 gr de res y 150 gr de lomo de cerdo con papa francesa y ensalada.', foto: '/locales/pilotos/churrasco.webp', emoji: '🥩', destacado: true, disponible: true, orden: 56, precio: 38000 },

  // ── 🍝 LASAÑAS
  { id: 'lasana-bolonesa', categoria: 'lasanas', nombre: 'Lasaña Boloñesa', descripcion: 'Capas de pasta con carne boloñesa, jamón, bechamel y mozzarella fundida. Con pan en salsa de ajo.', foto: '/locales/pilotos/lasana.webp', emoji: '🍝', disponible: true, orden: 57, precio: 22000 },
  { id: 'lasana-especial', categoria: 'lasanas', nombre: 'Lasaña Especial', descripcion: 'Capas de pasta con carne, pollo, champiñón, jamón, bechamel y mozzarella fundida. Con pan en salsa de ajo.', foto: '/locales/pilotos/lasana.webp', emoji: '🍝', destacado: true, disponible: true, orden: 58, precio: 24000 },

  // ── 🥟 PANZEROTTIS
  { id: 'panzerotti', categoria: 'panzerottis', nombre: 'Panzerotti', descripcion: 'Masa rellena con salsa napolitana de la casa y queso mozzarella. Elige tu relleno.', foto: '/locales/pilotos/panzerotti.webp', emoji: '🥟', destacado: true, disponible: true, orden: 59, precio: 20000,
    gruposOpciones: [
      { id: 'g-panz-sabor', nombre: 'Relleno', subtitulo: 'Elige 1', emoji: '🧀', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'pz-hawaiano', nombre: 'Hawaiano (piña y jamón)', emoji: '🍍', precioExtra: 0, foto: '' },
          { id: 'pz-pollo-champ', nombre: 'Pollo con champiñones', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'pz-campesino', nombre: 'Campesino (carne, maíz y huevo)', emoji: '🌽', precioExtra: 0, foto: '' },
        ] },
    ] },

  // ── 🍕 PIZZAS (elige tamaño y sabor · masa artesanal y salsa napolitana de la casa)
  { id: 'pizza', categoria: 'pizzas', nombre: 'Pizza Artesanal', descripcion: 'Masa artesanal y salsa napolitana de la casa. Elige tamaño y sabor.', foto: '/locales/pilotos/pizza.webp', emoji: '🍕', destacado: true, disponible: true, orden: 60,
    variantes: [
      { id: 'pz-junior', nombre: 'Junior', precio: 19000 },
      { id: 'pz-personal', nombre: 'Personal', precio: 27000 },
      { id: 'pz-mediana', nombre: 'Mediana', precio: 45000 },
      { id: 'pz-familiar', nombre: 'Familiar', precio: 65000 },
    ],
    gruposOpciones: [
      { id: 'g-pizza-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🍕', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'ps-hawaiana', nombre: 'Hawaiana', emoji: '🍍', precioExtra: 0, foto: '' },
          { id: 'ps-pollo-champ', nombre: 'Pollo con champiñón', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'ps-pepperoni', nombre: 'Pepperoni', emoji: '🍕', precioExtra: 0, foto: '' },
          { id: 'ps-tocineta-pina', nombre: 'Tocineta y piña', emoji: '🥓', precioExtra: 0, foto: '' },
          { id: 'ps-pollo-bbq', nombre: 'Pollo BBQ', emoji: '🍖', precioExtra: 0, foto: '' },
          { id: 'ps-maiz-tocineta', nombre: 'Maíz y tocineta', emoji: '🌽', precioExtra: 0, foto: '' },
          { id: 'ps-tres-quesos', nombre: 'Tres quesos', emoji: '🧀', precioExtra: 0, foto: '' },
          { id: 'ps-margarita', nombre: 'Margarita', emoji: '🌿', precioExtra: 0, foto: '' },
          { id: 'ps-carnes-mixtas', nombre: 'Carnes mixtas (carne, pollo y pepperoni)', emoji: '🥩', precioExtra: 0, foto: '' },
          { id: 'ps-montanera', nombre: 'Montañera (tocineta, jamón, maíz y champiñón)', emoji: '🥓', precioExtra: 0, foto: '' },
          { id: 'ps-americana', nombre: 'Americana (tocineta, jamón y pepperoni)', emoji: '🇺🇸', precioExtra: 0, foto: '' },
          { id: 'ps-bufala', nombre: 'Búfala (mozzarella y queso búfala)', emoji: '🧀', precioExtra: 0, foto: '' },
          { id: 'ps-criolla', nombre: 'Criolla (carne, maíz y salchicha)', emoji: '🌽', precioExtra: 0, foto: '' },
          { id: 'ps-miel-mostaza', nombre: 'Miel mostaza (tocineta y pollo)', emoji: '🍯', precioExtra: 0, foto: '' },
          { id: 'ps-gustosa', nombre: 'Gustosa (champiñón y jamón)', emoji: '🍄', precioExtra: 0, foto: '' },
          { id: 'ps-nutella', nombre: 'Nutella (dulce)', emoji: '🍫', precioExtra: 0, foto: '' },
        ] },
    ] },

  // ── 🧒 MENÚ INFANTIL (con papas francesas, jugo de caja y juguete)
  { id: 'infantil-nuggets', categoria: 'infantil', nombre: '6 Nuggets de Pollo', descripcion: 'Con papas francesas, jugo de caja y juguete.', foto: '/locales/pilotos/infantil.webp', emoji: '🧒', disponible: true, orden: 61, precio: 20000 },
  { id: 'infantil-mini-burger', categoria: 'infantil', nombre: 'Mini Hamburguesa', descripcion: 'Con papas francesas, jugo de caja y juguete.', foto: '/locales/pilotos/infantil.webp', emoji: '🍔', disponible: true, orden: 62, precio: 20000 },
  { id: 'infantil-mini-perro', categoria: 'infantil', nombre: 'Mini Perro Caliente', descripcion: 'Con papas francesas, jugo de caja y juguete.', foto: '/locales/pilotos/infantil.webp', emoji: '🌭', disponible: true, orden: 63, precio: 20000 },

  // ── 🥤 MALTEADAS
  { id: 'malteada', categoria: 'malteadas', nombre: 'Malteada', descripcion: 'Cremosa y bien fría. Elige tu sabor.', foto: '/locales/pilotos/malteada.webp', emoji: '🥤', destacado: true, disponible: true, orden: 64,
    variantes: [
      { id: 'malt-frutos', nombre: 'Frutos rojos', precio: 12000 },
      { id: 'malt-cookies', nombre: 'Cookies and cream', precio: 12000 },
    ] },

  // ── 🧃 BEBIDAS
  { id: 'jugo-natural', categoria: 'bebidas', nombre: 'Jugo natural', descripcion: 'Fruta fresca. Elige en agua o en leche y tu sabor.', foto: '/locales/pilotos/jugo.webp', emoji: '🧃', disponible: true, orden: 65,
    variantes: [
      { id: 'jugo-agua', nombre: 'En agua', precio: 7000 },
      { id: 'jugo-leche', nombre: 'En leche', precio: 8000 },
    ],
    gruposOpciones: [
      { id: 'g-jugo-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🍓', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'jn-mora', nombre: 'Mora', emoji: '🫐', precioExtra: 0, foto: '' },
          { id: 'jn-maracuya', nombre: 'Maracuyá', emoji: '🟡', precioExtra: 0, foto: '' },
          { id: 'jn-fresa', nombre: 'Fresa', emoji: '🍓', precioExtra: 0, foto: '' },
          { id: 'jn-guanabana', nombre: 'Guanábana', emoji: '🤍', precioExtra: 0, foto: '' },
          { id: 'jn-lulo', nombre: 'Lulo', emoji: '🟢', precioExtra: 0, foto: '' },
          { id: 'jn-mango', nombre: 'Mango', emoji: '🥭', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'limonada', categoria: 'bebidas', nombre: 'Limonada', descripcion: 'Refrescante, hecha al momento. Elige tu tipo.', foto: '/locales/pilotos/limonada.webp', emoji: '🍋', disponible: true, orden: 66,
    variantes: [
      { id: 'lim-natural', nombre: 'Natural', precio: 9000 },
      { id: 'lim-cerezada', nombre: 'Cerezada', precio: 9000 },
      { id: 'lim-hierbabuena', nombre: 'Hierbabuena', precio: 9000 },
      { id: 'lim-coco', nombre: 'De coco', precio: 9500 },
      { id: 'lim-maracuya', nombre: 'Maracuyá', precio: 10000 },
      { id: 'lim-pina-colada', nombre: 'Piña colada (con o sin alcohol)', precio: 11000 },
    ] },
  { id: 'soda-italiana', categoria: 'bebidas', nombre: 'Soda italiana', descripcion: 'Burbujeante y frutal. Elige tu sabor.', foto: '/locales/pilotos/limonada.webp', emoji: '🥤', disponible: true, orden: 67, precio: 8000,
    gruposOpciones: [
      { id: 'g-soda-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🍒', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'so-frutos', nombre: 'Frutos rojos', emoji: '🍒', precioExtra: 0, foto: '' },
          { id: 'so-limon', nombre: 'Limón', emoji: '🍋', precioExtra: 0, foto: '' },
          { id: 'so-maracu-mango', nombre: 'Maracu-mango', emoji: '🥭', precioExtra: 0, foto: '' },
          { id: 'so-pina-hierba', nombre: 'Piña-hierbabuena', emoji: '🍍', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'gaseosa', categoria: 'bebidas', nombre: 'Gaseosa', descripcion: 'Bien fría.', foto: '', emoji: '🥤', disponible: true, orden: 68,
    variantes: [
      { id: 'gas-350', nombre: '350 ml', precio: 4000 },
      { id: 'gas-15', nombre: '1.5 L', precio: 8000 },
    ] },
  { id: 'jugo-hit', categoria: 'bebidas', nombre: 'Jugo Hit', descripcion: 'Individual, bien frío.', foto: '', emoji: '🧃', disponible: true, orden: 69, precio: 4500 },

  // ── 🍺 CERVEZAS
  { id: 'cerveza', categoria: 'cervezas', nombre: 'Cerveza', descripcion: 'Bien fría. Elige tu marca.', foto: '', emoji: '🍺', disponible: true, orden: 70,
    variantes: [
      { id: 'cer-aguila', nombre: 'Águila', precio: 4500 },
      { id: 'cer-club', nombre: 'Club Colombia', precio: 7000 },
      { id: 'cer-corona', nombre: 'Corona', precio: 8000 },
      { id: 'cer-michelada', nombre: 'Michelada', precio: 12000 },
    ] },
]
