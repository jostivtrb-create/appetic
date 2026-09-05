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
