// 🍛 El almuerzo de La Gran Esquina, traído tal como lo publicó la cocinera.
//
// Este archivo es el TRADUCTOR entre dos formas de pensar el mismo almuerzo:
//
//   La Gran Esquina piensa en "lo que hay HOY": seis categorías (sopa,
//   principio, proteína, arroz, ensalada, jugo) que la cocinera publica cada
//   mañana, con precios distintos para comer en mesa o para llevar.
//
//   Appetic piensa en "un producto con opciones": un plato con grupos de
//   elección tipo "elige 1" o "agrega lo que quieras".
//
// Las dos formas dicen lo mismo; solo hay que pasar de una a la otra. Nada de
// esto se guarda: se calcula al vuelo cada vez que alguien abre el menú, así
// que si la cocinera cambia algo a las 11, el cliente lo ve a las 11.
//
// ── En Appetic siempre es PARA LLEVAR ──
//
// Quien pide por aquí no está sentado en el local: recoge o se lo llevan. Por
// eso se usa `priceLlevar` en todo, que es lo que de verdad va a pagar. Usar
// el precio de mesa le saldría más barato en pantalla que en la caja, y esa
// discusión la tendría que dar la cajera.
//
// ── Las porciones que se acaban ──
//
// La cocinera puede decir "hoy solo hay 5 pechugas". Ese tope es de verdad: se
// gasta durante el servicio, y a la una puede no quedar ninguna.
//
// La caja y la cocina publican cuántas van consumidas en el propio menú del
// día (`consumedByItem`), y aquí se resta. Lo que se acabó **no se ofrece**:
// no aparece en la lista. Mostrarlo tachado solo sirve para que el cliente
// intente pedirlo igual.
//
// Si se acaba TODO lo de un grupo obligatorio —no queda ni una proteína— el
// almuerzo entero deja de venderse. Es lo correcto: no hay almuerzo que dar.

import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { dbLaGranEsquina, fechaDeHoyBogota, horaDeBogota } from '../config/firebaseLaGranEsquina'

// Fotos fijas de los dos platos. Van vacías hasta que existan los archivos en
// public/locales/la-gran-esquina/ (los prompts están en su PROMPTS.md): una
// ruta que no existe se ve como una imagen rota, mientras que vacía deja que
// Appetic muestre el emoji, que se ve bien.
//
// Son fijas y no del panel porque este local no guarda productos en Appetic:
// no hay dónde subirlas por local. Y no hace falta — el corrientazo se ve
// igual todos los días aunque cambie la proteína.
// ── A qué hora se pide cada cosa ──
//
// A las diez de la mañana nadie está sirviendo almuerzo, y a la una ya no hay
// caldo. Enseñar las dos cosas a toda hora acaba en un pedido que el local no
// puede cumplir y en una llamada para deshacerlo.
//
// Son horas del local (Bogotá), no del celular del cliente: alguien con el
// reloj mal puesto vería el menú que no es.
//
// ⚠️ Puestas a ojo — que Andrés diga las de verdad. Cambiarlas es cambiar
// estas tres líneas.
//
// Los COMBOS no tienen hora. Antes esto decía `desayunos: 06:00 a 11:00`
// porque lo único que había era el desayuno, y a la una de la tarde nadie
// pide caldo. Pero un combo ya no es un desayuno: Andrés arma el que quiera
// con los productos que tenga, y un combo de gaseosa y chocorramo se vende a
// las cuatro de la tarde igual que a las siete de la mañana.
//
// Y sí tiene interruptor: el combo que solo quiera vender temprano lo apaga
// desde Inventario. Eso lo decide él mirando el negocio, no una hora escrita
// aquí que nadie recuerda que existe.
const FRANJAS = {
  almuerzos: { desde: '11:00', hasta: '15:30' },
}

// ⚠️ TEMPORAL — 2026-09-04. Enseñar el menú COMPLETO a cualquier hora, para
// que Zeven pueda explicarle la app al personal sin depender del reloj.
//
// El local NO sale en el buscador de Appetic (`suscripcion.activa: false`), así
// que nadie de la calle llega aquí de casualidad: solo quien tenga el link.
// Por eso abrirlo no expone a recibir un pedido a las diez de la noche.
//
// PARA VOLVER A LA NORMALIDAD: poner esto en false. Nada más. Las franjas de
// abajo siguen escritas tal cual y vuelven a mandar solas.
const MODO_EXPLICACION = false

/** ¿Es hora de pedir esto? */
function esLaHoraDe(queCosa, ahora) {
  if (MODO_EXPLICACION) return true
  const f = FRANJAS[queCosa]
  if (!f) return true
  return ahora >= f.desde && ahora < f.hasta
}

// Lo que se le dice al cliente cuando no hay nada. Van aquí y no en la
// pantalla porque son cosas de ESTE negocio, no de Appetic.
const SIN_PUBLICAR = {
  emoji: '🍳',
  titulo: 'Todavía no publicamos el menú de hoy',
  detalle: 'La cocina lo sube cada mañana. Vuelve en un rato.',
}
const SE_ACABO = {
  emoji: '🙌',
  titulo: 'Por hoy se acabó el almuerzo',
  detalle: 'Se vendió todo lo de hoy. Mañana hay más desde temprano.',
}
const FUERA_DE_HORA = {
  emoji: '🕐',
  titulo: 'No es hora de pedir',
  detalle: `El almuerzo se pide de ${FRANJAS.almuerzos.desde} a ${FRANJAS.almuerzos.hasta}.`,
}

