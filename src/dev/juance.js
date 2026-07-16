// 🔥 JUANCE — Pizzería y Comidas Rápidas · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-juance.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// Estética sacada del ADN de ESTA marca (su logo + su menú): "fuego sobre noche violeta".
// El logo es un emblema de llama con porción de pizza y hamburguesa, sobre madera negra
// violácea, con el nombre en LILA y chispas lilas; el menú impreso es negro con rojo y dorado.
// De ahí salen: fondo noche-violeta, brasa naranja para los botones y LILA para los precios
// — el lila es la firma de JUANCE y lo que la separa de cualquier otra comida rápida.

export const SLUG = 'juance'

// Correo del DUEÑO que administra el local (entra a /juance/admin con ese Google).
// ⚠️ PENDIENTE: reemplazar por el Gmail real del dueño antes de entregar.
//    Mientras tanto queda el correo de pruebas. Basta re-correr el seed con el correo correcto.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

// 🍕 Sabores de pizza.
// ⚠️ APROXIMACIÓN: el menú impreso lista los TAMAÑOS pero no los sabores. Estos son los
//    típicos de una pizzería colombiana; el dueño los ajusta a los suyos desde su panel.
const SABORES_PIZZA = {
  id: 'g-pizza-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🍕',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'ps-pepperoni', nombre: 'Pepperoni', emoji: '🍕', precioExtra: 0, foto: '' },
    { id: 'ps-hawaiana', nombre: 'Hawaiana (jamón y piña)', emoji: '🍍', precioExtra: 0, foto: '' },
    { id: 'ps-pollo-champ', nombre: 'Pollo con champiñón', emoji: '🍗', precioExtra: 0, foto: '' },
    { id: 'ps-carnes', nombre: 'Carnes mixtas', emoji: '🥩', precioExtra: 0, foto: '' },
    { id: 'ps-tres-quesos', nombre: 'Tres quesos', emoji: '🧀', precioExtra: 0, foto: '' },
    { id: 'ps-margarita', nombre: 'Margarita', emoji: '🌿', precioExtra: 0, foto: '' },
  ],
}

export const JUANCE_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'JUANCE',
  descripcion: '¡Sabor que te encanta! · Pizzería y comidas rápidas 🔥',
  // 📱 Número POR DEFECTO (320 843 5143), no el del local: deja el checkout funcionando mientras
  //    JUANCE da el suyo. Los pedidos llegan a nosotros, no a ellos → por eso el local sigue
  //    inactivo en el buscador (ver `suscripcion` abajo). El dueño pone el real desde su panel
  //    (⚙️ Configuración → Datos del negocio); es también el número del afiche de domicilios.
  whatsapp: '573208435143',
  logo: '/locales/juance/logo.webp',    // emblema transparente: FLOTA grande en el hero
  icono: '/locales/juance/icono.webp',  // cuadrado (la llama con pizza y hamburguesa): cuadritos
  banner: '/locales/juance/banner.webp',
  tema: {
    primary: '#D9532A',        // brasa / fuego del emblema (botones, chips activos)
    primaryStrong: '#8E2A12',  // brasa profunda
    primarySoft: '#C89BE0',    // lila del logo
    onPrimary: '#FFFFFF',
    accent: '#C9A2F0',         // lila brillante: los precios — la firma de la marca
    bg: '#140D1C',             // noche violeta (la madera del logo)
    hero: 'logo',              // el emblema completo en GRANDE en el header
    skin: 'juance',            // piel propia (src/pages/Local/LocalSkinJuance.css)
  },
  // 24 horas (abre === cierra): útil para probar a cualquier hora. El dueño ajusta el real.
  horario: { abre: '00:00', cierra: '00:00' },
  recoger: true,
  domicilio: { activo: false, maxKm: 3, tarifas: {} },
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],
  // Sin emojis: la marca usa la silueta de su llama (la pone el skin 'juance' por CSS).
  categorias: [
    { id: 'pizzas', nombre: 'Pizzas', emoji: '' },
    { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '' },
    { id: 'fuertes', nombre: 'Platos Fuertes', emoji: '' },
    { id: 'picar', nombre: 'Para Picar', emoji: '' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '' },
  ],
  admins: [ADMIN_EMAIL],
  // activa:false → NO sale todavía en el buscador del inicio. Se enciende desde el panel de
  // superadmin cuando el local ya tenga su WhatsApp y el dueño dé el visto bueno (si saliera
  // ahora, un cliente podría pedir y el pedido no tendría a dónde llegar).
  suscripcion: { activa: false, plan: 'piloto' },
  menuVersion: 1,
}

