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
// estas cuatro líneas.
const FRANJAS = {
  desayunos: { desde: '06:00', hasta: '11:00' },
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
const MODO_EXPLICACION = true

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
  detalle: `Desayunos de ${FRANJAS.desayunos.desde} a ${FRANJAS.desayunos.hasta}, `
    + `y almuerzo de ${FRANJAS.almuerzos.desde} a ${FRANJAS.almuerzos.hasta}.`,
}

const FOTOS = {
  corriente: '',
  especial: '',
}

// Las mismas seis categorías que maneja la cocinera, en el orden en que se
// sirve un almuerzo. `pregunta` marca las que tiene sentido preguntarle al
// cliente; el arroz y la ensalada van siempre y no se eligen.
const CATEGORIAS = [
  { id: 'soup',      nombre: 'Sopa',        emoji: '🥣', pregunta: true,  obligatoria: true,  max: 1 },
  { id: 'principio', nombre: 'Principio',   emoji: '🫘', pregunta: true,  obligatoria: false, max: 2 },
  { id: 'protein',   nombre: 'Proteína',    emoji: '🍗', pregunta: true,  obligatoria: true,  max: 1 },
  { id: 'side',      nombre: 'Acompañante', emoji: '🍚', pregunta: false, obligatoria: false, max: 1 },
  { id: 'salad',     nombre: 'Ensalada',    emoji: '🥗', pregunta: false, obligatoria: false, max: 1 },
  { id: 'juice',     nombre: 'Jugo',        emoji: '🥤', pregunta: true,  obligatoria: true,  max: 1 },
]

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
 * Devuelve null cuando no hay nada que preguntar: si la cocinera publicó un
 * solo jugo, obligar al cliente a "elegir" entre una opción es ruido. Eso se
 * cuenta en la descripción del plato y ya.
 */
