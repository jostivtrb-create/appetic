// 🍔 JASBURY — Comida rápida · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-jasbury.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// Estética sacada del ADN de ESTA marca (su logo + su carta): "rojo vivo, alegre y antojado".
// El logo es la palabra "Jasbury" en letra script blanca sobre ROJO PURO (#FF3131), con el
// eslogan "COMIDA DELICIOSA"; la carta impresa combina ese rojo con AMARILLO y fondo CREMA.
// De ahí salen: rojo #FF3131 de marca (botones, precios), amarillo dorado de acento y un
// "mundo" crema cálido — vibrante y de comida rápida, distinto a los demás locales.

export const SLUG = 'jasbury'

// Correo del DUEÑO que administra el local (entra a /jasbury/admin con ese Google).
// ⚠️ POR DEFECTO: queda 'sinfiniity@gmail.com' (NUESTRA cuenta, no la del cliente) porque el
//    dueño aún no dio su Gmail. Se cambia sin tocar código desde el panel de superadmin
//    (campo 👤 del local) o re-corriendo el seed con el correo real.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

// 🥖 Acompañante de las hamburguesas: la carta dice "con arepa o con pan" → elección obligatoria.
const ACOMP_AREPA_PAN = {
  id: 'g-acomp', nombre: 'Acompañante', subtitulo: 'Elige 1', emoji: '🥖',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'ac-pan', nombre: 'Con pan', emoji: '🍞', precioExtra: 0, foto: '' },
    { id: 'ac-arepa', nombre: 'Con arepa', emoji: '🫓', precioExtra: 0, foto: '' },
  ],
}

// 🍟 Combo opcional de las hamburguesas: "Llévala en combo con papa a la francesa y gaseosa
//    250 ml por $6.000 adicional". Un checkbox que suma $6.000.
const COMBO_BURGER = {
  id: 'g-combo', nombre: '¿La quieres en combo?', subtitulo: 'Opcional · suma $6.000', emoji: '🍟',
  tipo: 'multiple', min: 0,
  opciones: [
    { id: 'combo-si', nombre: 'Combo: papa a la francesa + gaseosa 250 ml', emoji: '🥤', precioExtra: 6000, foto: '' },
  ],
}

