// 🧩 PLANTILLA de un LOCAL de Appetic — cópiala a src/dev/<nombreCamelCase>.js
//
// Este archivo es la ÚNICA fuente de verdad de un local. Lo usan:
//   • La vista previa  (?preview=1 · registrado en src/preview.js)
//   • El alta real      (scripts/seed-<slug>.mjs escribe esto en Firestore)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
// El logo/banner/fotos se referencian por su RUTA pública (/locales/<slug>/...).
//
// 🎯 REGLA DE ORO: lo ÚNICO que cambia entre locales es la IDENTIDAD
//    (slug, nombre, tema de colores, logo/banner, categorías/emojis, productos y fotos).
//    El flujo (carrito, checkout→WhatsApp, panel admin, buscador) NO se toca: ya existe
//    en el motor de la app y se arma solo a partir de estos datos.

export const SLUG = '[[SLUG]]'              // minúsculas-con-guiones, es el link: /su-negocio

// Correo del DUEÑO que administra el local (entra a /[[SLUG]]/admin con ese Google).
// 👉 Si el dueño real no dio su Gmail, deja el DEFAULT 'sinfiniity@gmail.com' y sigue: se cambia
//    después desde el panel de superadmin (campo 👤) sin tocar código. Ojo: con el default entra
//    NUESTRA cuenta, no la del cliente — dilo al entregar.
export const ADMIN_EMAIL = '[[ADMIN_EMAIL]]'

export const [[CONST]]_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: '[[NOMBRE]]',
  descripcion: '[[ESLOGAN]]',
  // 📱 A dónde llegan los pedidos. NUNCA lo dejes en '': con vacío el cliente arma el pedido y el
  // botón no tiene destino. Si el local no dio su número, deja el DEFAULT '573208435143' para que
  // el checkout funcione desde el minuto uno; el dueño pone el suyo en el panel
  // (⚙️ Configuración → Datos del negocio). Es también el número del afiche de domicilios.
  whatsapp: '573208435143',

  // 🎨 IDENTIDAD VISUAL — esto hace ÚNICO al local (se aplica como variables CSS).
  logo: '/locales/[[SLUG]]/logo.webp',      // '' = muestra la inicial del nombre
  banner: '/locales/[[SLUG]]/banner.webp',  // '' = hero con degradado del tema
  tema: {
    primary:       '[[PRIMARY]]',       // color de marca principal (botones, precios, chips activos)
    primaryStrong: '[[PRIMARY_STRONG]]',// variante oscura del primary
    primarySoft:   '[[PRIMARY_SOFT]]',  // variante clara/acento del primary (degradado del hero)
    onPrimary:     '#FFFFFF',           // texto SOBRE el primary (#fff si el primary es oscuro)
    accent:        '[[ACCENT]]',        // acento secundario
    bg:            '[[BG]]',            // fondo del "mundo" del local (crema/tinte de la marca)
    // hero: 'logo',   // (opcional) hero con el LOGO grande (para logos que traen el nombre / emblema).
    //                 // Con skin oscuro va perfecto con un logo TRANSPARENTE (ver identidad_y_skin.md).
    //                 // Si el logo NO trae el nombre, NO lo pongas: usa el hero por defecto (banner + nombre).
    // skin: '<x>',    // (opcional) SKIN propio del local, cuando la marca pide más que recolorear
    //                 // (fondo oscuro, tipografía/títulos/iconografía a su medida). El motor añade la
    //                 // clase .local-skin-<x> y tú la estilizas scopeada (no afecta a otros locales).
    //                 // 'jet' es la piel HECHA PARA PILOTOS (negro/brasa, vino+dorado, stencil, jet):
    //                 // úsala de EJEMPLO/molde, NO la calques en otra marca — crea la de ESA marca a su
    //                 // medida a partir de su ADN. Con skin oscuro: categorías con emoji:''. Ver
    //                 // references/identidad_y_skin.md.
  },

  // ⏰ Horario. { abre:'00:00', cierra:'00:00' } = 24h (útil para probar). El dueño lo ajusta luego.
  horario: { abre: '00:00', cierra: '00:00' },

  // 🛵 Entrega
  recoger: true,
  domicilio: {
    activo: false,   // false = solo "recoger" hasta que el dueño fije ubicación y lo active en el panel
    maxKm: 3,
    tarifas: {},     // ej. { '0.5':2000, '1.0':2000, '2.0':3500, '3.0':5000 } (por rangos de km)
  },

  // 💳 Pagos
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],

  // 🗂️ Categorías del menú (id + nombre + emoji). El orden define el orden en pantalla.
  //    Si hay 1 sola categoría o muy pocos productos, puedes ocultar la barra: ocultarNav: true
  categorias: [
    { id: '[[CAT1_ID]]', nombre: '[[CAT1]]', emoji: '[[CAT1_EMOJI]]' },
    // ...
  ],

  admins: [ADMIN_EMAIL],
  suscripcion: { activa: true, plan: 'piloto' },  // activa:true → aparece en el buscador del inicio
  menuVersion: 1,  // súbelo (2, 3…) cada vez que cambies la CARTA FIJA para invalidar la caché del cliente
}