const FOTOS = {
  corriente: '',
  especial: '',
}

// Las mismas seis categorías que maneja la cocinera, en el orden en que se
// sirve un almuerzo. Todas se le muestran al cliente: armar el plato es el
// momento, y ver qué lleva es la mitad de la gracia.
// `reemplazos`: lo que se le ofrece a cambio si NO quiere esa parte. En la app
// del negocio eso es un paso aparte —"¿qué deseas en vez de la sopa?"—, pero
// Appetic no sabe hacer preguntas condicionales: sus grupos son planos.
//
// Así que las alternativas entran COMO OPCIONES DEL MISMO GRUPO. El cliente ve
// "Sancocho / Sin sopa, mejor huevo / Sin sopa, más arroz" y elige una sola
// vez. Menos pasos que allá, y el pedido llega igual de completo.
//
// `sePuedeQuitar`: el arroz, la ensalada y el jugo van servidos, pero hay quien
// no los quiere. Sin esta opción tendría que pedirlo por la nota y confiar.
const CATEGORIAS = [
  { id: 'soup',      nombre: 'Sopa',        emoji: '🥣', obligatoria: true,  max: 1,
    reemplazos: ['huevo', 'extra_principio', 'extra_arroz', 'extra_salad', 'extra_juice', 'nada'] },
  { id: 'principio', nombre: 'Principio',   emoji: '🫘', obligatoria: false, max: 2,
    reemplazos: ['huevo', 'extra_arroz', 'extra_salad', 'extra_juice', 'nada'] },
  { id: 'protein',   nombre: 'Proteína',    emoji: '🍗', obligatoria: true,  max: 1 },
  { id: 'side',      nombre: 'Acompañante', emoji: '🍚', obligatoria: false, max: 1, sePuedeQuitar: true },
  { id: 'salad',     nombre: 'Ensalada',    emoji: '🥗', obligatoria: false, max: 1, sePuedeQuitar: true },
  { id: 'juice',     nombre: 'Jugo',        emoji: '🥤', obligatoria: true,  max: 1, sePuedeQuitar: true },
]

// Los mismos nombres que usa la cocina al leer la comanda.
const NOMBRE_DEL_REEMPLAZO = {
  huevo:            { txt: 'mejor huevo',       emoji: '🍳' },
  extra_principio:  { txt: 'más principio',     emoji: '🫘' },
  extra_arroz:      { txt: 'más arroz',         emoji: '🍚' },
  extra_salad:      { txt: 'más ensalada',      emoji: '🥗' },
  extra_juice:      { txt: 'más jugo',          emoji: '🥤' },
  nada:             { txt: 'así está bien',     emoji: '👌' },
}

/**
 * Lo que la cocinera publicó hoy y TODAVÍA QUEDA, ya con nombres.
 *
 * Un item sin tope no se agota nunca (es lo normal: casi nada se limita). Uno
 * con tope desaparece en cuanto las porciones consumidas lo alcanzan.
 */
function resolverItems(dailyMenu, todosLosItems, categoriaId) {
  const ids = dailyMenu?.itemsByCategory?.[categoriaId] || []
  const topes = dailyMenu?.stockByItem || {}
  const consumidas = dailyMenu?.consumedByItem || {}

  return ids
    .map(id => todosLosItems.find(m => m.id === id))
    .filter(m => m && !m.archived)
    .filter(m => {
      const tope = topes[m.id]
      if (typeof tope !== 'number') return true
      return (tope - (consumidas[m.id] || 0)) > 0
    })
}

const dinero = v => (typeof v === 'number' && v > 0 ? v : 0)

/**
 * Convierte una categoría del día en un grupo de opciones de Appetic.
 *
 * ── Se muestran TODAS, tengan una opción o diez ──
 *
 * Al principio esto escondía las categorías con una sola opción: parecía de
 * sentido común no hacer "elegir" entre una cosa, y se contaba en la
 * descripción.
 *
 * Salió mal. El menú de un día normal trae una sopa, una proteína y un jugo, y
 * dos principios. Con aquella regla el cliente veía **un solo paso** —el
 * principio— y de ahí al pedido. No parecía que estuviera armando un almuerzo:
 * parecía que la app estaba rota.
 *
 * Armar el plato ES el momento. El cliente quiere ver qué lleva su almuerzo
 * paso a paso, aunque en varios pasos no haya nada que decidir. Ahorrarle dos
 * toques no vale perder eso.
 */
