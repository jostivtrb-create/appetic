// 🧮 Cálculo del precio de un ítem del menú según sus elecciones.
//
// Modelo de un producto (ver PLANEACION D20):
//   precio:      precio base (si no hay variantes)
//   variantes:   [{ id, nombre, precio }]            -> se elige UNA, fija el precio base
//   gruposOpciones: [{ id, nombre, tipo, min, max, maxPorVariante, opciones:[{id,nombre,precioExtra}] }]
//                  -> 'unica' (combos: elige 1) o 'multiple' (adicionales: elige varios)
//                  -> maxPorVariante: { [varianteId]: tope } — cuántas puede elegir SEGÚN
//                     el tamaño (una familiar admite 3 sabores; una personal, 1).

// 🍕 Cuántas opciones de este grupo puede elegir el cliente CON EL TAMAÑO QUE ELIGIÓ.
//
// El dueño configura el tope por tamaño desde su panel (pizza familiar: 3 sabores;
// personal: 1). Si para ese tamaño no puso nada, manda el tope general del grupo.
export function maxDelGrupo(grupo, varianteId) {
  const propio = Number(grupo?.maxPorVariante?.[varianteId]) || 0
  if (propio > 0) return propio
  return grupo?.max ?? 99
}

// Al cambiar de tamaño el tope puede ENCOGER (familiar 3 → personal 1). Devuelve las
// elecciones recortadas a lo que cabe, conservando las primeras que marcó el cliente.
// `cambio` avisa si hubo que quitar algo, para poder decírselo en pantalla.
export function recortarPorVariante(producto, grupos = {}, varianteId) {
  let cambio = false
  const next = { ...grupos }
  for (const grupo of producto?.gruposOpciones || []) {
    const elegidas = grupos[grupo.id] || []
    const max = maxDelGrupo(grupo, varianteId)
    if (elegidas.length > max) {
      next[grupo.id] = elegidas.slice(0, max)
      cambio = true
    }
  }
  return { grupos: next, cambio }
}

// 🏷️ DESCUENTO POR ARMARLO COMPLETO: "llévelo entero y le rebajo X".
//
// Appetic suma: precio base más lo que sume cada opción. Un combo no funciona
// así —su gracia es que cuesta MENOS que la suma de sus partes— y hasta hace
// poco eso se decía con OFERTAS: reglas de "si lleva esta opción y esta otra,
// sale en doce mil". Una regla por combinación.
//
// Salió caro de mantener. El local que agregaba un caldo nuevo tenía que
// meterlo a mano en todas las reglas, y mientras no lo hiciera ese caldo se
// cobraba suelto sin que nadie se enterara. Con cuatro grupos de cuatro
// opciones son más combinaciones de las que nadie mantiene.
//
// Ahora un producto trae un solo número:
//
//   descuentoCompleto: 6000
//
// y se resta cuando el cliente eligió en TODOS los grupos obligatorios. Una
// opción nueva entra al descuento el día que nace, sin tocar nada más.
//
// Sigue siendo genérico: cualquier producto por pasos puede traerlo, y qué es
// "completo" lo dicen sus propios grupos (los de `min >= 1`). No sabe nada de
// desayunos ni de ningún local en particular.

/** Los grupos que hay que llenar para que cuente como completo. */
function gruposObligatorios(producto) {
  return (producto?.gruposOpciones || []).filter(g => (Number(g.min) || 0) >= 1)
}

/**
 * ¿Eligió en todos los grupos obligatorios?
 *
 * Sin grupos obligatorios no hay "completo" que valga: se devuelve false para
 * que un producto suelto no se lleve un descuento que nadie configuró.
 */
export function estaCompleto(producto, seleccion = {}) {
  const obligatorios = gruposObligatorios(producto)
  if (obligatorios.length === 0) return false
  const grupos = seleccion.grupos || {}
  return obligatorios.every(g => (grupos[g.id] || []).length > 0)
}

/**
 * Lo que se le rebaja a esto, si algo. Nunca deja el precio en negativo: un
 * descuento mal puesto es un error de configuración del local, no plata que el
 * restaurante le deba al cliente.
 */
