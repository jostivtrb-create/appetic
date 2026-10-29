// 🍕🔥 BON APPÉTIT — Pizza y parrilla · datos del local (fuente única de verdad).
//
// Este mismo archivo lo usan:
//   • La vista previa en producción/DEV  (?preview=1 · src/preview.js)
//   • El alta real en producción          (scripts/seed-bon-appetit.mjs)
//
// Es JS plano (sin React ni imports de imágenes): funciona igual en navegador y en Node.
//
// ✍️ NOMBRE: el local se llama "Bon Appétit". Su carta impresa dice "boon appetit" (mal escrito)
//    y además trae el wordmark viejo "La Mies"; el dueño confirmó que el nombre es Bon Appétit.
//
// 🎨 Estética sacada de SU logo y SU carta: "Bon" NARANJA, "Appétit" VERDE BOSQUE, pizza ROJO
//    TOMATE; en la carta el precio "SOLA" va en rojo. Piel propia `skin: 'bon'`
//    (src/pages/Local/LocalSkinBon.css): cabecera muro verde bosque con el logo en su letrero,
//    fondo salvia claro (no crema), precios en rojo tomate, títulos condensados verdes y el
//    naranja para la acción (botones, barra inferior). Verde-blanco-rojo de pizzería.
//
// 🖼️ LOGO PROVISIONAL (29-oct-2026): el dueño aún no tiene logo. Se generó en Gemini a partir del
//    wordmark de su carta ("La Mies" naranja+verde con la pizza roja) pero con el nombre correcto,
//    se recortó a transparente y se le abrió el espacio entre "Bon" y "Appétit". El ícono del
//    buscador es la pizza del mismo logo. Prompt en public/locales/bon-appetit/PROMPTS.md.
//
// 📷 IMÁGENES: NO se generan aquí. Todos los `foto: ''` van vacíos; los prompts están en
//    public/locales/bon-appetit/PROMPTS.md y el dueño sube cada foto desde su panel.
//
// 🧩 MODELO DEL MENÚ (fiel a su carta impresa):
//    • Hamburguesas y perros: cada uno trae "SOLA / CON PAPAS" → grupo "Presentación" (elige 1)
//      que suma la diferencia exacta de su carta. Base = precio "sola".
//    • Ranchera: "proteína de su elección (res, pollo, cerdo; apanado +$3.000)" → elige 1.
//      Doble y Tres Carnes: un grupo por proteína (se puede repetir, p. ej. res + res).
//    • Perros: "(cebolla opcional)" → elige con o sin cebolla, para que la cocina lo sepa.
//    • Adiciones: la carta repite tres listas distintas (hamburguesas/perros: 7; salchipapas,
//      mazorcada y burrito: 9; patacones: 4). Cada sección lleva SU lista.
//    • Pizzas: "rueda de 4 porciones, máximo 2 sabores mitad y mitad" → cada pizza trae un grupo
//      opcional "¿Mitad y mitad?" con el segundo sabor; si es más caro, suma la diferencia
//      (se cobra la mitad más cara — confirmar con el dueño).
//    • Platos fuertes: "papa a la francesa o papa criolla" y "ensalada o guacamole" → elige 1 y 1.
//    • Jugos: sabor (6 frutas) + en agua $5.000 / en leche $6.500 (variantes). Limonadas: variantes.

export const SLUG = 'bon-appetit'

// Correo del DUEÑO que administra el local (entra a /bon-appetit/admin con ese Google).
// ⚠️ POR DEFECTO: 'sinfiniity@gmail.com' (NUESTRA cuenta, no la del cliente) hasta que dé su Gmail.
//    Se cambia sin tocar código desde /superadmin (campo 👤) o re-corriendo el seed.
export const ADMIN_EMAIL = 'sinfiniity@gmail.com'

