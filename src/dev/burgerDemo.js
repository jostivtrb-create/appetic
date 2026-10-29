// 🍔 BURGER DEMO — el local de DEMOSTRACIÓN para clientes potenciales (fuente única de verdad).
//
// Guía: .mega-cuestionario/Guía para la Demo de clientes.md
//
// Este mismo archivo lo usan:
//   • La vista previa (?preview=1 · src/preview.js)
//   • El botón «Reiniciar demo» del superadmin, que deja el local EXACTAMENTE así (src/services/demo.js)
//
// Es un local de verdad en Firestore (slug `demo`, `esDemo: true`), compartido por todos los
// visitantes: entran sin cuenta (sesión anónima) y lo administran como dueños. Por eso:
//   • WhatsApp, link y horario quedan BLOQUEADOS (D16): los pedidos de prueba van al WhatsApp de ventas.
//   • No sale en el buscador (suscripcion.activa: false · D9).
//
// 📷 FOTOS: archivos fijos en public/locales/demo/ (generados con IA, prompts en
//    .prompts-imagenes/burger-demo.md). Mientras no existan, el menú muestra el marcador de «sin foto».
//    Lo que suba un visitante va a Storage y se borra al reiniciar.

import { DEMO_SLUG as SLUG, WHATSAPP_VENTAS } from '../config/demo.js'

const F = id => `/locales/demo/platos/${id}.webp`

export const DEMO_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Burger Demo',
  descripcion: 'Perros, salchipapas y combos · Local de demostración',
  whatsapp: WHATSAPP_VENTAS,
  esDemo: true,

  logo: '/locales/demo/logo.webp',
  icono: '/locales/demo/icono.webp',
  logoAnim: 'lado',                           // wordmark ancho (logo.webp) · icono.webp = versión cuadrada
  banner: '/locales/demo/banner.webp',
  tema: {
    primary: '#D9381E',        // rojo parrilla (botones, precios)
    primaryStrong: '#A82612',
    primarySoft: '#F2683F',
    onPrimary: '#FFFFFF',
    accent: '#F2A900',         // amarillo mostaza
    hero: 'logo',              // el logo ya trae el nombre: protagoniza el encabezado (y se ve su animación)
  },

  ubicacion: { lat: 4.6486, lng: -74.0639 },
  // 24 horas: la demo siempre está «abierta» (bloqueado en el panel).
  horario: { abre: '00:00', cierra: '00:00' },
  recoger: true,
  mesas: 12,
  domicilio: {
    activo: true,
    maxKm: 5,
    tarifas: {
      '0.5': 2000, '1.0': 2000, '1.5': 3000, '2.0': 3500, '2.5': 4000,
      '3.0': 4500, '3.5': 5500, '4.0': 6500, '4.5': 7500, '5.0': 8500,
    },
  },
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '3000000000' },
    { id: 'datafono', nombre: 'Datáfono al recibir', tipo: 'datafono' },
  ],
  categorias: [
    { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔' },
    { id: 'perros', nombre: 'Perros Calientes', emoji: '🌭' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🍟' },
    { id: 'combos', nombre: 'Combos', emoji: '🥤' },
    { id: 'acompanantes', nombre: 'Para acompañar', emoji: '🧅' },
    { id: 'bebidas', nombre: 'Bebidas', emoji: '🧃' },
    { id: 'postres', nombre: 'Postres', emoji: '🍨' },
  ],
  etiquetas: ['hamburguesas', 'comida-rapida'],
  admins: [],
  suscripcion: { activa: false, plan: 'demo' },
  menuVersion: 1,
}

// ─────────────────────────── Grupos reutilizables ───────────────────────────

const PUNTO = {
  id: 'g-punto', nombre: 'Punto de la carne', subtitulo: 'Elige 1', emoji: '🔥',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'medio', nombre: 'Término medio', emoji: '🥩', precioExtra: 0 },
    { id: 'tres-cuartos', nombre: 'Tres cuartos', emoji: '🥩', precioExtra: 0 },
    { id: 'bien-asada', nombre: 'Bien asada', emoji: '🔥', precioExtra: 0 },
  ],
}

const ADICIONES = {
  id: 'g-adiciones', nombre: 'Adiciones', subtitulo: 'Opcional', emoji: '➕',
  tipo: 'multiple', min: 0, max: 5,
  opciones: [
    { id: 'queso', nombre: 'Queso cheddar', emoji: '🧀', precioExtra: 3000 },
    { id: 'tocineta', nombre: 'Tocineta', emoji: '🥓', precioExtra: 4000 },
    { id: 'huevo', nombre: 'Huevo frito', emoji: '🍳', precioExtra: 2500 },
    { id: 'aguacate', nombre: 'Aguacate', emoji: '🥑', precioExtra: 3500 },
    { id: 'jalapenos', nombre: 'Jalapeños', emoji: '🌶️', precioExtra: 2000 },
  ],
}

