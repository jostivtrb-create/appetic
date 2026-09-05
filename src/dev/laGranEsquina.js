// 🥖 La Gran Esquina — panadería y sazón (Pereira)
//
// Este local es distinto a todos los demás de Appetic: su menú NO se edita
// aquí. La Gran Esquina tiene su propia app —caja, cocina, inventario y cierre
// de turno— y la cocinera publica desde allá el almuerzo de cada día.
//
// Por eso trae `menuExterno: 'la-gran-esquina'`: Appetic lee ese menú en vivo
// en vez de guardar una copia. Lo que se define aquí es solo la IDENTIDAD —
// nombre, colores, horario, domicilios— que sí es de Appetic.
//
// La paleta sale de su logo: el pan sobre la tabla, el trigo dorado del fondo y
// el verde de la hoja de plátano.

export const SLUG = 'la-gran-esquina'
export const ADMIN_EMAIL = 'andresguz2084@gmail.com'

export const LGE_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'La Gran Esquina',
  descripcion: 'Almuerzo casero del día · pan, café y sazón',

  whatsapp: '573223739540',

  logo: '/locales/la-gran-esquina/logo.webp',
  icono: '/locales/la-gran-esquina/logo.webp',
  banner: '',

  // Terracota del pan, madera de la tabla, trigo del fondo y el verde de la
  // hoja de plátano. Los mismos colores que ya usa su propia app, para que
  // quien la conozca reconozca el local aquí.
  tema: {
    primary: '#9F5929',
    primaryStrong: '#503220',
    primarySoft: '#DCAA71',
    onPrimary: '#FFFFFF',
    accent: '#8E741B',
    hero: 'logo',
    bg: '#FBF5EC',
  },

  // ⚠️ Sin coordenadas no se puede cobrar el domicilio por distancia. Andrés
  // las pone desde su panel con "usar mi ubicación actual", parado en el local.
  ubicacion: null,

  // ⚠️ TEMPORAL — 2026-09-04: abierto 24h para que Zeven pueda enseñarle la app
  // al personal a cualquier hora. Las horas de verdad eran 07:00–15:30 (y aun
  // esas estaban puestas a ojo: que Andrés diga las suyas).
  // Va de la mano con MODO_EXPLICACION en services/menuLaGranEsquina.js.
  horario: {
    abre: '00:00',
    cierra: '23:59',
    dias: { lun: true, mar: true, mie: true, jue: true, vie: true, sab: true, dom: true },
  },

  recoger: true,
  domicilio: {
    activo: true,
    maxKm: 3,
    tarifas: {
      '0.5': 2000,
      '1.0': 2000,
      '1.5': 3000,
      '2.0': 3000,
      '2.5': 4000,
      '3.0': 4000,
    },
  },

  // Appetic nunca cobra: el método de pago es un aviso para que en el local
  // sepan cómo viene la plata. El cobro lo hace la caja de La Gran Esquina,
  // igual que con cualquier otro cliente, y por eso el cierre de turno no se
  // entera de que el pedido entró por aquí.
  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '3223739540' },
  ],

  // En el orden del día: primero el desayuno, después el almuerzo.
  categorias: [
    { id: 'desayunos', nombre: 'Desayunos', emoji: '🍳' },
    { id: 'almuerzos', nombre: 'Almuerzo del día', emoji: '🍛' },
  ],

  etiquetas: ['almuerzos', 'desayunos', 'casero', 'panaderia'],

  admins: [ADMIN_EMAIL, 'sinfiniity@gmail.com'],

  // Aquí es donde el menú deja de ser de Appetic. Ver src/services/menuExterno.js
  menuExterno: 'la-gran-esquina',

  // Apagado hasta probarlo con un menú real publicado. Se enciende desde el
  // panel: con esto en true el local ya sale en el buscador y un cliente puede
  // pedir.
  suscripcion: { activa: false, plan: 'piloto' },

  menuVersion: 1,
}

// El menú lo trae `getMenuLaGranEsquina()` en vivo. Se deja el export vacío
// porque el seed y la vista previa esperan encontrarlo, y un array vacío dice
// la verdad: aquí no hay productos guardados.
export const LGE_PRODUCTOS = []