export const [[CONST]]_PRODUCTOS = [
  // ── Ejemplo A: producto SIMPLE (precio fijo, sin opciones) → se agrega directo al carrito.
  { id: 'prod-simple', categoria: '[[CAT1_ID]]', nombre: 'Producto simple',
    descripcion: 'Descripción corta y antojable.', foto: '/locales/[[SLUG]]/prod-simple.webp',
    emoji: '🍽️', disponible: true, orden: 1, precio: 12000 },

  // ── Ejemplo B: producto con VARIANTES (elige tamaño; cada tamaño fija el precio) → abre modal.
  { id: 'prod-variantes', categoria: '[[CAT1_ID]]', nombre: 'Con tamaños',
    descripcion: 'Elige el tamaño.', foto: '', emoji: '🥤', disponible: true, orden: 2,
    variantes: [
      { id: 'v-p', nombre: 'Pequeño', precio: 8000 },
      { id: 'v-g', nombre: 'Grande', precio: 11000 },
    ] },

  // ── Ejemplo C: producto con GRUPOS DE OPCIONES → abre modal.
  //    tipo:'unica'  = elige 1 (radio). Con min:1,max:1 queda OBLIGATORIO.
  //    tipo:'multiple' = elige varias (checkbox). precioExtra suma al precio.
  //    👉 Para ALMUERZOS (menú del día): modela el plato así (Proteína/Principio/Jugo 'unica'
  //       min1,max1). El dueño cambia esas opciones a diario desde el panel.
  { id: 'prod-combo', categoria: '[[CAT1_ID]]', nombre: 'Combo a elección',
    descripcion: 'Arma tu combo.', foto: '', emoji: '🍛', destacado: true, disponible: true, orden: 3,
    precio: 15000,
    gruposOpciones: [
      { id: 'g-proteina', nombre: 'Proteína', subtitulo: 'Elige 1', emoji: '🍗',
        tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'p1', nombre: 'Opción A', emoji: '🍗', precioExtra: 0, foto: '' },
          { id: 'p2', nombre: 'Opción B', emoji: '🥩', precioExtra: 0, foto: '' },
        ] },
      { id: 'g-adiciones', nombre: 'Adiciones', subtitulo: 'Opcional', emoji: '➕',
        tipo: 'multiple', min: 0,
        opciones: [
          { id: 'a1', nombre: 'Extra 1', emoji: '🧀', precioExtra: 3000, foto: '' },
        ] },
    ] },

  // ── Ejemplo D (opcional): ARMADOR POR PASOS (wizard) → para "arma tu X" con toppings/salsas libres.
  //    modo:'pasos' abre el armador paso a paso en vez de la lista. (ej. Perros Criiollos)
  // { id: 'arma-tu-x', categoria: '...', nombre: 'Arma tu X', descripcion: '...', foto: '', emoji: '🌭',
  //   destacado: true, disponible: true, orden: 1, precio: 7000, modo: 'pasos',
  //   gruposOpciones: [
  //     { id: 'g-toppings', nombre: 'Toppings', subtitulo: 'Los que quieras', emoji: '🧀',
  //       tipo: 'multiple', min: 0, opciones: [ /* ... precioExtra: 0 = gratis ... */ ] },
  //   ] },
]