const SIN = {
  id: 'g-sin', nombre: '¿Sin algo?', subtitulo: 'Opcional', emoji: '🚫',
  tipo: 'multiple', min: 0, max: 4,
  opciones: [
    { id: 'sin-cebolla', nombre: 'Sin cebolla', emoji: '🧅', precioExtra: 0 },
    { id: 'sin-tomate', nombre: 'Sin tomate', emoji: '🍅', precioExtra: 0 },
    { id: 'sin-lechuga', nombre: 'Sin lechuga', emoji: '🥬', precioExtra: 0 },
    { id: 'sin-salsas', nombre: 'Sin salsas', emoji: '🥫', precioExtra: 0 },
  ],
}

const SALSAS = {
  id: 'g-salsas', nombre: 'Salsas', subtitulo: 'Hasta 3', emoji: '🥫',
  tipo: 'multiple', min: 0, max: 3,
  opciones: [
    { id: 'rosada', nombre: 'Rosada', emoji: '🩷', precioExtra: 0 },
    { id: 'bbq', nombre: 'BBQ', emoji: '🍖', precioExtra: 0 },
    { id: 'ajo', nombre: 'Ajo', emoji: '🧄', precioExtra: 0 },
    { id: 'pina', nombre: 'Piña', emoji: '🍍', precioExtra: 0 },
    { id: 'picante', nombre: 'Picante', emoji: '🌶️', precioExtra: 0 },
  ],
}

const BEBIDA_COMBO = {
  id: 'g-bebida', nombre: 'Elige tu bebida', subtitulo: 'Elige 1', emoji: '🥤',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'gaseosa', nombre: 'Gaseosa 400 ml', emoji: '🥤', precioExtra: 0 },
    { id: 'limonada', nombre: 'Limonada natural', emoji: '🍋', precioExtra: 1500 },
    { id: 'te', nombre: 'Té helado', emoji: '🧋', precioExtra: 0 },
  ],
}

const CON_PAPAS = {
  id: 'g-presentacion', nombre: 'Presentación', subtitulo: 'Elige 1', emoji: '🍟',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'sola', nombre: 'Sola', emoji: '🍽️', precioExtra: 0 },
    { id: 'con-papas', nombre: 'Con papas a la francesa', emoji: '🍟', precioExtra: 4000 },
  ],
}

// ─────────────────────────── Productos ───────────────────────────

let orden = 0
const p = (id, categoria, nombre, descripcion, extra) => ({
  id, categoria, nombre, descripcion, foto: F(id), disponible: true, orden: ++orden, ...extra,
})