function grupoDeCategoria(categoria, items) {
  if (items.length === 0) return null

  return {
    id: `g-${categoria.id}`,
    nombre: categoria.nombre,
    subtitulo: items.length === 1
      ? 'Va incluido'
      : categoria.max > 1 ? `Elige hasta ${categoria.max}` : 'Elige 1',
    emoji: categoria.emoji,
    tipo: categoria.max > 1 ? 'multiple' : 'unica',
    min: categoria.obligatoria ? 1 : 0,
    max: categoria.max,
    opciones: [
      ...items.map(it => ({
        id: it.id,
        nombre: it.name,
        emoji: '',
        precioExtra: 0,
        foto: '',
        // Solo las proteínas lo traen. Es el producto del inventario que sale de
        // la nevera al vender este almuerzo; sin él, la pechuga no se descuenta.
        // Appetic no lo usa: viaja de vuelta con el pedido.
        ...(it.productId ? { productId: it.productId } : {}),
      })),
      // Una sola opción para decir que no. Lo que quiere EN SU LUGAR se
      // pregunta después, y solo si dijo que no (ver `grupoDelCambio`).
      ...((categoria.reemplazos || categoria.sePuedeQuitar) ? [{
        id: `sin-${categoria.id}`,
        nombre: `Sin ${categoria.nombre.toLowerCase()}`,
        emoji: '🚫',
        precioExtra: 0,
        foto: '',
        lgeQuitar: true,
      }] : []),
    ],
  }
}

/**
 * El paso que solo sale si dijo que NO quiere esa parte.
 *
 * "¿Qué deseas en vez de la sopa?" — huevo, más principio, más arroz… Es un
 * paso aparte y no siete tarjetas metidas junto a la sopa: quien SÍ quiere
 * sopa no tiene por qué ver esa lista, y a quien no la quiere se le pregunta
 * en su propia pantalla, como se lo preguntarían en el mostrador.
 *
 * `soloSi` es lo que hace que aparezca y desaparezca (ver utils/price.js).
 */
function grupoDelCambio(categoria) {
  if (!categoria.reemplazos) return null
  const mayus = t => t.charAt(0).toUpperCase() + t.slice(1)
  return {
    id: `g-${categoria.id}-cambio`,
    // 'la sopa' pero 'el principio': sin esto salia "En vez de la principio".
    nombre: `En vez ${categoria.id === 'soup' ? 'de la' : 'del'} ${categoria.nombre.toLowerCase()}`,
    subtitulo: '¿Qué prefieres?',
    emoji: '🔄',
    tipo: 'unica',
    min: 1,
    max: 1,
    soloSi: { grupo: `g-${categoria.id}`, opciones: [`sin-${categoria.id}`] },
    opciones: categoria.reemplazos.map(r => ({
      id: `cambio-${categoria.id}-${r}`,
      nombre: mayus(NOMBRE_DEL_REEMPLAZO[r].txt),
      emoji: NOMBRE_DEL_REEMPLAZO[r].emoji,
      precioExtra: 0,
      foto: '',
      lgeReemplazo: r,
    })),
  }
}


/**
 * Qué trae el almuerzo, en una línea, para la tarjeta del menú.
 *
 * Va en la descripción, que es lo que se lee ANTES de abrir el plato: hay que
 * poder decidir si te antoja sin tocar nada. Dentro, cada cosa vuelve a
 * aparecer como su propio paso.
 */
function loQueVaIncluido(resueltos) {
  const partes = []
  for (const cat of CATEGORIAS) {
    const items = resueltos[cat.id] || []
    if (items.length === 0) continue
    // Con una sola opción se dice cuál; con varias, que hay para elegir.
    partes.push(items.length === 1
      ? items[0].name.toLowerCase()
      : cat.nombre.toLowerCase())
  }
  if (partes.length === 0) return ''
  if (partes.length === 1) return `Con ${partes[0]}.`
  return `Con ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}.`
}

/**
 * El grupo de adiciones, con los precios de llevar que puso la cocinera.
 *
 * La proteína extra se abre en una opción por cada proteína del día en vez de
 * un "porción extra" a secas. Si hoy hay pechuga y carne, el cliente puede
 * querer la otra, y preguntárselo después por WhatsApp es justo el ida y vuelta
 * que el menú viene a evitar.
 */
function grupoDeAdiciones(config, proteinas) {
  const opciones = []

  // Cada adición lleva apuntado QUÉ es (`lgeAddon`). La Gran Esquina las
  // guarda como líneas propias del pedido, no como un extra del almuerzo:
  // una proteína adicional descuenta su propia porción del inventario.
  const sopa = dinero(config?.addonSoupPriceLlevar)
  if (sopa) opciones.push({
    id: 'ad-sopa', nombre: 'Sopa adicional', emoji: '🥣', precioExtra: sopa, foto: '',
    lgeAddon: { type: 'soup', unitPrice: sopa },
  })

  const huevo = dinero(config?.addonEggPriceLlevar)
  if (huevo) opciones.push({
    id: 'ad-huevo', nombre: 'Huevo', emoji: '🍳', precioExtra: huevo, foto: '',
    lgeAddon: { type: 'egg', unitPrice: huevo },
  })

  const proteina = dinero(config?.addonProteinPriceLlevar)
  if (proteina) {
    for (const p of proteinas) {
      opciones.push({
        id: `ad-prot-${p.id}`,
        nombre: `Porción extra de ${p.name.toLowerCase()}`,
        emoji: '🍖',
        precioExtra: proteina,
        foto: '',
        lgeAddon: { type: 'protein', unitPrice: proteina, proteinId: p.id, proteinName: p.name },
      })
    }
  }

  if (opciones.length === 0) return null

  return {
    id: 'g-adiciones',
    nombre: '¿Algo más?',
    subtitulo: 'Opcional',
    emoji: '➕',
    tipo: 'multiple',
    min: 0,
    max: 6,
    opciones,
  }
}

