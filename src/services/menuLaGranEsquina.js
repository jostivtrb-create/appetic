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
// ── Lo que NO hace todavía ──
//
// No sabe cuántas porciones quedan. La cocinera puede decir "solo 5 pechugas",
// pero ese contador se calcula desde las comandas de cocina, que no son
// públicas. Mientras eso no se resuelva, Appetic ofrece todo lo publicado
// —igual que hace hoy la propia página de clientes de La Gran Esquina.

import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { dbLaGranEsquina, fechaDeHoyBogota } from '../config/firebaseLaGranEsquina'

// Fotos fijas de los dos platos. Van vacías hasta que existan los archivos en
// public/locales/la-gran-esquina/ (los prompts están en su PROMPTS.md): una
// ruta que no existe se ve como una imagen rota, mientras que vacía deja que
// Appetic muestre el emoji, que se ve bien.
//
// Son fijas y no del panel porque este local no guarda productos en Appetic:
// no hay dónde subirlas por local. Y no hace falta — el corrientazo se ve
// igual todos los días aunque cambie la proteína.
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

/** Lo que la cocinera publicó hoy, ya con nombres en vez de códigos. */
function resolverItems(dailyMenu, todosLosItems, categoriaId) {
  const ids = dailyMenu?.itemsByCategory?.[categoriaId] || []
  return ids
    .map(id => todosLosItems.find(m => m.id === id))
    .filter(m => m && !m.archived)
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

  const sopa = dinero(config?.addonSoupPriceLlevar)
  if (sopa) opciones.push({ id: 'ad-sopa', nombre: 'Sopa adicional', emoji: '🥣', precioExtra: sopa, foto: '' })

  const huevo = dinero(config?.addonEggPriceLlevar)
  if (huevo) opciones.push({ id: 'ad-huevo', nombre: 'Huevo', emoji: '🍳', precioExtra: huevo, foto: '' })

  const proteina = dinero(config?.addonProteinPriceLlevar)
  if (proteina) {
    for (const p of proteinas) {
      opciones.push({
        id: `ad-prot-${p.id}`,
        nombre: `Porción extra de ${p.name.toLowerCase()}`,
        emoji: '🍖',
        precioExtra: proteina,
        foto: '',
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
    orden: 1,
    destacado: true,
    precio,
    gruposOpciones: grupos,
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
    orden: 2,
    destacado: false,
    precio,
    gruposOpciones: grupos,
  }
}

/**
 * El menú de hoy de La Gran Esquina, como productos de Appetic.
 *
 * Devuelve [] cuando todavía no han publicado — no es un error, es que son las
 * ocho de la mañana y la cocinera aún no ha subido nada. La pantalla lo dice
 * con sus palabras en vez de mostrar un menú a medias.
 */
export async function getMenuLaGranEsquina() {
  const db = dbLaGranEsquina()
  const hoy = fechaDeHoyBogota()

  const [diaSnap, configSnap, itemsSnap] = await Promise.all([
    getDoc(doc(db, 'dailyMenu', hoy)),
    getDoc(doc(db, 'dailyMenu', 'corriente_config')),
    getDocs(collection(db, 'menuItems')),
  ])

  const dailyMenu = diaSnap.exists() ? diaSnap.data() : null
  if (!dailyMenu) return []

  const config = configSnap.exists() ? configSnap.data() : null
  const todosLosItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  const resueltos = {}
  for (const cat of CATEGORIAS) resueltos[cat.id] = resolverItems(dailyMenu, todosLosItems, cat.id)
  resueltos.especial = resolverItems(dailyMenu, todosLosItems, 'especial')

  return [
    armarCorriente(dailyMenu, config, resueltos),
    armarEspecial(dailyMenu, resueltos),
  ].filter(Boolean)
}