export const DEMO_PRODUCTOS = [
  // 🍔 Hamburguesas
  p('clasica', 'hamburguesas', 'La Clásica',
    'Carne de res 150 g a la parrilla, queso cheddar, lechuga, tomate, cebolla y salsa de la casa en pan brioche.',
    { precio: 18000, destacado: true, gruposOpciones: [CON_PAPAS, PUNTO, ADICIONES, SIN] }),
  p('doble-queso', 'hamburguesas', 'Doble Queso',
    'Dos carnes de res 150 g, doble cheddar fundido, cebolla caramelizada y pepinillos.',
    { precio: 26000, destacado: true, gruposOpciones: [CON_PAPAS, PUNTO, ADICIONES, SIN] }),
  p('bbq-tocineta', 'hamburguesas', 'BBQ Tocineta',
    'Carne de res 150 g, tocineta crocante, aros de cebolla, queso cheddar y salsa BBQ ahumada.',
    { precio: 24000, gruposOpciones: [CON_PAPAS, PUNTO, ADICIONES, SIN] }),
  p('pollo-crispy', 'hamburguesas', 'Pollo Crispy',
    'Pechuga apanada crocante, lechuga, tomate y salsa de miel mostaza.',
    { precio: 21000, gruposOpciones: [CON_PAPAS, ADICIONES, SIN] }),
  p('mexicana', 'hamburguesas', 'La Mexicana',
    'Carne de res 150 g, guacamole, jalapeños, nachos triturados y queso fundido.',
    { precio: 25000, gruposOpciones: [CON_PAPAS, PUNTO, ADICIONES, SIN] }),
  p('veggie', 'hamburguesas', 'Veggie de Garbanzo',
    'Medallón de garbanzo y verduras, aguacate, lechuga, tomate y salsa de yogur.',
    { precio: 20000, gruposOpciones: [CON_PAPAS, ADICIONES, SIN] }),

  // 🌭 Perros
  p('perro-sencillo', 'perros', 'Perro Sencillo',
    'Salchicha americana, papa ripio, queso rallado y salsas.',
    { precio: 12000, gruposOpciones: [SALSAS, SIN] }),
  p('perro-especial', 'perros', 'Perro Especial',
    'Salchicha americana, tocineta, queso gratinado, huevo de codorniz y papa ripio.',
    { precio: 16000, gruposOpciones: [SALSAS, SIN] }),
  p('choriperro', 'perros', 'Choriperro',
    'Chorizo a la parrilla en pan de perro, chimichurri, cebolla y queso.',
    { precio: 15000, gruposOpciones: [SALSAS, SIN] }),

  // 🍟 Salchipapas
  p('salchipapa', 'salchipapas', 'Salchipapa Clásica',
    'Papa a la francesa con salchicha y queso costeño rallado.',
    { variantes: [{ id: 'personal', nombre: 'Personal', precio: 13000 }, { id: 'para-dos', nombre: 'Para dos', precio: 22000 }], gruposOpciones: [SALSAS] }),
  p('salchipapa-mixta', 'salchipapas', 'Salchipapa Mixta',
    'Papa a la francesa, salchicha, pollo desmechado, carne y queso gratinado.',
    { variantes: [{ id: 'personal', nombre: 'Personal', precio: 18000 }, { id: 'para-dos', nombre: 'Para dos', precio: 30000 }], gruposOpciones: [SALSAS] }),
  p('salchipapa-tocineta', 'salchipapas', 'Salchipapa de Tocineta',
    'Papa a la francesa, salchicha, tocineta crocante, maíz tierno y queso gratinado.',
    { precio: 19000, gruposOpciones: [SALSAS] }),

  // 🥤 Combos
  p('combo-clasico', 'combos', 'Combo Clásico',
    'La Clásica + papas a la francesa + bebida.',
    { precio: 25000, destacado: true, gruposOpciones: [PUNTO, BEBIDA_COMBO] }),
  p('combo-pareja', 'combos', 'Combo Pareja',
    'Dos Clásicas + papas grandes para compartir + dos bebidas.',
    { precio: 46000, gruposOpciones: [BEBIDA_COMBO] }),
  p('combo-familiar', 'combos', 'Combo Familiar',
    'Cuatro Clásicas + salchipapa para dos + gaseosa de 1.5 L.',
    { precio: 89000 }),

  // 🧅 Para acompañar
  p('papas', 'acompanantes', 'Papas a la francesa', 'Crocantes, con sal marina.',
    { variantes: [{ id: 'pequena', nombre: 'Pequeñas', precio: 5000 }, { id: 'grande', nombre: 'Grandes', precio: 8000 }] }),
  p('aros', 'acompanantes', 'Aros de cebolla', 'Ocho aros apanados con salsa de la casa.', { precio: 8000 }),
  p('nuggets', 'acompanantes', 'Nuggets de pollo', 'Seis nuggets con salsa de miel mostaza.', { precio: 10000 }),
  p('papas-cheddar', 'acompanantes', 'Papas con cheddar y tocineta', 'Papas a la francesa bañadas en cheddar y tocineta.', { precio: 13000 }),

  // 🧃 Bebidas
  p('gaseosa', 'bebidas', 'Gaseosa', 'Bien fría.',
    { variantes: [{ id: '400', nombre: '400 ml', precio: 4000 }, { id: '15', nombre: '1.5 L', precio: 8000 }] }),
  p('limonada', 'bebidas', 'Limonada', 'Hecha al momento.',
    { variantes: [{ id: 'natural', nombre: 'Natural', precio: 6000 }, { id: 'coco', nombre: 'De coco', precio: 9000 }, { id: 'hierbabuena', nombre: 'De hierbabuena', precio: 7000 }] }),
  p('malteada', 'bebidas', 'Malteada', 'Helado de vainilla, leche y crema batida.',
    { variantes: [{ id: 'vainilla', nombre: 'Vainilla', precio: 12000 }, { id: 'chocolate', nombre: 'Chocolate', precio: 12000 }, { id: 'fresa', nombre: 'Fresa', precio: 12000 }] }),
  p('cerveza', 'bebidas', 'Cerveza nacional', 'Bien fría, 330 ml.', { precio: 6000 }),

  // 🍨 Postres
  p('brownie', 'postres', 'Brownie con helado', 'Brownie tibio de chocolate con helado de vainilla.', { precio: 11000 }),
  p('cheesecake', 'postres', 'Cheesecake de frutos rojos', 'Porción con salsa de frutos rojos.', { precio: 12000, disponible: false }),
]