/**
 * Las categorías con una sola opción, apuntadas aparte.
 *
 * Ahora también se le muestran al cliente, pero las opcionales (el arroz, la
 * ensalada) puede dejarlas sin tocar. Si no las toca, el pedido igual tiene que
 * llegar completo a la cocina — de ahí este respaldo. Lo que el cliente SÍ
 * elija manda sobre esto.
 */
function loQueVaFijo(resueltos) {
  const fijos = {}
  for (const cat of CATEGORIAS) {
    const items = resueltos[cat.id] || []
    if (items.length === 1) {
      fijos[cat.id] = { id: items[0].id, name: items[0].name }
    }
  }
  return fijos
}

/** El almuerzo corriente de hoy, o null si hoy no se puede pedir. */
function armarCorriente(dailyMenu, config, resueltos) {
  const precio = dinero(config?.priceLlevar)
  // Sin sopa, sin proteína o sin jugo no hay almuerzo que vender: son las tres
  // que La Gran Esquina exige para darlo por publicado.
  const completo = ['soup', 'protein', 'juice'].every(c => (resueltos[c] || []).length > 0)
  if (!precio || !completo) return null

  const grupos = []
  for (const cat of CATEGORIAS) {
    const g = grupoDeCategoria(cat, resueltos[cat.id] || [])
    if (!g) continue
    grupos.push(g)
    // Detrás de cada categoría que se puede cambiar, su paso de "¿y entonces
    // qué?". El wizard lo salta solo si el cliente sí quiso la sopa.
    const cambio = grupoDelCambio(cat)
    if (cambio) grupos.push(cambio)
  }
  const adiciones = grupoDeAdiciones(config, resueltos.protein || [])
  if (adiciones) grupos.push(adiciones)

  return {
    id: 'almuerzo-corriente',
    categoria: 'almuerzos',
    nombre: 'Almuerzo del día',
    descripcion: loQueVaIncluido(resueltos),
    foto: FOTOS.corriente,
    emoji: '🍛',
    disponible: true,
    orden: 100,
    destacado: true,
    precio,
    // PASO A PASO, no un formulario de una pantalla.
    //
    // Así es como se pide un almuerzo en el local y en la app del negocio: la
    // sopa, luego el principio, luego la proteína. Metido todo junto en una
    // sola pantalla con listas, el cliente no siente que esté armando su plato
    // — y armarlo ES el momento.
    //
    // Appetic ya sabía hacer esto (`ProductWizard`, para el "arma tu perro").
    // No hubo que construir nada: solo decirle que este plato es de esos.
    modo: 'pasos',
    gruposOpciones: grupos,
    // Para rehacer el pedido del lado de La Gran Esquina (ver pedidoLaGranEsquina.js).
    lge: { tipo: 'corriente', fijos: loQueVaFijo(resueltos) },
  }
}

/** El almuerzo especial, si la cocinera lo activó hoy. */
function armarEspecial(dailyMenu, resueltos) {
  if (!dailyMenu?.special?.active) return null
  const precio = dinero(dailyMenu.special.priceLlevar)
  const platos = resueltos.especial || []
  if (!precio || platos.length === 0) return null

  const grupos = []
  // El especial comparte la sopa y la ensalada con el corriente.
  const sopa = grupoDeCategoria(CATEGORIAS[0], resueltos.soup || [])
  if (sopa) grupos.push(sopa)

  return {
    id: 'almuerzo-especial',
    categoria: 'almuerzos',
    nombre: platos.length === 1 ? platos[0].name : 'Almuerzo especial',
    descripcion: [
      platos.length > 1 ? platos.map(p => p.name).join(' · ') : '',
      loQueVaIncluido({ side: resueltos.side, salad: resueltos.salad }),
    ].filter(Boolean).join(' '),
    foto: FOTOS.especial,
    emoji: '⭐',
    disponible: true,
    orden: 101,
    destacado: false,
    precio,
    modo: 'pasos',
    gruposOpciones: grupos,
    lge: {
      tipo: 'especial',
      fijos: loQueVaFijo({ side: resueltos.side, salad: resueltos.salad }),
      especial: platos.length === 1 ? { id: platos[0].id, name: platos[0].name } : null,
    },
  }
}

/**
 * El menú de hoy de La Gran Esquina, como productos de Appetic.
 *
 * Cuando no hay nada que vender devuelve además el MOTIVO, porque los dos
 * casos se ven igual —una lista vacía— y para el cliente son muy distintos:
 * "todavía no lo han subido" invita a volver en un rato, "ya se acabó" no.
 * Sin eso, la página quedaba en blanco sin explicar nada.
 */