export const JUANCE_PRODUCTOS = [
  // ── 🍕 PIZZAS · la insignia del local (el aviso dice "PIZZERÍA" primero).
  //    Tamaño = variantes (fija el precio) + sabor = grupo 'unica' obligatorio.
  { id: 'pizza', categoria: 'pizzas', nombre: 'Pizza', descripcion: 'Masa recién horneada, mozzarella que se estira y salsa de la casa. Elige tamaño y sabor.', foto: '/locales/juance/pizza.webp', emoji: '🍕', destacado: true, disponible: true, orden: 1,
    variantes: [
      { id: 'pz-porcion', nombre: 'Porción', precio: 6500 },
      { id: 'pz-mediana', nombre: 'Mediana', precio: 30000 },
      { id: 'pz-grande', nombre: 'Grande', precio: 50000 },
    ],
    gruposOpciones: [SABORES_PIZZA] },

  // ── 🍔 HAMBURGUESAS · precio fijo (el menú no lista adiciones).
  { id: 'hamburguesa-sencilla', categoria: 'hamburguesas', nombre: 'Hamburguesa Sencilla', descripcion: 'Carne a la parrilla, queso cheddar, lechuga, tomate y salsas de la casa.', foto: '/locales/juance/hamburguesa-sencilla.webp', emoji: '🍔', disponible: true, orden: 2, precio: 8000 },
  { id: 'hamburguesa-especial', categoria: 'hamburguesas', nombre: 'Hamburguesa Especial', descripcion: 'Carne a la parrilla, queso cheddar, tocineta, lechuga, tomate y salsas de la casa.', foto: '/locales/juance/hamburguesa-especial.webp', emoji: '🍔', destacado: true, disponible: true, orden: 3, precio: 11000 },

  // ── 🥩 PLATOS FUERTES
  { id: 'lasana', categoria: 'fuertes', nombre: 'Lasaña', descripcion: 'Capas de pasta con carne en salsa napolitana y queso gratinado al horno, con un toque de albahaca.', foto: '/locales/juance/lasana.webp', emoji: '🍝', disponible: true, orden: 4, precio: 12000 },
  { id: 'pechuga-plancha', categoria: 'fuertes', nombre: 'Pechuga a la Plancha', descripcion: 'Pechuga de pollo asada, acompañada de papa a la francesa y ensalada.', foto: '/locales/juance/pechuga.webp', emoji: '🍗', disponible: true, orden: 5, precio: 15000 },
  { id: 'carne-asada', categoria: 'fuertes', nombre: 'Carne Asada', descripcion: 'Corte de res a la parrilla, acompañado de papa a la francesa y ensalada.', foto: '/locales/juance/carne-asada.webp', emoji: '🥩', destacado: true, disponible: true, orden: 6, precio: 16000 },

  // ── 🍟 PARA PICAR
  { id: 'salchipapa', categoria: 'picar', nombre: 'Salchipapa', descripcion: 'Papa a la francesa con salchicha dorada y las salsas de la casa.', foto: '/locales/juance/salchipapa.webp', emoji: '🌭', disponible: true, orden: 7, precio: 5000 },
  { id: 'pastel-yuca', categoria: 'picar', nombre: 'Pastel de Yuca', descripcion: 'Masa de yuca crocante por fuera y suave por dentro, recién frita.', foto: '/locales/juance/pastel-yuca.webp', emoji: '🥟', disponible: true, orden: 8, precio: 3500 },
  { id: 'empanada-carne', categoria: 'picar', nombre: 'Empanada de Carne', descripcion: 'Crocante por fuera, rellena de carne jugosa. Recién frita.', foto: '/locales/juance/empanada-carne.webp', emoji: '🥟', disponible: true, orden: 9, precio: 4000 },

  // ── 🥤 BEBIDAS (las reales de JUANCE)
  { id: 'gaseosa', categoria: 'bebidas', nombre: 'Gaseosa', descripcion: 'Botella personal de 400 ml, bien fría. Elige tu sabor.', foto: '/locales/juance/gaseosa.webp', emoji: '🥤', disponible: true, orden: 9, precio: 3000,
    gruposOpciones: [
      { id: 'g-gaseosa-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🥤', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'gs-cocacola', nombre: 'Coca-Cola', emoji: '🥤', precioExtra: 0, foto: '' },
          { id: 'gs-colombiana', nombre: 'Colombiana', emoji: '🥤', precioExtra: 0, foto: '' },
          { id: 'gs-manzana', nombre: 'Manzana Postobón', emoji: '🍎', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'jugo-hit', categoria: 'bebidas', nombre: 'Jugo Hit', descripcion: 'Jugo Hit bien frío. Elige tu sabor.', foto: '/locales/juance/jugo-hit.webp', emoji: '🧃', disponible: true, orden: 10, precio: 4000,
    gruposOpciones: [
      { id: 'g-hit-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🧃', tipo: 'unica', min: 1, max: 1,
        opciones: [
          { id: 'hit-mango', nombre: 'Mango', emoji: '🥭', precioExtra: 0, foto: '' },
          { id: 'hit-lulo', nombre: 'Lulo', emoji: '🟢', precioExtra: 0, foto: '' },
          { id: 'hit-tropical', nombre: 'Tropical', emoji: '🍹', precioExtra: 0, foto: '' },
          { id: 'hit-mora', nombre: 'Mora', emoji: '🫐', precioExtra: 0, foto: '' },
        ] },
    ] },
  { id: 'agua', categoria: 'bebidas', nombre: 'Agua', descripcion: 'Botella personal.', foto: '/locales/juance/agua.webp', emoji: '💧', disponible: true, orden: 11, precio: 3000 },
  { id: 'agua-saborizada', categoria: 'bebidas', nombre: 'Agua Saborizada', descripcion: 'Botella de 250 ml, refrescante.', foto: '/locales/juance/agua-saborizada.webp', emoji: '💧', disponible: true, orden: 12, precio: 2000 },
]
