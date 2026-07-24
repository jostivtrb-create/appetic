// 🍨 FRUTI TENTACIÓN — Frutería & Heladería · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-fruti-tentacion.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// ⚠️ IDENTIDAD PROVISIONAL: el dueño está REDISEÑANDO el logo. La paleta de abajo se sacó de la
//    carta actual (fondo lima, nombres fucsia, cintas de precio turquesa) para arrancar; cuando
//    llegue el logo nuevo se afina el `tema` y se pone `logo`/`hero:'logo'`. Vibrante, fresca y
//    frutal — de heladería —, distinta a los demás locales.
//
// 📷 IMÁGENES: NO se generan aquí. Todos los `foto: ''` van vacíos; los prompts están en
//    public/locales/fruti-tentacion/PROMPTS.md y el dueño sube cada foto desde su panel
//    (editar producto → 📱 Del dispositivo). Mientras tanto, cada tarjeta se ve con su emoji.

export const SLUG = 'fruti-tentacion'

// Correo del DUEÑO que administra el local (entra a /fruti-tentacion/admin con ese Google).
// ⚠️ POR DEFECTO: 'sinfiniity@gmail.com' (NUESTRA cuenta, no la del cliente) hasta que dé su Gmail.
//    Se cambia sin tocar código desde /superadmin (campo 👤) o re-corriendo el seed.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

export const FRUTI_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Fruti Tentación',
  descripcion: 'Frutería & Heladería · fruta fresca, helado y antojos 🍓🍨',
  // 📱 Número POR DEFECTO (320 843 5143), no el del local: deja el checkout funcionando desde el
  //    minuto uno. Los pedidos llegan a nosotros, no a ellos → el local sigue inactivo en el
  //    buscador (ver `suscripcion`). El dueño pone el real en ⚙️ Configuración → Datos del negocio.
  whatsapp: '573208435143',
  // Logo pendiente de rediseño → '' muestra la inicial estilizada con el tema. Banner '' = hero con
  // degradado del tema. Cuando llegue el logo: logo:'/locales/fruti-tentacion/logo.webp' + hero:'logo'.
  logo: '',
  banner: '',
  tema: {
    primary: '#E5288E',        // fucsia frutal (botones, precios, chips activos) — de los nombres de la carta
    primaryStrong: '#BE1670',  // fucsia profundo (degradado / variante oscura)
    primarySoft: '#FF7CC0',    // rosa dulce para el degradado del hero
    onPrimary: '#FFFFFF',      // texto sobre el fucsia
    accent: '#22B3A0',         // turquesa fresco (de las cintas de precio) — acento secundario
    bg: '#FFF6FB',             // "mundo" crema muy claro con tinte rosado, limpio y apetitoso
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
    { id: 'ensaladas', nombre: 'Ensaladas de Fruta', emoji: '🍉' },
    { id: 'copas', nombre: 'Copas de Helado', emoji: '🍨' },
    { id: 'fresas', nombre: 'Fresas', emoji: '🍓' },
    { id: 'waffles', nombre: 'Waffles', emoji: '🧇' },
    { id: 'crepes-dulces', nombre: 'Crepes Dulces', emoji: '🥞' },
    { id: 'delicias', nombre: 'Delicias', emoji: '🍰' },
    { id: 'obleas', nombre: 'Obleas', emoji: '🫓' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🥤' },
    { id: 'infantiles', nombre: 'Infantiles', emoji: '🧸' },
    { id: 'saladines', nombre: 'Saladines', emoji: '🥪' },
    { id: 'adicionales', nombre: 'Adicionales', emoji: '➕' },
  ],
  admins: [ADMIN_EMAIL],
  // activa:false → NO sale todavía en el buscador del inicio. Se enciende desde /superadmin cuando el
  // local tenga su WhatsApp real (si saliera ahora, un cliente pediría y el pedido llegaría al número
  // por defecto, no al de Fruti Tentación).
  suscripcion: { activa: false, plan: 'piloto' },
  menuVersion: 1,
}

