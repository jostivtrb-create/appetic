// 🐔 CHICKEN ZONE — Burger, Tenders, Wraps y Crispy Combos · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-chicken-zone.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// Estética sacada del ADN de ESTA marca (su carta): NEGRO PURO con brochazos AMARILLO MOSTAZA
// (#EAAF28), títulos en letra condensada pesada amarilla, nombres y precios en amarillo y
// descripciones en blanco. → skin 'chicken' (src/pages/Local/LocalSkinChicken.css): fondo
// negro, brochazos amarillos en la cabecera, títulos Anton amarillos subrayados con un trazo
// de pincel, botones amarillos con texto negro. Sin vino, sin lila, sin stencil: eso es de otros.
//
// LOGO: insignia redonda (gallo con gafas y presa crispy, aro amarillo con "CHICKEN ZONE!" y
// "BURGERS - WRAPS - TENDERS"), vectorial, exportada transparente. Protagoniza el hero y entra
// cayendo en 3 bloques (texto de arriba · gallo · texto de abajo).

export const SLUG = 'chicken-zone'

// Correo del DUEÑO que administra el local (entra a /chicken-zone/admin con ese Google).
export const ADMIN_EMAIL = 'gabrielandrescv25@gmail.com'

// 🍗 "Crispy o crispy BBQ": la carta deja elegir el pollo en los sándwiches → elige 1, obligatorio.
const POLLO_SANDWICH = (pref) => ({
  id: `g-${pref}-pollo`, nombre: 'Tu pollo', subtitulo: 'Elige 1', emoji: '🍗',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: `${pref}-crispy`, nombre: 'Crispy', emoji: '🍗', precioExtra: 0, foto: '' },
    { id: `${pref}-bbq`, nombre: 'Crispy BBQ (miel BBQ)', emoji: '🍯', precioExtra: 0, foto: '' },
  ],
})

// 🍟 "Papa adicional $5": acompaña cualquier plato que no sea combo (opcional).
const ACOMPANALO = (pref) => ({
  id: `g-${pref}-extra`, nombre: 'Acompáñalo', subtitulo: 'Opcional', emoji: '🍟',
  tipo: 'multiple', min: 0,
  opciones: [
    { id: `${pref}-papa`, nombre: 'Papa a la francesa', emoji: '🍟', precioExtra: 5000, foto: '' },
  ],
})

export const CHICKEN_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Chicken Zone',
  descripcion: 'Pollo crispy, BBQ y a la plancha · Burgers, tenders, wraps y combos',
  // 📱 Número POR DEFECTO (320 843 5143), no el del local: deja el checkout funcionando mientras
  //    Chicken Zone da el suyo. El dueño lo cambia en ⚙️ Configuración → Datos del negocio
  //    (es también el número del afiche de domicilios).
  whatsapp: '573208435143',
  logo: '/locales/chicken-zone/logo.webp',    // insignia redonda transparente: FLOTA grande en el hero
  icono: '/locales/chicken-zone/icono.webp',  // la misma insignia en pequeño para los cuadritos
  logoAnim: 'arriba',                         // entra cayendo en 3 bloques: "pum… pum… pum"
  banner: '',   // el dueño lo sube desde su panel (prompt en public/locales/chicken-zone/PROMPTS.md)
  tema: {
    primary: '#EAAF28',        // amarillo mostaza de la carta (botones, chips activos, precios)
    primaryStrong: '#B8820E',  // mostaza tostada
    primarySoft: '#F6CF6A',    // amarillo claro del brochazo
    onPrimary: '#111111',      // texto negro sobre el amarillo (como en su carta)
    accent: '#F2C14E',         // brillo amarillo para precios sobre negro
    bg: '#0A0A0A',             // negro puro: el fondo de su carta
    hero: 'logo',              // la insignia en GRANDE en el header
    skin: 'chicken',           // piel propia: src/pages/Local/LocalSkinChicken.css
  },
  // 24 horas (abre === cierra): útil para probar a cualquier hora. El dueño ajusta el real.
  horario: { abre: '00:00', cierra: '00:00' },
  recoger: true,
  domicilio: { activo: false, maxKm: 3, tarifas: {} },
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],
  // Sin emojis: el skin pone la pierna de pollo de su carta como ícono de sección.
  categorias: [
    { id: 'burgers', nombre: 'Burger y Sandwich', emoji: '' },
    { id: 'tenders', nombre: 'Tenders y Wraps', emoji: '' },
    { id: 'combos', nombre: 'Crispy Combos', emoji: '' },
    { id: 'extras', nombre: 'Adicionales y Bebidas', emoji: '' },
  ],
  // 🗂️ Etiquetas del INICIO (catálogo en src/config/categoriasLocales.js).
  etiquetas: ['pollo', 'hamburguesas', 'comida-rapida'],
  admins: [ADMIN_EMAIL],
  // 💳 Plan completo = Empresario. Nace EN MONTAJE (7 días, el seed pone el reloj) y fuera del buscador.
  suscripcion: { plan: 'empresario', estado: 'montaje' },
  enBuscador: false,
  menuVersion: 1,
}