export async function getMenuLaGranEsquina({ fotos } = {}) {
  const res = await leerMenuDeHoy()
  return { ...res, productos: conFotos(res.productos, fotos) }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAS FOTOS
//
// El menú se arma en vivo desde la app del local y allá no hay fotos: es una
// caja, no una carta. Pero una tarjeta sin foto se ve pobre, y las fotos son
// de Appetic —Andrés las genera con IA desde su panel, igual que los demás
// dueños—. Como aquí no hay productos guardados donde colgarlas, viven en el
// doc del local, en `fotosExternas: { [clave]: url }`, y se pegan sobre lo que
// el traductor arma:
//
//   • un plato  → su `id` de Appetic ("combo-<id>", "armable-<id>",
//                 "almuerzo-corriente", "almuerzo-especial")
//   • una opción → "opcion-<id>" con el id de allá (un menuItem del almuerzo,
//                 una opción del desayuno como "o_costilla", o "ad-sopa")
//
// La porción extra de proteína ("ad-prot-<id>") usa la foto de esa proteína:
// es la misma pechuga.
// ─────────────────────────────────────────────────────────────────────────────

/** La clave con la que una opción busca su foto en `fotosExternas`. */
function claveDeOpcion(opcion) {
  return `opcion-${opcion.lgeAddon?.proteinId || opcion.id}`
}

function conFotos(productos, fotos) {
  if (!fotos || typeof fotos !== 'object') return productos
  return productos.map(p => ({
    ...p,
    foto: fotos[p.id] || p.foto || '',
    gruposOpciones: (p.gruposOpciones || []).map(g => ({
      ...g,
      opciones: (g.opciones || []).map(o => ({ ...o, foto: fotos[claveDeOpcion(o)] || o.foto || '' })),
    })),
  }))
}

/**
 * Todo lo que puede llevar foto, para el panel: el desayuno con cada una de
 * sus opciones, los combos cerrados y el almuerzo con TODOS los ítems del
 * inventario de la cocina (no solo los de hoy: la foto de la sopa de mondongo
 * se sube una vez y sirve cada jueves).
 *
 * Devuelve secciones `{ id, titulo, items: [{ clave, nombre, detalle, tipo, apagado }] }`.
 */
export async function getCatalogoFotosLaGranEsquina() {
  const db = dbLaGranEsquina()
  const [combosSnap, publicoSnap, itemsSnap] = await Promise.all([
    getDocs(collection(db, 'combos')),
    getDoc(doc(db, 'negocio', 'publico')),
    getDocs(collection(db, 'menuItems')),
  ])
  const combos = combosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const carta = publicoSnap.exists() ? (publicoSnap.data()?.carta?.armables || {}) : {}
  const secciones = []

  // El desayuno (y cualquier otro armable): el plato y cada opción.
  for (const combo of combos) {
    if (!Array.isArray(combo.groups) || combo.groups.length === 0) continue
    const publicada = carta[combo.id]
    const nombre = publicada?.name || combo.name || 'Desayuno'
    const items = [{
      clave: `armable-${combo.id}`, nombre, detalle: 'La tarjeta del plato en el menú',
      tipo: 'producto', apagado: combo.active === false,
    }]
    for (const g of publicada?.groups || []) {
      for (const o of g.options || []) {
        items.push({ clave: `opcion-${o.id}`, nombre: o.name, detalle: g.label, tipo: 'opcion' })
      }
    }
    secciones.push({ id: `armable-${combo.id}`, titulo: `🍳 ${nombre}`, items })
  }

  // Los combos cerrados.
  const cerrados = combos.filter(c => !(Array.isArray(c.groups) && c.groups.length > 0))
  if (cerrados.length > 0) {
    secciones.push({
      id: 'combos', titulo: '🧺 Combos',
      items: cerrados.map(c => ({
        clave: `combo-${c.id}`, nombre: c.name || 'Combo', detalle: loQueLleva(c),
        tipo: 'producto', apagado: c.active === false,
      })),
    })
  }

  // El almuerzo: las dos tarjetas y todo el inventario de la cocina por categoría.
  const menuItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => !m.archived)
  const items = [
    { clave: 'almuerzo-corriente', nombre: 'Almuerzo del día', detalle: 'La tarjeta del plato en el menú', tipo: 'producto' },
    { clave: 'almuerzo-especial', nombre: 'Almuerzo especial', detalle: 'La tarjeta, los días que la cocina lo activa', tipo: 'producto' },
  ]
  for (const cat of [...CATEGORIAS, { id: 'especial', nombre: 'Especial' }]) {
    const deLaCategoria = menuItems
      .filter(m => m.category === cat.id)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'))
    for (const m of deLaCategoria) {
      items.push({ clave: `opcion-${m.id}`, nombre: m.name || '(sin nombre)', detalle: cat.nombre, tipo: 'opcion' })
    }
  }
  items.push(
    { clave: 'opcion-ad-sopa', nombre: 'Sopa adicional', detalle: '¿Algo más?', tipo: 'opcion' },
    { clave: 'opcion-ad-huevo', nombre: 'Huevo', detalle: '¿Algo más?', tipo: 'opcion' },
  )
  secciones.push({ id: 'almuerzos', titulo: '🍛 Almuerzo del día', items })

  return secciones
}