export const FRUTI_PRODUCTOS = [
  // ══════════════════ 🍉 ENSALADAS DE FRUTA ══════════════════
  // Se venden por TAMAÑO → un producto con variantes (elige tamaño, fija el precio).
  { id: 'ensalada-fruta', categoria: 'ensaladas', nombre: 'Ensalada de Fruta',
    descripcion: 'Fruta fresca picada con crema de leche, queso rallado, helado y toppings. Elige el tamaño.',
    foto: '', emoji: '🍨', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'ens-junior', nombre: 'Junior', precio: 6000 },
      { id: 'ens-sencilla', nombre: 'Sencilla', precio: 7500 },
      { id: 'ens-especial', nombre: 'Especial', precio: 8500 },
      { id: 'ens-super', nombre: 'Super Especial', precio: 10000 },
      { id: 'ens-mega', nombre: 'Mega', precio: 13500 },
      { id: 'ens-queso', nombre: 'Locura de Queso', precio: 16000 },
      { id: 'ens-familiar', nombre: 'Familiar', precio: 22000 },
      { id: 'ens-extra', nombre: 'Extra Familiar', precio: 28000 },
    ] },
  { id: 'fruti-canasta', categoria: 'ensaladas', nombre: 'Fruti Canasta',
    descripcion: 'Canastica crocante rellena de fruta fresca, crema y helado.',
    foto: '', emoji: '🧺', disponible: true, orden: 2, precio: 6500 },
  { id: 'fruti-yogur', categoria: 'ensaladas', nombre: 'Fruti Yogur',
    descripcion: 'Fruta fresca con yogur, cereal y granola. Ligera y deliciosa.',
    foto: '', emoji: '🥣', disponible: true, orden: 3, precio: 10000 },

  // ══════════════════ 🍨 COPAS DE HELADO ══════════════════
  { id: 'copa-helado', categoria: 'copas', nombre: 'Copa de Helado',
    descripcion: 'Copa de helado con salsas, fruta y toppings. Elige tu sabor.',
    foto: '', emoji: '🍨', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'copa-dulce-cereza', nombre: 'Dulce Cereza', precio: 14000 },
      { id: 'copa-frutas-amarillas', nombre: 'Frutas Amarillas', precio: 10000 },
      { id: 'copa-frutos-rojos', nombre: 'Frutos Rojos', precio: 10000 },
      { id: 'copa-capricho-chocolate', nombre: 'Capricho de Chocolate', precio: 12000 },
      { id: 'copa-oreo', nombre: 'Oreo', precio: 10000 },
      { id: 'copa-tradicional', nombre: 'Tradicional', precio: 10000 },
      { id: 'copa-alicorada', nombre: 'Alicorada (Whisky)', precio: 12000 },
      { id: 'copa-cocosette', nombre: 'Cocosette', precio: 10000 },
      { id: 'copa-arequipe', nombre: 'Arequipe', precio: 10000 },
      { id: 'copa-mangonada', nombre: 'Mangonada', precio: 10000 },
      { id: 'copa-gelatina-helado', nombre: 'Gelatina con Helado', precio: 8000 },
      { id: 'copa-gelatina-especial', nombre: 'Gelatina Especial', precio: 12000 },
      { id: 'copa-ferrero', nombre: 'Ferrero Rocher', precio: 14000 },
      { id: 'copa-locura-queso', nombre: 'Locura de Queso', precio: 12000 },
      { id: 'copa-durazno-helado', nombre: 'Durazno con Helado', precio: 12000 },
    ] },

  // ══════════════════ 🍓 FRESAS ══════════════════
  { id: 'fresas', categoria: 'fresas', nombre: 'Fresas',
    descripcion: 'Fresas frescas con tu acompañamiento favorito. Elige la opción.',
    foto: '', emoji: '🍓', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'fresas-crema', nombre: 'Con Crema', precio: 8000 },
      { id: 'fresas-helado', nombre: 'Con Helado', precio: 10000 },
      { id: 'fresas-chocolate', nombre: 'Con Chocolate', precio: 10000 },
      { id: 'fresas-arequipe', nombre: 'Con Arequipe', precio: 10000 },
      { id: 'fresas-chantilli', nombre: 'Con Chantilli', precio: 10000 },
      { id: 'fresas-fruti', nombre: 'Fruti Fresas', precio: 12000 },
      { id: 'fresas-helado-crema-queso', nombre: 'Con Helado, Crema y Queso', precio: 12000 },
    ] },

  // ══════════════════ 🧇 WAFFLES ══════════════════
  { id: 'waffle', categoria: 'waffles', nombre: 'Waffle',
    descripcion: 'Waffle recién hecho, crocante por fuera y suave por dentro, con helado y toppings. Elige el sabor.',
    foto: '', emoji: '🧇', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'waffle-durazno-cereza', nombre: 'Durazno Cereza', precio: 15000 },
      { id: 'waffle-chocolate', nombre: 'Chocolate', precio: 13000 },
      { id: 'waffle-frutos-rojos', nombre: 'Frutos Rojos', precio: 12000 },
      { id: 'waffle-frutos-amarillos', nombre: 'Frutos Amarillos', precio: 12000 },
      { id: 'waffle-tradicional', nombre: 'Tradicional', precio: 12000 },
      { id: 'waffle-arequipe', nombre: 'Arequipe', precio: 13000 },
      { id: 'waffle-queso-fruta', nombre: 'Queso y Fruta', precio: 14000 },
    ] },

  // ══════════════════ 🥞 CREPES DULCES ══════════════════
  { id: 'crepe-dulce', categoria: 'crepes-dulces', nombre: 'Crepe Dulce',
    descripcion: 'Crepe suave relleno y bañado, con helado y toppings. Elige el sabor.',
    foto: '', emoji: '🥞', disponible: true, orden: 1,
    variantes: [
      { id: 'crepe-durazno-cereza', nombre: 'Durazno Cereza', precio: 15000 },
      { id: 'crepe-chocolate', nombre: 'Chocolate', precio: 13000 },
      { id: 'crepe-frutos-rojos', nombre: 'Frutos Rojos', precio: 12000 },
      { id: 'crepe-frutos-amarillos', nombre: 'Frutos Amarillos', precio: 12000 },
      { id: 'crepe-tradicional', nombre: 'Tradicional', precio: 12000 },
      { id: 'crepe-arequipe', nombre: 'Arequipe', precio: 13000 },
      { id: 'crepe-queso-fruta', nombre: 'Queso y Fruta', precio: 14000 },
    ] },

  // ══════════════════ 🍰 DELICIAS ══════════════════
  { id: 'brownie-helado', categoria: 'delicias', nombre: 'Brownie con Helado',
    descripcion: 'Brownie de chocolate tibio con helado, salsa y crema.',
    foto: '', emoji: '🍫', destacado: true, disponible: true, orden: 1, precio: 10000 },
  { id: 'banana-split', categoria: 'delicias', nombre: 'Banana Split',
    descripcion: 'Banano con helado, salsas, crema y toppings. El clásico.',
    foto: '', emoji: '🍌', disponible: true, orden: 2, precio: 10000 },
  { id: 'banana-extra-larga', categoria: 'delicias', nombre: 'Banana Extra Larga',
    descripcion: 'Versión gigante: banano, varias bolas de helado, salsas y toppings. ¡Para compartir!',
    foto: '', emoji: '🍌', disponible: true, orden: 3, precio: 17000 },
  { id: 'merengon-sencillo', categoria: 'delicias', nombre: 'Merengón Sencillo',
    descripcion: 'Merengue crocante con crema y fresas.',
    foto: '', emoji: '🍦', disponible: true, orden: 4, precio: 10000 },
  { id: 'merengon-especial', categoria: 'delicias', nombre: 'Merengón Especial',
    descripcion: 'Merengue con crema, helado, fresas y más fruta.',
    foto: '', emoji: '🍦', destacado: true, disponible: true, orden: 5, precio: 12000 },
  { id: 'brebasa', categoria: 'delicias', nombre: 'Brebasa',
    descripcion: 'Brevas con arequipe y queso. Dulce tradicional.',
    foto: '', emoji: '🧀', disponible: true, orden: 6, precio: 10000 },
  { id: 'gelatina-helado', categoria: 'delicias', nombre: 'Gelatina con Helado',
    descripcion: 'Gelatina de colores con helado.',
    foto: '', emoji: '🍮', disponible: true, orden: 7, precio: 8000 },
  { id: 'gelatina-especial', categoria: 'delicias', nombre: 'Gelatina Especial',
    descripcion: 'Gelatina con helado, crema y queso.',
    foto: '', emoji: '🍮', disponible: true, orden: 8, precio: 12000 },

  // ══════════════════ 🫓 OBLEAS ══════════════════
  { id: 'oblea', categoria: 'obleas', nombre: 'Oblea',
    descripcion: 'Obleas crocantes con arequipe y tus rellenos. Elige la opción.',
    foto: '', emoji: '🫓', disponible: true, orden: 1,
    variantes: [
      { id: 'oblea-tradicional', nombre: 'Tradicional', precio: 3000 },
      { id: 'oblea-chocolate', nombre: 'Chocolate', precio: 5000 },
      { id: 'oblea-frutos-rojos', nombre: 'Frutos Rojos', precio: 4000 },
      { id: 'oblea-fruti', nombre: 'Fruti Oblea', precio: 6000 },
      { id: 'oblea-helado', nombre: 'Con Helado', precio: 6000 },
    ] },

  // ══════════════════ 🥤 BEBIDAS ══════════════════
  { id: 'malteada', categoria: 'bebidas', nombre: 'Malteada',
    descripcion: 'Malteada cremosa bien fría. Elige la opción.',
    foto: '', emoji: '🥤', disponible: true, orden: 1,
    variantes: [
      { id: 'malteada-sencilla', nombre: 'Sencilla', precio: 9000 },
      { id: 'malteada-super', nombre: 'Super Especial', precio: 13000 },
    ] },
  { id: 'salpicon', categoria: 'bebidas', nombre: 'Salpicón',
    descripcion: 'Salpicón de frutas en gaseosa. Elige la opción.',
    foto: '', emoji: '🍹', disponible: true, orden: 2,
    variantes: [
      { id: 'salpicon-sencillo', nombre: 'Sencillo', precio: 8000 },
      { id: 'salpicon-helado', nombre: 'Con Helado', precio: 10000 },
    ] },
  { id: 'borojo', categoria: 'bebidas', nombre: 'Borojó',
    descripcion: 'Jugo de borojó energético. Elige la opción.',
    foto: '', emoji: '🥤', disponible: true, orden: 3,
    variantes: [
      { id: 'borojo-sencillo', nombre: 'Sencillo', precio: 7000 },
      { id: 'borojo-especial', nombre: 'Especial', precio: 11000 },
      { id: 'borojo-mero-macho', nombre: 'Mero Macho', precio: 16000 },
    ] },
  { id: 'limonada', categoria: 'bebidas', nombre: 'Limonada',
    descripcion: 'Limonada natural bien fría. Elige el sabor.',
    foto: '', emoji: '🍋', disponible: true, orden: 4,
    variantes: [
      { id: 'limonada-natural', nombre: 'Natural', precio: 5000 },
      { id: 'limonada-coco', nombre: 'De Coco', precio: 8000 },
      { id: 'limonada-hierbabuena', nombre: 'De Hierbabuena', precio: 8000 },
      { id: 'limonada-cerezada', nombre: 'Cerezada', precio: 10000 },
    ] },
  { id: 'jugo-natural', categoria: 'bebidas', nombre: 'Jugo Natural',
    descripcion: 'Jugo de fruta natural. ¡Pregunta por los sabores del día! Elige agua o leche.',
    foto: '', emoji: '🧃', disponible: true, orden: 5,
    variantes: [
      { id: 'jugo-agua', nombre: 'En Agua', precio: 5000 },
      { id: 'jugo-leche', nombre: 'En Leche', precio: 6000 },
    ] },
  { id: 'crema-limon', categoria: 'bebidas', nombre: 'Crema de Limón',
    descripcion: 'Crema de limón suave y refrescante.',
    foto: '', emoji: '🍋', disponible: true, orden: 6, precio: 8000 },
  { id: 'milo-frio', categoria: 'bebidas', nombre: 'Milo Frío',
    descripcion: 'Milo bien frío y cremoso.',
    foto: '', emoji: '🥛', disponible: true, orden: 7, precio: 7000 },
  { id: 'cafe-helado', categoria: 'bebidas', nombre: 'Café Helado',
    descripcion: 'Café frío con helado. Perfecto para el calor.',
    foto: '', emoji: '☕', disponible: true, orden: 8, precio: 10000 },
  { id: 'lulada', categoria: 'bebidas', nombre: 'Lulada',
    descripcion: 'Lulada vallecaucana con lulo, hielo y limón.',
    foto: '', emoji: '🥤', disponible: true, orden: 9, precio: 10000 },

  // ══════════════════ 🧸 INFANTILES ══════════════════
  { id: 'copa-pulpo', categoria: 'infantiles', nombre: 'Copa Pulpo',
    descripcion: 'Copa infantil de helado decorada de pulpito.',
    foto: '', emoji: '🐙', disponible: true, orden: 1, precio: 6000 },
  { id: 'copa-mickey', categoria: 'infantiles', nombre: 'Copa Mickey',
    descripcion: 'Copa infantil de helado decorada de Mickey.',
    foto: '', emoji: '🐭', disponible: true, orden: 2, precio: 6000 },
  { id: 'copa-pinguino', categoria: 'infantiles', nombre: 'Copa Pingüino',
    descripcion: 'Copa infantil de helado decorada de pingüino.',
    foto: '', emoji: '🐧', disponible: true, orden: 3, precio: 6000 },
  { id: 'gusanito', categoria: 'infantiles', nombre: 'Gusanito',
    descripcion: 'Helado divertido con forma de gusanito y toppings.',
    foto: '', emoji: '🐛', disponible: true, orden: 4, precio: 6500 },
  { id: 'payasito', categoria: 'infantiles', nombre: 'Payasito',
    descripcion: 'Helado decorado de payasito, colorido y dulce.',
    foto: '', emoji: '🤡', disponible: true, orden: 5, precio: 6000 },
  { id: 'osito', categoria: 'infantiles', nombre: 'Osito',
    descripcion: 'Helado decorado de osito, ideal para los peques.',
    foto: '', emoji: '🧸', disponible: true, orden: 6, precio: 6500 },
  { id: 'vasito-feliz', categoria: 'infantiles', nombre: 'Vasito Feliz',
    descripcion: 'Vasito de helado con dulces sorpresa y toppings.',
    foto: '', emoji: '😊', disponible: true, orden: 7, precio: 10000 },
  { id: 'mini-banana', categoria: 'infantiles', nombre: 'Mini Banana',
    descripcion: 'Mini banana split para los más pequeños.',
    foto: '', emoji: '🍌', disponible: true, orden: 8, precio: 6500 },
  { id: 'copa-fresa-quipitos', categoria: 'infantiles', nombre: 'Copa Fresa Quipitos',
    descripcion: 'Copa de helado con fresas y Quipitos.',
    foto: '', emoji: '🍓', disponible: true, orden: 9, precio: 10000 },
  { id: 'copa-explosion-bubols', categoria: 'infantiles', nombre: 'Copa Explosión Bubols',
    descripcion: 'Copa de helado con explosión de Bubols y dulces.',
    foto: '', emoji: '💥', disponible: true, orden: 10, precio: 10000 },
  { id: 'waffle-junior', categoria: 'infantiles', nombre: 'Waffle Junior',
    descripcion: 'Waffle pequeño con helado y topping, para niños.',
    foto: '', emoji: '🧇', disponible: true, orden: 11, precio: 10000 },
  { id: 'crepes-junior', categoria: 'infantiles', nombre: 'Crepes Junior',
    descripcion: 'Crepe pequeño con helado y topping, para niños.',
    foto: '', emoji: '🥞', disponible: true, orden: 12, precio: 10000 },

  // ══════════════════ 🥪 SALADINES ══════════════════
  { id: 'crepe-salado', categoria: 'saladines', nombre: 'Crepe Salado',
    descripcion: 'Crepe relleno, gratinado y caliente. Elige la proteína.',
    foto: '', emoji: '🌯', disponible: true, orden: 1,
    variantes: [
      { id: 'crepe-carne', nombre: 'De Carne', precio: 14000 },
      { id: 'crepe-pollo', nombre: 'De Pollo', precio: 14000 },
      { id: 'crepe-mixto', nombre: 'Mixto (Carne y Pollo)', precio: 17000 },
    ] },
  { id: 'sandwich-jamon-queso', categoria: 'saladines', nombre: 'Sándwich Jamón y Queso',
    descripcion: 'Sándwich de jamón y queso caliente.',
    foto: '', emoji: '🥪', disponible: true, orden: 2, precio: 4500 },
  { id: 'sandwich-jugo', categoria: 'saladines', nombre: 'Sándwich y Jugo',
    descripcion: 'Sándwich acompañado de jugo natural.',
    foto: '', emoji: '🥪', disponible: true, orden: 3, precio: 8500 },

  // ══════════════════ ➕ ADICIONALES ══════════════════
  { id: 'ad-queso', categoria: 'adicionales', nombre: 'Queso',
    descripcion: 'Porción extra de queso rallado.', foto: '', emoji: '🧀', disponible: true, orden: 1, precio: 4000 },
  { id: 'ad-crema', categoria: 'adicionales', nombre: 'Crema',
    descripcion: 'Porción extra de crema de leche.', foto: '', emoji: '🥛', disponible: true, orden: 2, precio: 4000 },
  { id: 'ad-helado', categoria: 'adicionales', nombre: 'Helado',
    descripcion: 'Bola extra de helado.', foto: '', emoji: '🍨', disponible: true, orden: 3, precio: 2000 },
  { id: 'ad-desechable', categoria: 'adicionales', nombre: 'Desechable',
    descripcion: 'Empaque para llevar.', foto: '', emoji: '📦', disponible: true, orden: 4, precio: 500 },
]