export const BONAPPETIT_LOCAL = {
  id: SLUG,
  slug: SLUG,
  nombre: 'Bon Appétit',
  descripcion: 'Pizzas, hamburguesas y parrilla · Sierra Morena 🍕🔥',
  // 📱 El número de SU carta (320 475 3619): los pedidos llegan directo al local. Es también el
  //    número del afiche de domicilios de la pestaña 📣 Difundir. Dirección de la carta:
  //    Calle 70 # 50-15 Sur, Sierra Morena (la ubicación en el mapa la fija el dueño en su panel).
  whatsapp: '573204753619',

  logo: '/locales/bon-appetit/logo.webp',     // wordmark horizontal en su placa crema (900px = 2× el hero)
  icono: '/locales/bon-appetit/icono.webp',   // logo APILADO cuadrado (pizza + nombre) sobre crema, 512px:
                                              //   inicio, Cuenta, barra lateral/inferior. Armado en local con las
                                              //   mismas piezas del logo ancho (misma letra y misma pizza).
  logoAnim: 'lado',                           // wordmark horizontal: entra de lado
  banner: '',    // el dueño sube el banner desde su panel (prompt en PROMPTS.md)
  tema: {
    primary: '#EC7A0E',        // naranja de los títulos de su carta (botones, precios, chips activos)
    primaryStrong: '#B95A05',  // naranja tostado (variante oscura / degradado)
    primarySoft: '#F7A94B',    // naranja durazno (degradados de botones)
    onPrimary: '#FFFFFF',      // texto sobre el naranja
    accent: '#2F6B4A',         // verde bosque del wordmark (nav activo, detalles)
    bg: '#EEF3EC',             // "mundo" verde salvia claro (verde-blanco-rojo de pizzería, NO crema)
    hero: 'logo',              // hero protagonizado por el logo (ya trae el nombre)
    skin: 'bon',               // piel propia: src/pages/Local/LocalSkinBon.css (muro verde, precios rojos)
    navSolid: true,            // barra inferior naranja sólida (la acción de la marca)
  },

  // 24 horas (abre === cierra): útil para probar a cualquier hora. El dueño ajusta el real.
  horario: { abre: '00:00', cierra: '00:00' },

  recoger: true,
  // 🪑 QR por mesa: cuántas mesas tiene (0 = apagado). El dueño lo cambia en Difundir.
  mesas: 10,
  domicilio: { activo: false, maxKm: 3, tarifas: {} },

  pagos: [
    { id: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo' },
    { id: 'nequi', nombre: 'Nequi / Daviplata', tipo: 'transferencia', llave: '' },
  ],

  categorias: [
    { id: 'pizzas', nombre: 'Pizzas', emoji: '🍕' },
    { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔' },
    { id: 'perros', nombre: 'Perros Calientes', emoji: '🌭' },
    { id: 'salchipapas', nombre: 'Salchipapas', emoji: '🍟' },
    { id: 'patacones', nombre: 'Patacones', emoji: '🍌' },
    { id: 'especiales', nombre: 'Mazorcada y Burrito', emoji: '🌯' },
    { id: 'platos', nombre: 'Platos Fuertes', emoji: '🍽️' },
    { id: 'parrilla', nombre: 'Tablas y Parrilla', emoji: '🥩' },
    { id: 'jugos', nombre: 'Jugos y Limonadas', emoji: '🧃' },
  ],

  // 🗂️ Etiquetas del INICIO (chips de categorías, catálogo en src/config/categoriasLocales.js).
  etiquetas: ['pizza', 'asados', 'hamburguesas'],

  admins: [ADMIN_EMAIL],
  // activa:false → NO sale todavía en el buscador del inicio. Se enciende cuando el dueño revise
  // su menú y suba logo/fotos (el WhatsApp ya es el suyo).
  suscripcion: { activa: false, plan: 'piloto' },
  menuVersion: 1,
}

// ─────────────────────────── Grupos reutilizables ───────────────────────────

// "SOLA $X · CON PAPAS $Y" → elige 1; "con papas" suma la diferencia exacta de su carta.
const presentacion = (extraPapas, base = 'Sola') => ({
  id: 'g-presentacion', nombre: 'Presentación', subtitulo: 'Elige 1', emoji: '🍟',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'sola', nombre: base, emoji: '🍽️', precioExtra: 0, foto: '' },
    { id: 'con-papas', nombre: 'Con papas a la francesa', emoji: '🍟', precioExtra: extraPapas, foto: '' },
  ],
})

// Proteína a elección (Ranchera, Doble, Tres Carnes): el pollo apanado suma $3.000.
const proteina = (id, nombre) => ({
  id, nombre, subtitulo: 'Elige 1', emoji: '🥩',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'res', nombre: 'Res', emoji: '🐄', precioExtra: 0, foto: '' },
    { id: 'pollo', nombre: 'Pollo', emoji: '🐔', precioExtra: 0, foto: '' },
    { id: 'cerdo', nombre: 'Cerdo', emoji: '🐖', precioExtra: 0, foto: '' },
    { id: 'apanado', nombre: 'Pollo apanado', emoji: '🍗', precioExtra: 3000, foto: '' },
  ],
})