export function descuentoAplicado(producto, seleccion = {}, extras = 0) {
  const d = Number(producto?.descuentoCompleto) || 0
  if (d <= 0) return 0
  if (!estaCompleto(producto, seleccion)) return 0
  return Math.min(d, extras)
}

// Precio unitario (1 unidad) con sus elecciones aplicadas.
export function precioUnitario(producto, seleccion = {}) {
  let base = Number(producto.precio) || 0

  // Variante elegida (tamaño) reemplaza el precio base
  if (producto.variantes?.length && seleccion.varianteId) {
    const v = producto.variantes.find(x => x.id === seleccion.varianteId)
    if (v) base = Number(v.precio) || 0
  }

  // Opciones de grupos (combos + adicionales) suman su precioExtra
  let extras = 0
  const grupos = seleccion.grupos || {}
  for (const grupo of producto.gruposOpciones || []) {
    const elegidas = grupos[grupo.id] || []
    for (const opcId of elegidas) {
      const opc = grupo.opciones.find(o => o.id === opcId)
      if (opc) extras += Number(opc.precioExtra) || 0
    }
  }

  // Armarlo completo rebaja. Va sobre lo que sumaron las opciones y no sobre
  // el precio base, que en el desayuno es el recargo de llevar: rebajar el
  // recargo sería regalar el domicilio, no el combo.
  extras -= descuentoAplicado(producto, seleccion, extras)

  return base + extras
}

// Precio total del ítem (unitario × cantidad)
export function precioItem(item) {
  return precioUnitario(item.producto, item.seleccion) * (item.cantidad || 1)
}

// ¿El producto necesita abrir el modal (tiene opciones) o se agrega directo?
export function tieneOpciones(producto) {
  return Boolean(producto.variantes?.length || producto.gruposOpciones?.length)
}

// Valida que las elecciones cumplan min/max de cada grupo. Devuelve null si ok, o un mensaje.
/**
 * ¿Este grupo aplica, según lo que el cliente ya eligió?
 *
 * Un grupo puede traer `soloSi: { grupo, opciones }` y entonces solo cuenta
 * —se muestra y se valida— si en ese otro grupo eligió una de esas opciones.
 *
 * Sirve para preguntar en cadena, que es como se pide de verdad: "¿quieres
 * sopa?" y solo si dice que no, "¿y qué quieres en su lugar?". Sin esto hay
 * que poner todas las alternativas juntas en la misma pantalla, y el cliente
 * se encuentra siete tarjetas donde debería haber dos.
 */
export function grupoAplica(grupo, seleccion = {}) {
  const cond = grupo?.soloSi
  if (!cond?.grupo) return true
  const elegidas = seleccion.grupos?.[cond.grupo] || []
  const requeridas = cond.opciones || []
  return elegidas.some(id => requeridas.includes(id))
}

export function validarSeleccion(producto, seleccion = {}) {
  if (producto.variantes?.length && !seleccion.varianteId) {
    return 'Elige una opción'
  }
  // Un plato donde TODOS los pasos son opcionales —"arma tu desayuno: caldo,
  // huevos, bebida"— necesita al menos algo elegido, o se estaría agregando
  // un plato vacío. `minElecciones` lo pide en total, no por grupo.
  const minTotal = Number(producto.minElecciones) || 0
  if (minTotal > 0) {
    const total = Object.values(seleccion.grupos || {}).reduce((n, ids) => n + (ids?.length || 0), 0)
    if (total < minTotal) return minTotal === 1 ? 'Elige al menos una cosa' : `Elige al menos ${minTotal} cosas`
  }
  for (const grupo of producto.gruposOpciones || []) {
    // Un grupo que no aplica no se valida: pedir "elige al menos 1" de algo
    // que el cliente ni siquiera ve deja el botón bloqueado sin explicación.
    if (!grupoAplica(grupo, seleccion)) continue
    const elegidas = (seleccion.grupos?.[grupo.id]) || []
    const max = maxDelGrupo(grupo, seleccion.varianteId)
    // El mínimo nunca puede pedir más de lo que el tamaño permite elegir.
    const min = Math.min(grupo.min ?? 0, max)
    if (elegidas.length < min) return `Elige al menos ${min} en "${grupo.nombre}"`
    if (elegidas.length > max) return `Máximo ${max} en "${grupo.nombre}"`
  }
  return null
}