// 📷 foto: '' en todos — el dueño las genera con IA (prompts en public/locales/chicken-zone/PROMPTS.md)
//    y las sube desde su panel (📱 Del dispositivo).
export const CHICKEN_PRODUCTOS = [
  // ── BURGER Y SANDWICH
  { id: 'asada-burger', categoria: 'burgers', nombre: 'Asada Burger', descripcion: '100 g de pechuga a la plancha con jamón, queso, lechuga, tomate y salsa tártara en pan brioche.', foto: '', emoji: '🍔', disponible: true, orden: 1, precio: 13000,
    gruposOpciones: [ACOMPANALO('asada')] },
  { id: 'crispy-burger', categoria: 'burgers', nombre: 'Crispy Burger', descripcion: '120 g de pollo crispy con ensalada de lechuga en salsa césar artesanal, en pan brioche.', foto: '', emoji: '🍔', destacado: true, disponible: true, orden: 2, precio: 15000,
    gruposOpciones: [ACOMPANALO('crispyb')] },
  { id: 'crispy-bbq', categoria: 'burgers', nombre: 'Crispy BBQ', descripcion: '120 g de pollo crispy bañado en salsa miel-BBQ con pepinillos agridulces encurtidos, en pan brioche.', foto: '', emoji: '🍔', disponible: true, orden: 3, precio: 16000,
    gruposOpciones: [ACOMPANALO('crispybbq')] },
  { id: 'sandwich-crispy', categoria: 'burgers', nombre: 'Sándwich Crispy o BBQ', descripcion: '150 g de pollo crispy o crispy BBQ con lechuga, tomate, jamón y queso. Acompañado de salsa tártara, césar casera y salsa de la casa.', foto: '', emoji: '🥪', disponible: true, orden: 4, precio: 15500,
    gruposOpciones: [POLLO_SANDWICH('sc'), ACOMPANALO('sc')] },
  { id: 'sandwich-xl', categoria: 'burgers', nombre: 'Sándwich XL', descripcion: '200 g de pollo crispy o crispy BBQ con doble porción de lechuga, tomate, jamón y queso. Acompañado de salsa tártara, césar casera y salsa de la casa.', foto: '', emoji: '🥪', destacado: true, disponible: true, orden: 5, precio: 22000,
    gruposOpciones: [POLLO_SANDWICH('xl'), ACOMPANALO('xl')] },

  // ── TENDERS Y WRAPS
  { id: 'tenders-clasicos', categoria: 'tenders', nombre: 'Tenders Clásicos', descripcion: '200 g de tenders crispy dorados con salsa de la casa para untar.', foto: '', emoji: '🍗', disponible: true, orden: 6, precio: 12000,
    gruposOpciones: [ACOMPANALO('tc')] },
  { id: 'tenders-bbq', categoria: 'tenders', nombre: 'Tenders BBQ', descripcion: '200 g de tenders crispy bañados en salsa miel-BBQ.', foto: '', emoji: '🍗', disponible: true, orden: 7, precio: 13000,
    gruposOpciones: [ACOMPANALO('tb')] },
  { id: 'tenders-familiar', categoria: 'tenders', nombre: 'Tenders Familiar', descripcion: '400 g de tenders para compartir: crispy, BBQ o mixtos, con sus salsas.', foto: '', emoji: '🍗', destacado: true, disponible: true, orden: 8, precio: 23000,
    gruposOpciones: [
      { id: 'g-tf-estilo', nombre: 'Estilo', subtitulo: 'Elige 1', emoji: '🍗', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'tf-crispy', nombre: 'Crispy', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'tf-bbq', nombre: 'BBQ', emoji: '🍯', precioExtra: 0, foto: '' },
          { id: 'tf-mixtos', nombre: 'Mixtos (crispy + BBQ)', emoji: '🔥', precioExtra: 0, foto: '' },
        ] },
      ACOMPANALO('tf'),
    ] },
  { id: 'wrap-crispy', categoria: 'tenders', nombre: 'Wrap Crispy', descripcion: 'Tortilla grande con pollo crispy, vegetales frescos, queso mozzarella y salsa de la casa.', foto: '', emoji: '🌯', disponible: true, orden: 9, precio: 14000,
    gruposOpciones: [ACOMPANALO('wc')] },
  { id: 'wrap-plancha', categoria: 'tenders', nombre: 'Wrap a la Plancha', descripcion: 'Tortilla grande con pollo a la plancha, vegetales frescos, queso mozzarella y salsa de la casa.', foto: '', emoji: '🌯', disponible: true, orden: 10, precio: 14000,
    gruposOpciones: [ACOMPANALO('wp')] },

  // ── CRISPY COMBOS (ya traen papa: sin "Acompáñalo")
  { id: 'combo-full-crispy', categoria: 'combos', nombre: 'Full Crispy', descripcion: 'Crispy Burger + Tenders Clásicos + papa a la francesa.', foto: '', emoji: '🍔', destacado: true, disponible: true, orden: 11, precio: 29000 },
  { id: 'combo-bbq', categoria: 'combos', nombre: 'Combo BBQ', descripcion: 'Crispy BBQ + Tenders BBQ + papa a la francesa.', foto: '', emoji: '🍯', disponible: true, orden: 12, precio: 30000 },
  { id: 'combo-duo', categoria: 'combos', nombre: 'Dúo', descripcion: '2 Crispy Burger + 2 papas a la francesa. Para ti y tu parcero.', foto: '', emoji: '🍔', disponible: true, orden: 13, precio: 38000 },
  { id: 'combo-familiar', categoria: 'combos', nombre: 'Familiar', descripcion: '3 Crispy Burger + 3 papas a la francesa + 2 Tenders Clásicos. Para toda la mesa.', foto: '', emoji: '👨‍👩‍👧', destacado: true, disponible: true, orden: 14, precio: 79000 },

  // ── ADICIONALES Y BEBIDAS
  { id: 'papa-adicional', categoria: 'extras', nombre: 'Papa Adicional', descripcion: 'Porción de papa a la francesa, dorada y crocante.', foto: '', emoji: '🍟', disponible: true, orden: 15, precio: 5000 },
  { id: 'limonada', categoria: 'extras', nombre: 'Limonada', descripcion: 'Limonada natural, bien fría.', foto: '', emoji: '🍋', disponible: true, orden: 16, precio: 5000 },
  // ⚠️ APROXIMACIÓN: la carta dice "Productos Postobón" sin listar sabores. Estos son los
  //    típicos; el dueño los ajusta a lo que tenga desde su panel.
  { id: 'postobon', categoria: 'extras', nombre: 'Gaseosa Postobón', descripcion: 'Personal y bien fría. Elige tu sabor.', foto: '', emoji: '🥤', disponible: true, orden: 17, precio: 4000,
    gruposOpciones: [
      { id: 'g-pb-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🥤', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'pb-manzana', nombre: 'Manzana', emoji: '🍎', precioExtra: 0, foto: '' },
          { id: 'pb-colombiana', nombre: 'Colombiana', emoji: '🥤', precioExtra: 0, foto: '' },
          { id: 'pb-uva', nombre: 'Uva', emoji: '🍇', precioExtra: 0, foto: '' },
          { id: 'pb-naranja', nombre: 'Naranja', emoji: '🍊', precioExtra: 0, foto: '' },
          { id: 'pb-pepsi', nombre: 'Pepsi', emoji: '🥤', precioExtra: 0, foto: '' },
        ] },
    ] },
]