async function leerMenuDeHoy() {
  const db = dbLaGranEsquina()
  const hoy = fechaDeHoyBogota()
  const ahora = horaDeBogota()
  const horaDeAlmuerzo = esLaHoraDe('almuerzos', ahora)

  // Los combos y la carta pública se leen SIEMPRE, aunque no sea hora de
  // almuerzo: no tienen franja. El menú del día también, porque además del
  // almuerzo trae qué opciones del desayuno hay HOY. Lo único que se ahorra
  // fuera de hora es el catálogo del almuerzo, que a las ocho no se usa.
  const [combosSnap, publicoSnap, diaSnap, configSnap, itemsSnap] = await Promise.all([
    getDocs(collection(db, 'combos')),
    getDoc(doc(db, 'negocio', 'publico')),
    getDoc(doc(db, 'dailyMenu', hoy)),
    horaDeAlmuerzo ? getDoc(doc(db, 'dailyMenu', 'corriente_config')) : null,
    horaDeAlmuerzo ? getDocs(collection(db, 'menuItems')) : null,
  ])

  const dailyMenu = diaSnap.exists() ? diaSnap.data() : null
  const carta = publicoSnap.exists() ? (publicoSnap.data()?.carta?.armables || {}) : {}
  const todosLosCombos = combosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const combos = [
    ...armarArmables(todosLosCombos, carta, dailyMenu),
    ...armarCombos(todosLosCombos),
  ]

  if (!horaDeAlmuerzo) {
    // Fuera de la hora del almuerzo el local todavía vende sus combos. Solo
    // cuando tampoco hay combos encendidos se dice que no es hora de pedir.
    return combos.length > 0
      ? { productos: combos, avisoVacio: null }
      : { productos: [], avisoVacio: FUERA_DE_HORA }
  }

  if (!dailyMenu) {
    // Que no haya menú del día no siempre es un problema: la cocinera lo sube
    // cuando lo tiene. Si hay combos, se venden igual y no se le dice nada al
    // cliente; el aviso de "todavía no publicamos" solo sale si de verdad no
    // hay nada que ofrecer.
    if (combos.length > 0) return { productos: combos, avisoVacio: null }
    return { productos: [], avisoVacio: SIN_PUBLICAR }
  }

  const config = configSnap.exists() ? configSnap.data() : null
  const todosLosItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const resueltos = {}
  for (const cat of CATEGORIAS) resueltos[cat.id] = resolverItems(dailyMenu, todosLosItems, cat.id)
  resueltos.especial = resolverItems(dailyMenu, todosLosItems, 'especial')

  const productos = [
    ...combos,
    armarCorriente(dailyMenu, config, resueltos),
    armarEspecial(dailyMenu, resueltos),
  ].filter(Boolean)

  if (productos.length > 0) return { productos, avisoVacio: null }

  // Hay menú publicado pero no queda nada que vender. Distinguimos "se acabó"
  // de "aún no lo suben" mirando si HUBO algo: si la cocinera publicó
  // proteínas y ahora no queda ninguna, es que se agotaron.
  const publicoAlgo = (dailyMenu.itemsByCategory?.protein || []).length > 0
  return { productos: [], avisoVacio: publicoAlgo ? SE_ACABO : SIN_PUBLICAR }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOS COMBOS
//
// Antes aquí se armaba el desayuno: cuatro categorías escritas en el código
// —caldo, huevos, arroz con pan, bebida— con ocho opciones fijas y unos
// precios que vivían en un documento aparte. Para vender un tamal había que
// tocar el programa, en dos apps.
//
// Ya no. Andrés arma sus combos en el inventario de La Gran Esquina con los
// productos que él mismo tiene cargados: "COMBO 1 = 2 huevos + 1 tamal + 1
// chocolate, $12.000". Este archivo solo los lee y los enseña.
//
// ── Por qué el combo es un PLATO y no una lista de opciones ──
//
// Appetic suma: precio del plato más lo que sume cada opción elegida. Un combo
// no funciona así — su gracia es justamente que cuesta MENOS que la suma de
// sus partes. Meterlo como descuento habría exigido reprogramar cómo suma
// Appetic, para todos los locales, por un caso de uno.
//
// Así que cada combo es un plato de precio cerrado, sin grupos de opciones.
// Que es además lo que Andrés pidió: el combo es el combo, el cliente no le
// quita ni le pone. Y es como se canta en cualquier esquina: "el combo le
// sale en doce".
//
// ── Lo que viaja de vuelta ──
//
// Solo el ID y el nombre. Appetic NO puede leer /products —ahí están los
// costos y las reglas piden sesión—, así que no tiene con qué congelar lo que
// lleva el combo. Eso lo hace la caja al confirmar el pedido, que sí tiene el
// inventario a la mano. Es además el momento correcto: el combo vale lo que
// vale cuando se confirma.
//
// ── Precio de llevar ──
//
// Por Appetic nadie come en el local, así que se usa `priceLlevar`. Vacío no
// quiere decir gratis: quiere decir "cuesta lo mismo".
// ─────────────────────────────────────────────────────────────────────────────

/** El precio que paga quien pide por aquí, que siempre es para llevar. */
function precioParaLlevar(combo) {
  const llevar = dinero(combo.priceLlevar)
  return llevar > 0 ? llevar : dinero(combo.priceMesa)
}

/**
 * Lo que lleva el combo, dicho para que dé hambre.
 *
 * Los nombres vienen copiados dentro del propio combo (`items[].productName`),
 * y por eso se puede escribir esto sin leer el inventario — que es justo lo
 * que Appetic no tiene permitido.
 */
function loQueLleva(combo) {
  const partes = (combo.items || [])
    .map(it => {
      const nombre = String(it.productName || '').trim()
      if (!nombre) return null
      const qty = Number(it.qty) || 1
      return qty > 1 ? `${qty} ${nombre.toLowerCase()}` : nombre.toLowerCase()
    })
    .filter(Boolean)

  if (partes.length === 0) return ''
  if (partes.length === 1) return `Lleva ${partes[0]}.`
  return `Lleva ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}.`
}

/**
 * Los combos encendidos, como platos de Appetic.
 *
 * Un combo sin precio o sin nada adentro no se enseña. No es un capricho: es
 * un combo a medio armar, y ofrecerlo termina en un pedido que la caja no sabe
 * cobrar.
 */
function armarCombos(combos = []) {
  const productos = []
  let orden = 10

  for (const combo of combos) {
    if (combo.active === false) continue

    // Los que se ARMAN al pedir salen por otro lado (`armarArmables`): no
    // tienen precio ni lista fija, y aquí se está armando platos cerrados.
    if (Array.isArray(combo.groups) && combo.groups.length > 0) continue

    const precio = precioParaLlevar(combo)
    if (!precio) continue
    if ((combo.items || []).length === 0) continue

    productos.push({
      id: `combo-${combo.id}`,
      categoria: 'combos',
      // Por si el local todavía no tiene la categoría "Combos" en su panel de
      // Appetic: así la pestaña sale con nombre de verdad y no con el id en
      // minúscula.
      categoriaNombre: 'Combos',
      categoriaEmoji: '🧺',
      nombre: combo.name || 'Combo',
      descripcion: loQueLleva(combo),
      foto: '',
      emoji: '🧺',
      disponible: true,
      orden: orden++,
      destacado: orden === 11,
      precio,
      // Cerrado a propósito: el combo es el combo. Sin grupos, el cliente lo
      // agrega de un toque y no hay pasos que atravesar.
      gruposOpciones: [],
      lge: {
        tipo: 'combo',
        comboId: combo.id,
        comboName: combo.name || null,
        fijos: {},
      },
    })
  }

  // Del más barato al más caro. Quien entra a mirar combos está mirando
  // precio; que el primero sea el que le conviene.
  productos.sort((a, b) => a.precio - b.precio)
  return productos
}

// ─────────────────────────────────────────────────────────────────────────────
// LO QUE SE ARMA AL PEDIR (el desayuno)
//
// Allá el "Desayuno" no es un plato cerrado: es una lista de grupos —caldo,
// huevos, arroz, bebida— donde la mesera va marcando lo que el cliente dice.
// Quien solo quiere un caldito pide solo el caldito. Y si lo que marcó
// coincide con un combo —"caldo, huevos, arroz y bebida le sale en doce"— el
// precio del combo cae solo.
//
// Durante un tiempo esto no salía por internet. El motivo era real: cada
// opción es un producto del inventario y su precio vive en /products, que pide
// sesión porque ahí están los costos. Appetic pide sin cuenta. Así que aquí
// solo se veían los combos cerrados, y Andrés lo dijo claro: "la gente va a
// pedir y no le sale la opción de pedir solo un caldito de costilla".
//
// La salida no fue abrir /products —eso regala los costos del negocio— sino
// que la app del local publique lo poco que la calle necesita en
// `negocio/publico.carta.armables[comboId]`: cada opción con su nombre y su
// precio de venta, y los precios de combo. La escribe la caja sola cada vez
// que algo cambia (ver cartaPublica.js allá). Si para un armable no hay carta
// publicada, no se ofrece: mejor no salir que salir sin precio.
//
// Lo que hay HOY viene de `dailyMenu/{hoy}.armables[comboId]`, igual que la
// mesera lo ve: si Andrés publicó que hoy no hay pescado, aquí tampoco. Y si
// no publicó nada, se ofrece todo, que es la regla de allá.
//
// ── Cómo se traduce ──
//
// Un producto `modo: 'pasos'` con un grupo por cada grupo de allá, todos
// opcionales (min 0, max 1). El precio base es el recargo de llevar —por aquí
// nadie come en el local— y cada opción trae su precio como `precioExtra`.
// Los precios de combo van como `ofertas` (ver utils/price.js): la oferta
// vale precio del combo + recargo, y lo que no cubra se suma aparte.
//
// De vuelta al local viaja `comboSeleccion` —qué opción escogió en cada
// grupo, con los ids de allá— y la caja congela y cobra con SUS precios de
// hoy. La carta es una copia; la caja es quien cobra.
// ─────────────────────────────────────────────────────────────────────────────

/** Los grupos con solo lo que hay hoy, según lo que Andrés publicó. */
function gruposDeHoy(carta, dailyMenu, comboId) {
  const dia = dailyMenu?.armables?.[comboId]
  if (!dia) return { hayHoy: true, groups: carta.groups || [] }
  if (dia.active === false) return { hayHoy: false, groups: [] }
  const groups = (carta.groups || [])
    .map(g => {
      const hoy = dia.opciones?.[g.id]
      // Un grupo que Andrés nunca tocó al publicar sale completo, igual que allá.
      if (!Array.isArray(hoy)) return g
      return { ...g, options: (g.options || []).filter(o => hoy.includes(o.id)) }
    })
    .filter(g => (g.options || []).length > 0)
  return { hayHoy: groups.length > 0, groups }
}

/** "Caldo · Huevos · Arroz con pan · Bebida caliente." */
function loQueSeEscoge(groups) {
  const nombres = groups.map(g => g.label.toLowerCase())
  if (nombres.length === 0) return ''
  if (nombres.length === 1) return `Escoge tu ${nombres[0]}.`
  return `Escoge ${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}. Pide solo lo que quieras.`
}

function armarArmables(combos = [], carta = {}, dailyMenu = null) {
  const productos = []
  let orden = 1

  for (const combo of combos) {
    if (combo.active === false) continue
    if (!Array.isArray(combo.groups) || combo.groups.length === 0) continue
    const publicada = carta[combo.id]
    // Sin carta publicada no hay precios, y sin precios no se ofrece. La caja
    // la escribe sola en cuanto alguien abre la app del local.
    if (!publicada || !Array.isArray(publicada.groups)) continue

    const { hayHoy, groups } = gruposDeHoy(publicada, dailyMenu, combo.id)
    if (!hayHoy) continue

    const recargo = dinero(publicada.llevarSurcharge)
    const idsDeHoy = new Set(groups.flatMap(g => g.options.map(o => o.id)))

    const gruposOpciones = groups.map(g => ({
      id: g.id,
      nombre: g.label || 'Escoge',
      subtitulo: 'Opcional · elige 1 o ninguno',
      emoji: '',
      tipo: 'unica',
      min: 0,
      max: 1,
      opciones: g.options.map(o => ({
        id: o.id,
        nombre: o.qty > 1 ? `${o.qty} ${o.name}` : o.name,
        emoji: '',
        precioExtra: dinero(o.price) * (Number(o.qty) || 1),
        foto: '',
        // Lo que la caja necesita para congelar el pedido. Appetic no lo usa.
        lgeProductId: o.productId || null,
        lgeProductName: o.name,
        lgeQty: Number(o.qty) || 1,
      })),
    }))

    // Los precios de combo, solo los que hoy se pueden armar: un "Combo
    // Pescado" el día que no hay pescado sería anunciar lo que no se puede
    // pedir. Y las opciones que hoy no están se les quitan.
    const ofertas = (publicada.deals || [])
      .map(d => {
        const requiere = {}
        for (const [grupoId, ids] of Object.entries(d.match || {})) {
          const hoy = (Array.isArray(ids) ? ids : []).filter(id => idsDeHoy.has(id))
          if (hoy.length === 0) return null
          requiere[grupoId] = hoy
        }
        if (Object.keys(requiere).length === 0) return null
        return { id: d.id, nombre: d.name, precio: dinero(d.price), requiere }
      })
      .filter(Boolean)

    // El "desde" de la tarjeta: el combo más barato, o si no hay combos lo más
    // económico de cada grupo sumado. Con el recargo de llevar encima, que es
    // lo que de verdad va a pagar.
    const completoSuelto = groups.reduce(
      (suma, g) => suma + Math.min(...g.options.map(o => dinero(o.price) * (Number(o.qty) || 1))), 0
    )
    const desde = (ofertas.length > 0
      ? Math.min(completoSuelto, ...ofertas.map(o => o.precio))
      : completoSuelto) + recargo

    productos.push({
      id: `armable-${combo.id}`,
      categoria: 'desayunos',
      categoriaNombre: 'Desayuno',
      categoriaEmoji: '🍳',
      nombre: publicada.name || combo.name || 'Desayuno',
      descripcion: [
        loQueSeEscoge(groups),
        ofertas.length > 0 ? `Combos desde ${cop(desde)}.` : '',
      ].filter(Boolean).join(' '),
      foto: '',
      emoji: '🍳',
      disponible: true,
      orden: orden++,
      destacado: true,
      // El precio base es el recargo de llevar: se le suma a lo que arme.
      precio: recargo,
      precioDesde: desde,
      modo: 'pasos',
      gruposOpciones,
      ofertas,
      // Todos los pasos son opcionales, pero algo tiene que llevar.
      minElecciones: 1,
      lge: {
        tipo: 'armable',
        comboId: combo.id,
        comboName: publicada.name || combo.name || null,
        llevarSurcharge: recargo,
        fijos: {},
      },
    })
  }

  return productos
}

/** "$12.000", como lo escribe Appetic en la descripción. */
function cop(valor) {
  return '$' + Math.round(Number(valor) || 0).toLocaleString('es-CO')
}