// Perros: "(cebolla opcional)" en cada uno de su carta.
const CEBOLLA = {
  id: 'g-cebolla', nombre: '¿Con cebolla?', subtitulo: 'Elige 1', emoji: '🧅',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'con-cebolla', nombre: 'Con cebolla', emoji: '🧅', precioExtra: 0, foto: '' },
    { id: 'sin-cebolla', nombre: 'Sin cebolla', emoji: '🚫', precioExtra: 0, foto: '' },
  ],
}

// Las tres listas de "ADICCIONES" de su carta (cada sección trae la suya).
const ADIC = {
  chicharron: { id: 'ad-chicharron', nombre: 'Chicharrón 50 g', emoji: '🥓', precioExtra: 3000, foto: '' },
  desmechada: { id: 'ad-desmechada', nombre: 'Carne desmechada', emoji: '🥩', precioExtra: 6500, foto: '' },
  tocineta: { id: 'ad-tocineta', nombre: 'Tocineta ahumada', emoji: '🥓', precioExtra: 3000, foto: '' },
  chorizo: { id: 'ad-chorizo', nombre: 'Chorizo', emoji: '🌭', precioExtra: 5000, foto: '' },
  huevo: { id: 'ad-huevo', nombre: 'Huevo frito (2 und)', emoji: '🍳', precioExtra: 3000, foto: '' },
  platano: { id: 'ad-platano', nombre: 'Tajadas de plátano', emoji: '🍌', precioExtra: 3000, foto: '' },
  queso: { id: 'ad-queso', nombre: 'Queso asado', emoji: '🧀', precioExtra: 4000, foto: '' },
  bondiola: { id: 'ad-bondiola', nombre: 'Bondiola de cerdo', emoji: '🐖', precioExtra: 6000, foto: '' },
  pollo: { id: 'ad-pollo', nombre: 'Pollo salteado', emoji: '🍗', precioExtra: 6000, foto: '' },
}
const adiciones = (...items) => ({
  id: 'g-adiciones', nombre: 'Adiciones', subtitulo: 'Opcional', emoji: '➕',
  tipo: 'multiple', min: 0, opciones: items,
})
const ADIC_BASICAS = adiciones(ADIC.chicharron, ADIC.desmechada, ADIC.tocineta, ADIC.chorizo,
  ADIC.huevo, ADIC.platano, ADIC.queso)
const ADIC_COMPLETAS = adiciones(ADIC.chicharron, ADIC.desmechada, ADIC.tocineta, ADIC.chorizo,
  ADIC.huevo, ADIC.platano, ADIC.queso, ADIC.bondiola, ADIC.pollo)
const ADIC_PATACON = adiciones(ADIC.chicharron, ADIC.desmechada, ADIC.chorizo, ADIC.huevo)

// Platos fuertes: "+ Papa a la francesa o Papa Criolla + Patacón + Arroz + Ensalada o guacamole".
const PAPA = {
  id: 'g-papa', nombre: 'Papa', subtitulo: 'Elige 1', emoji: '🥔',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'francesa', nombre: 'Papa a la francesa', emoji: '🍟', precioExtra: 0, foto: '' },
    { id: 'criolla', nombre: 'Papa criolla', emoji: '🥔', precioExtra: 0, foto: '' },
  ],
}
const ENSALADA = {
  id: 'g-ensalada', nombre: 'Ensalada o guacamole', subtitulo: 'Elige 1', emoji: '🥗',
  tipo: 'unica', min: 1, max: 1,
  opciones: [
    { id: 'ensalada', nombre: 'Ensalada', emoji: '🥗', precioExtra: 0, foto: '' },
    { id: 'guacamole', nombre: 'Guacamole', emoji: '🥑', precioExtra: 0, foto: '' },
  ],
}

