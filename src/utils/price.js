// 🧮 Cálculo del precio de un ítem del menú según sus elecciones.
//
// Modelo de un producto (ver PLANEACION D20):
//   precio:      precio base (si no hay variantes)
//   variantes:   [{ id, nombre, precio }]            -> se elige UNA, fija el precio base
//   gruposOpciones: [{ id, nombre, tipo, min, max, opciones:[{id,nombre,precioExtra}] }]
//                  -> 'unica' (combos: elige 1) o 'multiple' (adicionales: elige varios)

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
export function validarSeleccion(producto, seleccion = {}) {
  if (producto.variantes?.length && !seleccion.varianteId) {
    return 'Elige una opción'
  }
  for (const grupo of producto.gruposOpciones || []) {
    const elegidas = (seleccion.grupos?.[grupo.id]) || []
    const min = grupo.min ?? 0
    const max = grupo.max ?? 99
    if (elegidas.length < min) return `Elige al menos ${min} en "${grupo.nombre}"`
    if (elegidas.length > max) return `Máximo ${max} en "${grupo.nombre}"`
  }
  return null
}