function grupoDeCategoria(categoria, items) {
  if (!categoria.pregunta) return null
  if (items.length < 2) return null

  return {
    id: `g-${categoria.id}`,
    nombre: categoria.nombre,
    subtitulo: categoria.max > 1 ? `Elige hasta ${categoria.max}` : 'Elige 1',
    emoji: categoria.emoji,
    tipo: categoria.max > 1 ? 'multiple' : 'unica',
    min: categoria.obligatoria ? 1 : 0,
    max: categoria.max,
    opciones: items.map(it => ({
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
  }
}

/**
 * Lo que va incluido sin que el cliente elija nada.
 *
 * Sale en la descripción del plato porque es justo lo que hace que un almuerzo
 * se vea completo: "con arroz, ensalada y jugo de mora" antoja mucho más que
 * un plato pelado que solo dice "almuerzo".
 */
function loQueVaIncluido(resueltos) {
  const partes = []
  for (const cat of CATEGORIAS) {
    const items = resueltos[cat.id] || []
    // Si hay una sola opción va fija; si hay varias, el cliente la elige y no
    // hay que anunciarla aquí.
    if (items.length === 1) partes.push(items[0].name.toLowerCase())
  }
  if (partes.length === 0) return ''
  if (partes.length === 1) return `Incluye ${partes[0]}.`
  return `Incluye ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}.`
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
 * Las categorías que van FIJAS hoy (una sola opción, no se preguntan).
 *
 * Hay que llevárselas apuntadas: al cliente no se le pregunta por el arroz,
 * pero la cocina tiene que saber que el plato lo lleva. Sin esto, el pedido
 * llegaría a la cocina sin acompañante y saldría un almuerzo incompleto.
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
    if (g) grupos.push(g)
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
export async function getMenuLaGranEsquina() {
  const db = dbLaGranEsquina()
  const hoy = fechaDeHoyBogota()
  const ahora = horaDeBogota()
  const horaDeDesayuno = esLaHoraDe('desayunos', ahora)
  const horaDeAlmuerzo = esLaHoraDe('almuerzos', ahora)

  // Ni una cosa ni la otra: no vale la pena ni leer el menú.
  if (!horaDeDesayuno && !horaDeAlmuerzo) {
    return { productos: [], avisoVacio: FUERA_DE_HORA }
  }

  const [diaSnap, configSnap, desayunoSnap, itemsSnap] = await Promise.all([
    getDoc(doc(db, 'dailyMenu', hoy)),
    getDoc(doc(db, 'dailyMenu', 'corriente_config')),
    getDoc(doc(db, 'dailyMenu', 'breakfast_config')),
    getDocs(collection(db, 'menuItems')),
  ])

  // El desayuno no depende del día: sus piezas y precios son fijos, y se
  // encienden o apagan con un interruptor. Por eso se arma aunque la cocinera
  // todavía no haya publicado el almuerzo — a las siete de la mañana el
  // desayuno ya se vende y el almuerzo no.
  const desayunos = horaDeDesayuno
    ? armarDesayunos(desayunoSnap.exists() ? desayunoSnap.data() : null)
    : []

  const dailyMenu = diaSnap.exists() ? diaSnap.data() : null
  if (!dailyMenu) {
    if (desayunos.length > 0) return { productos: desayunos, avisoVacio: null }
    // A la hora del desayuno, que no haya menú del día no es raro: la cocinera
    // lo sube más tarde. Lo que falta entonces es el desayuno, no el almuerzo.
    return { productos: [], avisoVacio: horaDeAlmuerzo ? SIN_PUBLICAR : FUERA_DE_HORA }
  }

  const config = configSnap.exists() ? configSnap.data() : null
  const todosLosItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const resueltos = {}
  for (const cat of CATEGORIAS) resueltos[cat.id] = resolverItems(dailyMenu, todosLosItems, cat.id)
  resueltos.especial = resolverItems(dailyMenu, todosLosItems, 'especial')

  const productos = [
    ...desayunos,
    ...(horaDeAlmuerzo
      ? [armarCorriente(dailyMenu, config, resueltos), armarEspecial(dailyMenu, resueltos)]
      : []),
  ].filter(Boolean)

  if (productos.length > 0) return { productos, avisoVacio: null }

  // Hay menú publicado pero no queda nada que vender. Distinguimos "se acabó"
  // de "aún no lo suben" mirando si HUBO algo: si la cocinera publicó
  // proteínas y ahora no queda ninguna, es que se agotaron.
  if (!horaDeAlmuerzo) return { productos: [], avisoVacio: FUERA_DE_HORA }
  const publicoAlgo = (dailyMenu.itemsByCategory?.protein || []).length > 0
  return { productos: [], avisoVacio: publicoAlgo ? SE_ACABO : SIN_PUBLICAR }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOS DESAYUNOS
//
// El desayuno de La Gran Esquina se arma por piezas —caldo, huevos, arroz con
// pan, bebida— y tiene COMBOS: ciertas combinaciones cuestan menos que la suma
// de sus partes. Un caldo de costilla con huevos, arroz y bebida vale $12.000
// sueltos $18.000.
//
// ── Por qué los combos van como platos y no como opciones ──
//
// Appetic suma: precio del plato más lo que sume cada opción elegida. No sabe
// mirar una combinación y decir "ah, esto en realidad es el Combo Costilla,
// cuesta menos". Ese motor vive en la app de La Gran Esquina.
//
// Meter el combo aquí como un descuento habría exigido reprogramar cómo suma
// Appetic, para TODOS los locales, por un caso de uno.
//
// Así que cada combo es un PLATO con su precio cerrado, y las piezas sueltas
// son platos aparte para quien solo quiere un caldo. Que es, además, como lo
// canta cualquier desayunadero: "el combo le sale en doce".
//
// Los combos salen primero y son casi siempre más baratos que armar lo mismo
// suelto, así que el cliente cae solo en el que le conviene.
//
// ── Todo con el recargo de llevar ──
//
// La Gran Esquina cobra un recargo fijo por empacar el desayuno. Va sumado en
// cada precio de aquí, porque por Appetic nadie come en el local.
// ─────────────────────────────────────────────────────────────────────────────

const HUEVOS_NORMALES = [
  { id: 'revueltos', nombre: 'Huevos revueltos' },
  { id: 'fritos', nombre: 'Huevos fritos' },
  { id: 'pericos', nombre: 'Huevos pericos' },
]
const BEBIDAS = [
  { id: 'cafe', nombre: 'Café' },
  { id: 'chocolate', nombre: 'Chocolate' },
]

/** Un grupo de "elige 1" que no cambia el precio (viene incluido en el plato). */
function grupoIncluido(id, nombre, emoji, opciones) {
  return {
    id: `g-${id}`,
    nombre,
    subtitulo: 'Elige 1',
    emoji,
    tipo: 'unica',
    min: 1,
    max: 1,
    opciones: opciones.map(o => ({ ...o, emoji: '', precioExtra: 0, foto: '' })),
  }
}

/** Lo que lleva un combo, dicho para que dé hambre. */
function loQueLlevaElCombo(combo) {
  const partes = []
  if (combo.caldo === 'costilla') partes.push('caldo de costilla')
  if (combo.caldo === 'pescado') partes.push('caldo de pescado')
  partes.push(combo.huevos === 'rancheros' ? 'huevos rancheros' : 'huevos')
  if (combo.arroz) partes.push('arroz con pan')
  if (combo.bebida) partes.push('bebida caliente')
  if (partes.length === 0) return ''
  return `Lleva ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}.`
}

function armarDesayunos(config) {
  if (!config?.active) return []

  const llevar = dinero(config.llevarSurcharge)
  const productos = []
  let orden = 10

  // ── Los combos, primero ──
  for (const combo of config.combos || []) {
    const base = dinero(combo.priceMesa)
    if (!base) continue

    const grupos = []
    // Un combo "normal" no dice CUÁLES huevos: eso lo elige el cliente y no
    // cambia el precio. Los rancheros ya vienen decididos por el combo.
    if (combo.huevos !== 'rancheros') {
      grupos.push(grupoIncluido('huevos', 'Los huevos', '🥚', HUEVOS_NORMALES))
    }
    if (combo.bebida) {
      grupos.push(grupoIncluido('bebida', 'La bebida', '☕', BEBIDAS))
    }

    productos.push({
      id: `desayuno-${combo.id}`,
      categoria: 'desayunos',
      nombre: combo.name || 'Combo desayuno',
      descripcion: loQueLlevaElCombo(combo),
      foto: '',
      emoji: '🍳',
      disponible: true,
      orden: orden++,
      destacado: orden === 11,
      precio: base + llevar,
      gruposOpciones: grupos,
      lge: {
        tipo: 'breakfast',
        comboId: combo.id,
        comboName: combo.name || null,
        // Lo que el combo trae decidido. Los huevos solo si son rancheros: los
        // normales los elige el cliente y llegan por el grupo de opciones.
        fijos: {
          ...(combo.caldo === 'costilla' ? { caldo: { id: 'costilla', name: 'Caldo de costilla' } } : {}),
          ...(combo.caldo === 'pescado' ? { caldo: { id: 'pescado', name: 'Caldo de pescado' } } : {}),
          ...(combo.huevos === 'rancheros'
            ? { huevos: { id: 'rancheros', name: 'Huevos rancheros', isRanchero: true } }
            : {}),
          ...(combo.arroz ? { arroz: { id: 'arroz_pan', name: 'Arroz con pan' } } : {}),
        },
      },
    })
  }

  // ── Y las piezas sueltas, para quien solo quiere una cosa ──
  const suelto = (id, nombre, emoji, precio, grupos = [], fijos = {}) => {
    if (!precio) return
    productos.push({
      id: `desayuno-${id}`,
      categoria: 'desayunos',
      nombre,
      descripcion: '',
      foto: '',
      emoji,
      disponible: true,
      orden: orden++,
      destacado: false,
      precio: precio + llevar,
      gruposOpciones: grupos,
      lge: { tipo: 'breakfast', comboId: null, comboName: null, fijos },
    })
  }

  suelto('caldo-costilla', 'Caldo de costilla', '🍲', dinero(config.caldoCostillaPrice), [],
    { caldo: { id: 'costilla', name: 'Caldo de costilla' } })
  suelto('caldo-pescado', 'Caldo de pescado', '🐟', dinero(config.caldoPescadoPrice), [],
    { caldo: { id: 'pescado', name: 'Caldo de pescado' } })

  const huevos = dinero(config.huevosNormalesPrice)
  const recargoRancheros = dinero(config.rancherosRecargo)
  if (huevos) {
    // Los rancheros cuestan más, así que aquí sí suman: es la única diferencia
    // de precio dentro del grupo.
    const opciones = HUEVOS_NORMALES.map(o => ({ ...o, emoji: '', precioExtra: 0, foto: '' }))
    if (recargoRancheros) {
      opciones.push({ id: 'rancheros', nombre: 'Huevos rancheros', emoji: '', precioExtra: recargoRancheros, foto: '' })
    }
    suelto('huevos', 'Huevos', '🥚', huevos, [{
      id: 'g-huevos', nombre: '¿Cómo los quieres?', subtitulo: 'Elige 1', emoji: '🥚',
      tipo: 'unica', min: 1, max: 1, opciones,
    }])
  }

  suelto('arroz-pan', 'Arroz con pan', '🍚', dinero(config.arrozPanPrice), [],
    { arroz: { id: 'arroz_pan', name: 'Arroz con pan' } })
  suelto('bebida', 'Bebida caliente', '☕', dinero(config.bebidaPrice), [
    grupoIncluido('bebida', '¿Cuál?', '☕', BEBIDAS),
  ])

  return productos
}