// ─────────────────────────── Pizzas (mitad y mitad) ───────────────────────────
// "Rueda de 4 porciones · máximo 2 sabores mitad y mitad". Cada pizza ofrece el segundo sabor;
// si la otra mitad es más cara, suma la diferencia (se cobra la mitad más cara).
const PIZZAS = [
  { id: 'pizza-hawaiana', nombre: 'Pizza Hawaiana', precio: 20000,
    descripcion: 'Piña, queso mozzarella y tocineta.' },
  { id: 'pizza-pollo-champinones', nombre: 'Pizza Pollo y Champiñones', precio: 20000,
    descripcion: 'Pollo, champiñones, salsa pomodoro y queso mozzarella.' },
  { id: 'pizza-ranchera', nombre: 'Pizza Ranchera', precio: 20000,
    descripcion: 'Pollo, bondiola de cerdo, salsa pomodoro, queso mozzarella y salsa BBQ.' },
  { id: 'pizza-criolla', nombre: 'Pizza Criolla', precio: 20000,
    descripcion: 'Pollo, tomate, maíz dulce, cebolla, cilantro, salsa pomodoro, mozzarella y BBQ.' },
  { id: 'pizza-bolognesa', nombre: 'Pizza Bolognesa', precio: 20000,
    descripcion: 'Bolognesa de carne de res, salsa pomodoro, mozzarella, albahaca y orégano.' },
  { id: 'pizza-mexicana', nombre: 'Pizza Mexicana', precio: 22000,
    descripcion: 'Carne molida en salsa, pico de gallo, cilantro, pomodoro, mozzarella y tostacos.' },
  { id: 'pizza-tocineta-maiz', nombre: 'Pizza de Tocineta y Maíz', precio: 20000,
    descripcion: 'Tocineta, maíz dulce, salsa pomodoro y queso mozzarella.' },
  { id: 'pizza-pepperoni', nombre: 'Pizza de Pepperoni', precio: 20000,
    descripcion: 'Pepperoni, salsa pomodoro y queso mozzarella.' },
  { id: 'pizza-chorizo-queso', nombre: 'Pizza de Chorizo y Queso', precio: 20000,
    descripcion: 'Chorizo, queso cheddar, salsa pomodoro y queso mozzarella.' },
  { id: 'pizza-ropa-vieja', nombre: 'Pizza Ropa Vieja', precio: 24000, destacado: true,
    descripcion: 'Carne desmechada, maíz dulce, pollo, pomodoro, mozzarella y un salteado de cebolla, tomate, pimentón y cilantro.' },
  { id: 'pizza-margarita', nombre: 'Pizza Margarita', precio: 17000,
    descripcion: 'Salsa pomodoro, queso mozzarella, tomate cherry, albahaca y orégano.' },
  { id: 'pizza-queso-bocadillo', nombre: 'Pizza Queso y Bocadillo', precio: 15000,
    descripcion: 'Queso mozzarella y bocadillo: el clásico dulce y salado.' },
  { id: 'pizza-chocolate', nombre: 'Pizza de Chocolate', precio: 17000,
    descripcion: 'Queso mozzarella, chocolate al 47 %, banano y hierbabuena. Para el postre.' },
]
const pizzaProductos = PIZZAS.map((p, i) => ({
  id: p.id, categoria: 'pizzas', nombre: p.nombre,
  descripcion: `${p.descripcion} Rueda de 4 porciones.`,
  foto: '', emoji: '🍕', destacado: !!p.destacado, disponible: true, orden: i + 1, precio: p.precio,
  gruposOpciones: [{
    id: 'g-mitad', nombre: '¿Mitad y mitad?', subtitulo: 'Opcional · elige el otro sabor', emoji: '🍕',
    tipo: 'unica', min: 0, max: 1,
    opciones: PIZZAS.filter(o => o.id !== p.id).map(o => ({
      id: o.id.replace('pizza-', 'mitad-'),
      nombre: `Mitad ${o.nombre.replace('Pizza ', '').replace(/^de /, '')}`,
      emoji: '🍕', precioExtra: Math.max(0, o.precio - p.precio), foto: '',
    })),
  }],
}))

// ─────────────────────────── Productos ───────────────────────────