export const JASBURY_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Jasbury',
  descripcion: 'Comida deliciosa · aquí se cocina con amor ❤️',
  // 📱 Número POR DEFECTO (320 843 5143), no el del local: deja el checkout funcionando desde el
  //    minuto uno mientras Jasbury da el suyo. Los pedidos llegan a nosotros, no a ellos → por eso
  //    el local sigue inactivo en el buscador (ver `suscripcion` abajo). El dueño pone el real
  //    desde su panel (⚙️ Configuración → Datos del negocio); es también el número del afiche de
  //    domicilios de la pestaña 📣 Difundir.
  whatsapp: '573208435143',
  // 🎨 Hero "manchón pintado": el LOGO COMPLETO (pincel + texto) se pinta en zigzag.
  logo: '/locales/jasbury/logo.webp',         // logo completo transparente (fondo quitado con IA)
  logoAnim: 'manchon',                        // hero: se pinta en zigzag (LogoManchon)
  icono: '/locales/jasbury/icono.webp',       // cuadrado (buscador de locales)
  banner: '/locales/jasbury/banner.webp',     // queda por si se vuelve al hero de foto
  tema: {
    primary: '#FF3131',        // rojo puro del logo (botones, precios, chips activos)
    primaryStrong: '#C81B1B',  // rojo profundo (degradado / variante oscura)
    primarySoft: '#FF7A5E',    // coral cálido para el degradado del hero
    onPrimary: '#FFFFFF',      // texto sobre el rojo
    accent: '#FFC42E',         // amarillo dorado de la carta (acento secundario)
    bg: '#FBF2E6',             // "mundo" crema cálido (el fondo de su carta)
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
    { id: 'perros', nombre: 'Perros Calientes', emoji: '🌭' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🍟' },
    { id: 'especiales', nombre: 'Especiales', emoji: '⭐' },
    { id: 'burritos', nombre: 'Burritos', emoji: '🌯' },
    { id: 'broaster', nombre: 'Pollo Broaster', emoji: '🍗' },
    { id: 'entradas', nombre: 'Entradas', emoji: '🍢' },
    { id: 'adiciones', nombre: 'Adiciones', emoji: '➕' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🥤' },
  ],
  admins: [ADMIN_EMAIL],
  // activa:false → NO sale todavía en el buscador del inicio. Se enciende desde el panel de
  // superadmin cuando el local ya tenga su WhatsApp real y el dueño dé el visto bueno (si saliera
  // ahora, un cliente podría pedir y el pedido llegaría al número por defecto, no al de Jasbury).
  suscripcion: { activa: false, plan: 'piloto' },
  menuVersion: 1,
}

export const JASBURY_PRODUCTOS = [
  // ══════════════════ 🍔 HAMBURGUESAS ══════════════════
  // Todas: "con arepa o con pan" (obligatorio) + combo opcional (+$6.000).
  { id: 'hamburguesa-sencilla', categoria: 'hamburguesas', nombre: 'Hamburguesa Sencilla',
    descripcion: 'Carne de res Zenú 100 g, queso, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-sencilla.webp', emoji: '🍔', destacado: true, disponible: true, orden: 1, precio: 13000,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-sencilla-doble', categoria: 'hamburguesas', nombre: 'Hamburguesa Sencilla Doble Carne',
    descripcion: '2 carnes de res Zenú 100 g, queso, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-sencilla.webp', emoji: '🍔', disponible: true, orden: 2, precio: 18000,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-especial', categoria: 'hamburguesas', nombre: 'Hamburguesa Especial',
    descripcion: 'Carne de res Zenú 100 g, queso, huevos de codorniz, jamón, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-especial.webp', emoji: '🍔', disponible: true, orden: 3, precio: 14500,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-especial-doble', categoria: 'hamburguesas', nombre: 'Hamburguesa Especial Doble Carne',
    descripcion: '2 carnes de res Zenú 100 g, queso, huevos de codorniz, jamón, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-especial.webp', emoji: '🍔', disponible: true, orden: 4, precio: 19500,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-ahumada', categoria: 'hamburguesas', nombre: 'Hamburguesa Ahumada Super',
    descripcion: 'Carne de res koller 110 g, queso, huevos de codorniz, jamón, tocineta, pollo desmenuzado, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-ahumada.webp', emoji: '🍔', destacado: true, disponible: true, orden: 5, precio: 18200,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-ahumada-doble', categoria: 'hamburguesas', nombre: 'Hamburguesa Ahumada Super Doble Carne',
    descripcion: '2 carnes de res koller 110 g, queso, huevos de codorniz, jamón, tocineta, pollo desmenuzado, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-ahumada.webp', emoji: '🍔', disponible: true, orden: 6, precio: 22200,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-pollo-apanado', categoria: 'hamburguesas', nombre: 'Hamburguesa de Pollo Apanado',
    descripcion: 'Carne de pollo apanado Klik 125 g, queso, huevos de codorniz, jamón, tocineta, pollo desmenuzado, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-pollo-apanado.webp', emoji: '🍗', disponible: true, orden: 7, precio: 18700,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-pollo-apanado-doble', categoria: 'hamburguesas', nombre: 'Hamburguesa de Pollo Apanado Doble Carne',
    descripcion: '2 carnes de pollo apanado Klik 125 g, queso, huevos de codorniz, jamón, tocineta, pollo desmenuzado, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-pollo-apanado.webp', emoji: '🍗', disponible: true, orden: 8, precio: 23700,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-mixta', categoria: 'hamburguesas', nombre: 'Hamburguesa Mixta',
    descripcion: 'Una carne de pollo apanado Klik 125 g, una carne de res koller 110 g, queso, huevos de codorniz, jamón, tocineta, pollo desmenuzado, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-mixta.webp', emoji: '🍔', destacado: true, disponible: true, orden: 9, precio: 22500,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-ranchera', categoria: 'hamburguesas', nombre: 'Hamburguesa Ranchera',
    descripcion: 'Carne de res Zenú 100 g, salchicha ranchera, queso, huevo frito, tocineta, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-ranchera.webp', emoji: '🍔', disponible: true, orden: 10, precio: 17200,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },
  { id: 'hamburguesa-platano', categoria: 'hamburguesas', nombre: 'Hamburguesa de Plátano de la Casa',
    descripcion: 'Una carne de pollo apanado Klik 125 g, una carne de res koller 110 g, doble queso, huevo frito, jamón, doble tocineta, pollo desmenuzado, maíz tierno, lechuga, tomate, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/hamburguesa-platano.webp', emoji: '🍔', destacado: true, disponible: true, orden: 11, precio: 29500,
    gruposOpciones: [ACOMP_AREPA_PAN, COMBO_BURGER] },

  // ══════════════════ 🌭 PERROS CALIENTES ══════════════════
  { id: 'perro-sencillo', categoria: 'perros', nombre: 'Perro Sencillo',
    descripcion: 'Pan bimbo, salchicha Berna 60 g, queso, cebolla cruda, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/perro-sencillo.webp', emoji: '🌭', disponible: true, orden: 1, precio: 8200 },
  { id: 'perro-especial', categoria: 'perros', nombre: 'Perro Especial',
    descripcion: 'Pan bimbo, salchicha Berna 60 g, queso, huevos de codorniz, jamón, cebolla cruda, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/perro-sencillo.webp', emoji: '🌭', disponible: true, orden: 2, precio: 11200 },
  { id: 'perro-americano', categoria: 'perros', nombre: 'Perro Americano',
    descripcion: 'Pan bimbo, salchicha Americana Zenú 80 g, queso, huevos de codorniz, jamón, cebolla cruda, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/perro-americano.webp', emoji: '🌭', destacado: true, disponible: true, orden: 3, precio: 16000 },
  { id: 'perro-super-americano-pollo', categoria: 'perros', nombre: 'Perro Super Americano de Pollo',
    descripcion: 'Pan bimbo, salchicha Americana Zenú 80 g, queso, huevos de codorniz, jamón, pollo desmenuzado, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/perro-americano.webp', emoji: '🌭', disponible: true, orden: 4, precio: 17700 },
  { id: 'perro-super-americano-carne', categoria: 'perros', nombre: 'Perro Super Americano de Carne',
    descripcion: 'Pan bimbo, salchicha Americana Zenú 80 g, queso, huevos de codorniz, jamón, carne desmenuzada, cebolla caramelizada, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/perro-americano.webp', emoji: '🌭', disponible: true, orden: 5, precio: 18200 },
  { id: 'perro-criollo', categoria: 'perros', nombre: 'Perro Criollo',
    descripcion: 'Pan bimbo, salchicha Americana Zenú 80 g, queso, huevos de codorniz, jamón, carne desmenuzada, maíz tierno, trocitos de tomate, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/perro-americano.webp', emoji: '🌭', destacado: true, disponible: true, orden: 6, precio: 19200 },
  { id: 'choriperro', categoria: 'perros', nombre: 'Choriperro',
    descripcion: 'Pan bimbo, chorizo del chaval 135 g, queso, huevos de codorniz, jamón, cebolla cruda, papa triturada y todas las salsas.',
    foto: '/locales/jasbury/choriperro.webp', emoji: '🌭', disponible: true, orden: 7, precio: 16200 },

  // ══════════════════ 🍟 SALCHIPAPAS ══════════════════
  { id: 'salchipapa-sencilla', categoria: 'salchipapas', nombre: 'Salchipapa Sencilla',
    descripcion: 'Papa a la francesa, salchicha Berna 60 g, huevo de codorniz y todas las salsas.',
    foto: '/locales/jasbury/salchipapa-sencilla.webp', emoji: '🍟', disponible: true, orden: 1, precio: 8800 },
  { id: 'salchipapa-americana', categoria: 'salchipapas', nombre: 'Salchipapa Americana',
    descripcion: 'Papa a la francesa, salchicha americana 80 g, 1 tajada de queso doble crema y todas las salsas.',
    foto: '/locales/jasbury/salchipapa-sencilla.webp', emoji: '🍟', disponible: true, orden: 2, precio: 11500 },
  { id: 'salchipapa-mixta', categoria: 'salchipapas', nombre: 'Salchipapa Mixta',
    descripcion: 'Papa a la francesa, salchicha americana 80 g, pollo desmenuzado, carne desmenuzada, 2 tajadas de queso doble crema y todas las salsas.',
    foto: '/locales/jasbury/salchipapa-mixta.webp', emoji: '🍟', destacado: true, disponible: true, orden: 3, precio: 22000 },
  { id: 'salchipapa-costena', categoria: 'salchipapas', nombre: 'Salchipapa Costeña',
    descripcion: 'Papa a la francesa, salchicha americana 80 g, lechuga, tomate, cebolla cruda, queso costeño, huevos de codorniz y todas las salsas.',
    foto: '/locales/jasbury/salchipapa-costena.webp', emoji: '🍟', disponible: true, orden: 4, precio: 16700 },
  { id: 'salchipapa-familiar', categoria: 'salchipapas', nombre: 'Salchipapa Familiar',
    descripcion: 'Papa a la francesa, 2 salchichas americanas, 1 salchicha berna, 1 chorizo del chaval, carne desmenuzada, pollo desmenuzado, cuadritos de plátano, maíz tierno y queso. ¡Para compartir!',
    foto: '/locales/jasbury/salchipapa-mixta.webp', emoji: '🍟', destacado: true, disponible: true, orden: 5, precio: 55000 },
  { id: 'choripapa', categoria: 'salchipapas', nombre: 'Choripapa',
    descripcion: 'Papa a la francesa, chorizo chaval 135 g y todas las salsas.',
    foto: '/locales/jasbury/choripapa.webp', emoji: '🍟', disponible: true, orden: 6, precio: 17000 },

  // ══════════════════ ⭐ ESPECIALES ══════════════════
  { id: 'empanadas', categoria: 'especiales', nombre: 'Empanadas',
    descripcion: 'De pollo con arroz, crocantes y recién hechas.',
    foto: '/locales/jasbury/empanadas.webp', emoji: '🥟', disponible: true, orden: 1, precio: 3000 },
  { id: 'pechuga-plancha', categoria: 'especiales', nombre: 'Pechuga a la Plancha',
    descripcion: 'Pechuga a la plancha, papa a la francesa y ensalada de lechuga, tomate, cebolla y vinagreta de la casa.',
    foto: '/locales/jasbury/pechuga-plancha.webp', emoji: '🍗', disponible: true, orden: 2, precio: 23500 },
  { id: 'pechuga-gratinada', categoria: 'especiales', nombre: 'Pechuga a la Plancha Gratinada',
    descripcion: 'Pechuga a la plancha, 2 tajadas de queso gratinado, papa a la francesa y ensalada de lechuga, tomate, cebolla y vinagreta de la casa.',
    foto: '/locales/jasbury/pechuga-plancha.webp', emoji: '🍗', disponible: true, orden: 3, precio: 26000 },
  { id: 'pechuga-criolla', categoria: 'especiales', nombre: 'Pechuga Criolla',
    descripcion: 'Pechuga a la plancha, maíz tierno, ahogado, queso, papa a la francesa y ensalada de lechuga, tomate, cebolla y vinagreta de la casa.',
    foto: '/locales/jasbury/pechuga-criolla.webp', emoji: '🍗', destacado: true, disponible: true, orden: 4, precio: 29500 },
  { id: 'churrasco', categoria: 'especiales', nombre: 'Churrasco',
    descripcion: 'Churrasco a la parrilla, papa a la francesa y ensalada de lechuga, tomate, cebolla y vinagreta de la casa.',
    foto: '/locales/jasbury/churrasco.webp', emoji: '🥩', destacado: true, disponible: true, orden: 5, precio: 24500 },
  { id: 'tabla-mixta', categoria: 'especiales', nombre: 'Tabla Mixta',
    descripcion: 'Res, pechuga, chorizo santarrosano, patacones y arepita de la casa. ¡Para compartir!',
    foto: '/locales/jasbury/tabla-mixta.webp', emoji: '🍢', destacado: true, disponible: true, orden: 6, precio: 31500 },
  { id: 'mazorcada-sencilla', categoria: 'especiales', nombre: 'Mazorcada Sencilla',
    descripcion: 'Maíz tierno desgranado, queso, huevos de codorniz, pollo desmenuzado, papa triturada y salsa tártara, rosada y BBQ.',
    foto: '/locales/jasbury/mazorcada.webp', emoji: '🌽', disponible: true, orden: 7, precio: 18200 },
  { id: 'mazorcada-mixta', categoria: 'especiales', nombre: 'Mazorcada Mixta',
    descripcion: 'Maíz tierno desgranado, queso, huevos de codorniz, pollo desmenuzado, carne desmenuzada, papa triturada y salsa tártara, rosada y BBQ.',
    foto: '/locales/jasbury/mazorcada.webp', emoji: '🌽', disponible: true, orden: 8, precio: 21500 },
  { id: 'patacon-sencillo', categoria: 'especiales', nombre: 'Patacón Sencillo',
    descripcion: 'Plátano pintón, carne desmenuzada, pollo desmenuzado, huevos de codorniz, jamón, queso, cebolla caramelizada y salsa tártara, rosada y BBQ.',
    foto: '/locales/jasbury/patacon.webp', emoji: '🍌', disponible: true, orden: 9, precio: 29000 },
  { id: 'patacon-especial', categoria: 'especiales', nombre: 'Patacón Especial',
    descripcion: 'Plátano pintón, carne desmenuzada, pollo desmenuzado, huevos de codorniz, chorizo, jamón, queso, cebolla caramelizada y salsa tártara, rosada y BBQ.',
    foto: '/locales/jasbury/patacon.webp', emoji: '🍌', disponible: true, orden: 10, precio: 33000 },

  // ══════════════════ 🌯 BURRITOS ══════════════════
  { id: 'burrito-sencillo', categoria: 'burritos', nombre: 'Burrito Sencillo',
    descripcion: 'Lechuga, tomate, queso y salsa de la casa. Elige tu proteína.',
    foto: '/locales/jasbury/burrito.webp', emoji: '🌯', disponible: true, orden: 1, precio: 11500,
    gruposOpciones: [
      { id: 'g-prot', nombre: 'Proteína', subtitulo: 'Elige 1', emoji: '🥩', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'pr-carne', nombre: 'Carne', emoji: '🥩', precioExtra: 0, foto: '' },
          { id: 'pr-pollo', nombre: 'Pollo', emoji: '🍗', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'burrito-mixto', categoria: 'burritos', nombre: 'Burrito Mixto',
    descripcion: 'Carne y pollo, lechuga, tomate, queso y salsa de la casa.',
    foto: '/locales/jasbury/burrito.webp', emoji: '🌯', disponible: true, orden: 2, precio: 16000 },
  { id: 'burrito-mexicano', categoria: 'burritos', nombre: 'Burrito Mexicano',
    descripcion: 'Carne guisada en salsa picante, chorizo, guacamole, pico de gallo, lechuga y queso.',
    foto: '/locales/jasbury/burrito.webp', emoji: '🌶️', destacado: true, disponible: true, orden: 3, precio: 17500 },
  { id: 'burrito-colombiano', categoria: 'burritos', nombre: 'Burrito Colombiano',
    descripcion: 'Pollo desmenuzado, chorizo santarrosano, maíz tierno, trocitos de plátano, pico de gallo y aguacate.',
    foto: '/locales/jasbury/burrito.webp', emoji: '🌯', disponible: true, orden: 4, precio: 18500 },

  // ══════════════════ 🍗 POLLO BROASTER ══════════════════
  { id: 'medio-pollo', categoria: 'broaster', nombre: 'Medio Pollo Broaster',
    descripcion: 'Medio pollo apanado y crocante, acompañado de papa a la francesa y croquetas de yuca.',
    foto: '/locales/jasbury/pollo-broaster.webp', emoji: '🍗', disponible: true, orden: 1, precio: 23000 },
  { id: 'pollo-completo', categoria: 'broaster', nombre: 'Pollo Completo Broaster',
    descripcion: 'Pollo entero apanado y crocante, acompañado de papa a la francesa y croquetas de yuca. ¡Para compartir!',
    foto: '/locales/jasbury/pollo-broaster.webp', emoji: '🍗', destacado: true, disponible: true, orden: 2, precio: 39000 },

  // ══════════════════ 🍢 ENTRADAS ══════════════════
  { id: 'chorizo-chaval', categoria: 'entradas', nombre: 'Chorizo Chaval',
    descripcion: '1 unidad de 135 g, doradito y jugoso.',
    foto: '/locales/jasbury/chorizo-chaval.webp', emoji: '🌭', disponible: true, orden: 1, precio: 5500 },
  { id: 'canasticas-platano', categoria: 'entradas', nombre: 'Canásticas de Plátano',
    descripcion: '2 unidades de pollo y 2 unidades de carne, sobre canastica de plátano crocante.',
    foto: '/locales/jasbury/canasticas-platano.webp', emoji: '🍌', destacado: true, disponible: true, orden: 2, precio: 12000 },
  { id: 'pincho-pollo', categoria: 'entradas', nombre: 'Pincho de Pollo Apanado',
    descripcion: 'Pincho de pollo apanado, crocante y jugoso.',
    foto: '/locales/jasbury/pincho-pollo.webp', emoji: '🍢', disponible: true, orden: 3,
    variantes: [
      { id: 'pincho-solo', nombre: 'Solo (1 unidad)', precio: 6500 },
      { id: 'pincho-papa', nombre: 'Con papa a la francesa', precio: 10000 },
    ] },

  // ══════════════════ ➕ ADICIONES ══════════════════
  { id: 'ad-papa-francesa', categoria: 'adiciones', nombre: 'Porción de Papa Francesa',
    descripcion: 'Papa a la francesa doradita.', foto: '/locales/jasbury/ad-papa-francesa.webp', emoji: '🍟', disponible: true, orden: 1, precio: 6000 },
  { id: 'ad-pollo-desmechado', categoria: 'adiciones', nombre: 'Adición Pollo Desmechado',
    descripcion: 'Porción de pollo desmenuzado.', foto: '', emoji: '🍗', disponible: true, orden: 2, precio: 6000 },
  { id: 'ad-carne-desmechada', categoria: 'adiciones', nombre: 'Adición Carne Desmechada',
    descripcion: 'Porción de carne desmenuzada.', foto: '', emoji: '🥩', disponible: true, orden: 3, precio: 6500 },
  { id: 'ad-maiz-tierno', categoria: 'adiciones', nombre: 'Adición de Maíz Tierno',
    descripcion: 'Porción de maíz tierno.', foto: '', emoji: '🌽', disponible: true, orden: 4, precio: 5500 },
  { id: 'ad-platano', categoria: 'adiciones', nombre: 'Plátano',
    descripcion: 'Porción de plátano.', foto: '', emoji: '🍌', disponible: true, orden: 5, precio: 4500 },
  { id: 'ad-tajada-queso', categoria: 'adiciones', nombre: 'Tajada de Queso',
    descripcion: 'Tajada de queso doble crema.', foto: '', emoji: '🧀', disponible: true, orden: 6, precio: 2200 },

  // ══════════════════ 🥤 BEBIDAS ══════════════════
  { id: 'limonada-natural', categoria: 'bebidas', nombre: 'Limonada Natural',
    descripcion: 'Refrescante, recién hecha.', foto: '/locales/jasbury/limonada.webp', emoji: '🍋', disponible: true, orden: 1, precio: 6000 },
  { id: 'cerezada', categoria: 'bebidas', nombre: 'Cerezada',
    descripcion: 'Bebida de cereza bien fría. ¡Pregunta por los sabores disponibles!', foto: '/locales/jasbury/cerezada.webp', emoji: '🍒', disponible: true, orden: 2, precio: 7500 },
  { id: 'jugo-natural', categoria: 'bebidas', nombre: 'Jugo Natural',
    descripcion: 'Jugo de fruta natural. ¡Pregunta por los sabores disponibles!', foto: '/locales/jasbury/jugo-natural.webp', emoji: '🧃', disponible: true, orden: 3,
    variantes: [
      { id: 'jugo-agua', nombre: 'En agua', precio: 7000 },
      { id: 'jugo-leche', nombre: 'En leche', precio: 8500 },
    ] },
  { id: 'gaseosa', categoria: 'bebidas', nombre: 'Gaseosa',
    descripcion: 'Bien fría. Elige el tamaño.', foto: '', emoji: '🥤', disponible: true, orden: 4,
    variantes: [
      { id: 'gas-250', nombre: '250 ml', precio: 2500 },
      { id: 'gas-350', nombre: '350 ml', precio: 3700 },
      { id: 'gas-400', nombre: '400 ml', precio: 4200 },
      { id: 'gas-15', nombre: '1.5 L', precio: 6500 },
    ] },
  { id: 'coca-cola-15', categoria: 'bebidas', nombre: 'Coca-Cola 1.5 L',
    descripcion: 'Botella de 1.5 litros bien fría.', foto: '', emoji: '🥤', disponible: true, orden: 5, precio: 7000 },
  { id: 'agua', categoria: 'bebidas', nombre: 'Agua',
    descripcion: 'Botella personal.', foto: '', emoji: '💧', disponible: true, orden: 6, precio: 2200 },
]