const burger = (id, nombre, descripcion, sola, conPapas, orden, extra = {}) => ({
  id, categoria: 'hamburguesas', nombre, descripcion, foto: '', emoji: '🍔',
  disponible: true, orden, precio: sola, ...extra,
  gruposOpciones: [...(extra.gruposOpciones || []), presentacion(conPapas - sola), ADIC_BASICAS],
})
const perro = (id, nombre, descripcion, solo, conPapas, orden, extra = {}) => ({
  id, categoria: 'perros', nombre, descripcion, foto: '', emoji: '🌭',
  disponible: true, orden, precio: solo, ...extra,
  gruposOpciones: [presentacion(conPapas - solo, 'Solo'), CEBOLLA, ADIC_BASICAS],
})
const plato = (id, nombre, descripcion, precio, orden, extra = {}) => ({
  id, categoria: 'platos', nombre,
  descripcion: `${descripcion} Con patacón, arroz, papa y ensalada o guacamole.`,
  foto: '', emoji: '🍽️', disponible: true, orden, precio, ...extra,
  gruposOpciones: [PAPA, ENSALADA],
})

const VEG = 'queso, tomate, cebolla, lechuga y 4 sobres de salsa'

export const BONAPPETIT_PRODUCTOS = [
  // ══════════════════ 🍕 PIZZAS ══════════════════
  ...pizzaProductos,

  // ══════════════════ 🍔 HAMBURGUESAS ══════════════════
  burger('ham-res', 'Hamburguesa de Res', `Carne de res de 160 g, ${VEG}.`, 13000, 17500, 1),
  burger('ham-pollo', 'Hamburguesa de Pollo', `Filete de pechuga de 160 g, ${VEG}.`, 13000, 17500, 2),
  burger('ham-cerdo', 'Hamburguesa de Cerdo', `Bondiola de cerdo de 160 g, ${VEG}.`, 13000, 17500, 3),
  burger('ham-pollo-apanado', 'Hamburguesa de Pollo Apanado', `Filete de pechuga apanada, ${VEG}.`, 16000, 20500, 4),
  burger('ham-especial', 'Hamburguesa Especial', `Carne de res de 160 g, huevo en tortilla, ${VEG}.`, 16500, 20500, 5),
  burger('ham-ranchera', 'Hamburguesa Ranchera', 'La proteína que tú elijas, chorizo, queso, vegetales y 4 sobres de salsa.',
    19000, 23500, 6, { destacado: true, gruposOpciones: [proteina('g-proteina', 'Proteína')] }),
  burger('ham-tocino', 'Hamburguesa de Tocino', `Carne de cerdo de 160 g con chicharrón, ${VEG}.`, 20000, 24500, 7),
  burger('ham-criolla', 'Hamburguesa Criolla', `Filete de pechuga de 160 g y carne desmechada en salsa criolla, ${VEG}.`, 20000, 24500, 8),
  burger('ham-mexicana', 'Hamburguesa Mexicana', `Carne de res de 160 g, guacamole, tostacos, ${VEG}.`, 17000, 21500, 9),
  burger('ham-pollo-champinones', 'Hamburguesa Pollo y Champiñones', 'Filete de pechuga en salsa de champiñones, queso, vegetales y 4 sobres de salsa.', 21000, 25500, 10),
  burger('ham-super-queso', 'Hamburguesa Super Queso', `Carne de res de 160 g, 100 g de queso asado, pepinillos, ${VEG}.`, 18000, 22500, 11),
  burger('ham-bistec-caballo', 'Hamburguesa de Bistec a Caballo', `Carne de res, huevo frito, hogao criollo, ${VEG}.`, 19000, 23500, 12),
  burger('ham-hawaiana', 'Hamburguesa Hawaiana', 'Filete de pechuga de 160 g, queso, vegetales encurtidos, piña, tocineta y 4 sobres de salsa.', 19500, 23000, 13),
  burger('ham-doble', 'Hamburguesa Doble', `Dos proteínas a tu elección, ${VEG}.`, 22000, 26000, 14,
    { gruposOpciones: [proteina('g-proteina-1', 'Primera proteína'), proteina('g-proteina-2', 'Segunda proteína')] }),
  burger('ham-tres-carnes', 'Hamburguesa Tres Carnes', `Tres proteínas a tu elección, ${VEG}.`, 31000, 35000, 15,
    { destacado: true, gruposOpciones: [proteina('g-proteina-1', 'Primera proteína'),
      proteina('g-proteina-2', 'Segunda proteína'), proteina('g-proteina-3', 'Tercera proteína')] }),

  // ══════════════════ 🌭 PERROS ══════════════════
  perro('perro-sencillo', 'Perro Sencillo', 'Salchicha americana, salsa de la casa, salsa de piña, papas chips y 3 sobres de salsa.', 8500, 13000, 1),
  perro('perro-americano', 'Perro Americano', 'Salchicha americana, queso, tocineta, salsa de la casa, salsa de piña, papas chips y 3 sobres de salsa.', 13000, 18000, 2),
  perro('perro-quesudo', 'Perro Quesudo', 'Salchicha americana, queso asado, tocineta, salsa de la casa, salsa de piña, papas chips y 4 sobres de salsa.', 15500, 19500, 3),
  perro('perro-doble', 'Perro Doble', 'Dos salchichas americanas, queso, tocineta, salsa de la casa, salsa de piña, papas chips y 3 sobres de salsa.', 17500, 22000, 4),
  perro('perro-mexicano', 'Perro Mexicano', 'Salchicha americana, queso, tocineta, guacamole, pico de gallo, tostacos, salsa de la casa, de piña y papas chips.', 17500, 22000, 5),
  perro('perro-mixto', 'Perro Mixto', 'Salchicha americana, chorizo, queso asado, tocineta, salsa de la casa, de piña y papas chips.', 18000, 22000, 6),
  perro('perro-ranchero', 'Perro Ranchero', 'Chorizo, chicharrón, salsa BBQ, queso, tocineta, salsa de la casa, de piña y papas chips.', 19000, 23000, 7, { destacado: true }),

  // ══════════════════ 🍟 SALCHIPAPAS ══════════════════
  { id: 'salchi-clasica', categoria: 'salchipapas', nombre: 'Salchipapa Clásica',
    descripcion: 'Papa a la francesa, salchicha americana y 3 sobres de salsa.',
    foto: '', emoji: '🍟', disponible: true, orden: 1, precio: 9000, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'salchi-mixta', categoria: 'salchipapas', nombre: 'Salchipapa Mixta',
    descripcion: 'Papa a la francesa, papa criolla, salchicha americana y 3 sobres de salsa.',
    foto: '', emoji: '🍟', disponible: true, orden: 2, precio: 13000, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'salchi-gratinada', categoria: 'salchipapas', nombre: 'Salchipapa Gratinada',
    descripcion: 'Papa a la francesa, salchicha americana, queso gratinado y 3 sobres de salsa.',
    foto: '', emoji: '🧀', disponible: true, orden: 3, precio: 13500, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'salchi-tocino', categoria: 'salchipapas', nombre: 'Salchipapa de Tocino',
    descripcion: 'Papa a la francesa, salchicha americana, chicharrón, tajadas de plátano y 3 sobres de salsa.',
    foto: '', emoji: '🥓', disponible: true, orden: 4, precio: 18000, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'salchi-ranchera', categoria: 'salchipapas', nombre: 'Salchipapa Ranchera',
    descripcion: 'Papa a la francesa, chorizo, chicharrón, queso y 3 sobres de salsa.',
    foto: '', emoji: '🍟', disponible: true, orden: 5, precio: 18000, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'piernapapas', categoria: 'salchipapas', nombre: 'Piernapapas',
    descripcion: 'Pierna pernil al horno, papa a la francesa, salchicha y 3 sobres de salsa.',
    foto: '', emoji: '🍗', disponible: true, orden: 6, precio: 18500, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'salchi-especial', categoria: 'salchipapas', nombre: 'Salchipapa Especial',
    descripcion: 'Papa a la francesa, salchicha americana, bondiola de cerdo, queso, vegetales encurtidos y 3 sobres de salsa.',
    foto: '', emoji: '🍟', disponible: true, orden: 7, precio: 24000, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'salchi-lasagna', categoria: 'salchipapas', nombre: 'Salchi Lasagna',
    descripcion: 'Papa a la francesa, salchicha americana, bolognesa, queso gratinado, vegetales encurtidos y 3 sobres de salsa.',
    foto: '', emoji: '🧀', disponible: true, orden: 8, precio: 28000, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'salchi-carnuda', categoria: 'salchipapas', nombre: 'Salchipapa Carnuda',
    descripcion: 'Papa a la francesa, papa criolla, salchicha americana, churrasco de 250 g, pollo salteado, queso asado y 3 sobres de salsa.',
    foto: '', emoji: '🥩', destacado: true, disponible: true, orden: 9, precio: 41000, gruposOpciones: [ADIC_COMPLETAS] },

  // ══════════════════ 🍌 PATACONES ══════════════════
  { id: 'patacon-carne-pollo', categoria: 'patacones', nombre: 'Patacón Carne y Pollo',
    descripcion: 'Plátano maduro con carne desmechada, pollo, queso y salsa BBQ.',
    foto: '', emoji: '🍌', disponible: true, orden: 1, precio: 23000, gruposOpciones: [ADIC_PATACON] },
  { id: 'patacon-ranchero', categoria: 'patacones', nombre: 'Patacón Ranchero',
    descripcion: 'Plátano maduro con carne desmechada, pollo, queso, chicharrón, chorizo y salsa BBQ.',
    foto: '', emoji: '🍌', disponible: true, orden: 2, precio: 28500, gruposOpciones: [ADIC_PATACON] },
  { id: 'patacon-gourmet', categoria: 'patacones', nombre: 'Patacón Gourmet',
    descripcion: 'Plátano maduro con churrasco de 250 g, carne desmechada, pollo, salsa de champiñones y queso.',
    foto: '', emoji: '🍌', destacado: true, disponible: true, orden: 3, precio: 47000, gruposOpciones: [ADIC_PATACON] },

  // ══════════════════ 🌯 MAZORCADA Y BURRITO ══════════════════
  { id: 'burrito', categoria: 'especiales', nombre: 'Burrito',
    descripcion: 'Tortilla de trigo con pollo, carne desmechada, chorizo, chicharrón, maíz dulce, pico de gallo, aguacate y salsa de maíz.',
    foto: '', emoji: '🌯', disponible: true, orden: 1, precio: 27500, gruposOpciones: [ADIC_COMPLETAS] },
  { id: 'mazorcada', categoria: 'especiales', nombre: 'Mazorcada',
    descripcion: 'Maíz dulce, pollo, carne desmechada, chorizo, chicharrón, tocineta, queso, papa a la francesa y salsa BBQ.',
    foto: '', emoji: '🌽', destacado: true, disponible: true, orden: 2, precio: 34500, gruposOpciones: [ADIC_COMPLETAS] },

  // ══════════════════ 🍽️ PLATOS FUERTES ══════════════════
  plato('milanesa-pollo', 'Milanesa de Pollo', 'Filete de pechuga apanada de 180 g.', 21000, 1),
  plato('pernil-plato', 'Pierna Pernil al Horno', 'Pierna pernil al horno.', 21000, 2),
  plato('chuleta-valluna', 'Chuleta Valluna', 'Filete de bondiola de cerdo apanada de 180 g.', 21000, 3),
  plato('pechuga-plancha', 'Pechuga a la Plancha', 'Filete de pechuga a la plancha de 360 g.', 24500, 4),
  plato('lomo-cerdo', 'Lomo de Cerdo', 'Filete de bondiola de cerdo a la plancha de 360 g.', 25000, 5),
  plato('pechuga-gratinada', 'Pechuga Gratinada', 'Filete de pechuga a la plancha de 360 g gratinado con queso.', 26500, 6),
  plato('pechuga-criolla', 'Pechuga en Salsa Criolla', 'Filete de pechuga a la plancha de 360 g en salsa criolla.', 27000, 7),
  plato('pechuga-champinones', 'Pechuga con Champiñones', 'Filete de pechuga a la plancha de 360 g en salsa de champiñones.', 29500, 8),
  plato('pechuga-hawaiana', 'Pechuga Hawaiana', 'Filete de pechuga a la plancha de 360 g con piña, tocineta y queso.', 30000, 9),
  plato('pechuga-ranchera', 'Pechuga Ranchera', 'Filete de pechuga a la plancha de 360 g con maíz dulce, tocineta y cebolla en salsa BBQ.', 30000, 10),
  plato('lomo-ranchero', 'Lomo Ranchero', 'Filete de bondiola de cerdo de 360 g con maíz dulce, tocineta y cebolla en salsa BBQ.', 30000, 11),
  plato('churrasco', 'Churrasco', 'Churrasco madurado de 250 g.', 30000, 12, { destacado: true, emoji: '🥩' }),

  // ══════════════════ 🥩 TABLAS Y PARRILLA ══════════════════
  { id: 'mega-tabla', categoria: 'parrilla', nombre: 'Mega Tabla',
    descripcion: 'Churrasco de 250 g, bondiola de cerdo de 180 g, pechuga de 180 g, chicharrón de 100 g, chorizo, alas BBQ, papa a la francesa, papa criolla, plátano y guacamole.',
    foto: '', emoji: '🥩', destacado: true, disponible: true, orden: 1, precio: 79000 },
  { id: 'tabla-mixta', categoria: 'parrilla', nombre: 'Tabla Mixta',
    descripcion: 'Churrasco de 250 g, bondiola de cerdo de 180 g, pechuga de 180 g, chicharrón de 100 g, chorizo, papa a la francesa, papa criolla, plátano y guacamole.',
    foto: '', emoji: '🥩', disponible: true, orden: 2, precio: 65000 },
  { id: 'tabla-pollo', categoria: 'parrilla', nombre: 'Tabla de Pollo',
    descripcion: '2 piernas pernil al horno, 400 g de alas BBQ, papa a la francesa, papa criolla y plátano.',
    foto: '', emoji: '🍗', disponible: true, orden: 3, precio: 46000 },
  { id: 'pernil-duo', categoria: 'parrilla', nombre: 'Pierna Pernil Dúo',
    descripcion: '2 piernas pernil al horno con papa a la francesa, papa criolla y tajadas de plátano.',
    foto: '', emoji: '🍗', disponible: true, orden: 4, precio: 33000 },
  { id: 'alitas-bbq', categoria: 'parrilla', nombre: 'Alitas en Salsa BBQ',
    descripcion: '400 g de alas bañadas en salsa BBQ, con papa y guacamole.',
    foto: '', emoji: '🍗', disponible: true, orden: 5, precio: 23000,
    gruposOpciones: [PAPA, ADIC_COMPLETAS] },
  { id: 'pierna-pernil', categoria: 'parrilla', nombre: 'Pierna Pernil',
    descripcion: '1 pierna pernil al horno con papa.',
    foto: '', emoji: '🍗', disponible: true, orden: 6, precio: 15000 },
  { id: 'chicharron-criolla', categoria: 'parrilla', nombre: 'Chicharrón con Papa Criolla',
    descripcion: '200 g de chicharrón con papa criolla.',
    foto: '', emoji: '🥓', disponible: true, orden: 7, precio: 14000 },

  // ══════════════════ 🧃 JUGOS Y LIMONADAS ══════════════════
  { id: 'jugo-natural', categoria: 'jugos', nombre: 'Jugo Natural',
    descripcion: 'Fruta fresca, en agua o en leche.',
    foto: '', emoji: '🧃', disponible: true, orden: 1,
    variantes: [
      { id: 'agua', nombre: 'En agua', precio: 5000 },
      { id: 'leche', nombre: 'En leche', precio: 6500 },
    ],
    gruposOpciones: [{
      id: 'g-sabor', nombre: 'Sabor', subtitulo: 'Elige 1', emoji: '🍓',
      tipo: 'unica', min: 1, max: 1,
      opciones: [
        { id: 'maracuya', nombre: 'Maracuyá', emoji: '🟡', precioExtra: 0, foto: '' },
        { id: 'mango', nombre: 'Mango', emoji: '🥭', precioExtra: 0, foto: '' },
        { id: 'fresa', nombre: 'Fresa', emoji: '🍓', precioExtra: 0, foto: '' },
        { id: 'mora', nombre: 'Mora', emoji: '🫐', precioExtra: 0, foto: '' },
        { id: 'frutos-rojos', nombre: 'Frutos rojos', emoji: '🍒', precioExtra: 0, foto: '' },
        { id: 'guanabana', nombre: 'Guanábana', emoji: '🍈', precioExtra: 0, foto: '' },
      ],
    }] },
  { id: 'limonada', categoria: 'jugos', nombre: 'Limonada',
    descripcion: 'Bien fría: natural, cerezada, de coco o de hierbabuena.',
    foto: '', emoji: '🍋', disponible: true, orden: 2,
    variantes: [
      { id: 'natural', nombre: 'Natural', precio: 5000 },
      { id: 'cerezada', nombre: 'Cerezada', precio: 5500 },
      { id: 'hierbabuena', nombre: 'De hierbabuena', precio: 5500 },
      { id: 'coco', nombre: 'De coco', precio: 8000 },
    ] },
]
