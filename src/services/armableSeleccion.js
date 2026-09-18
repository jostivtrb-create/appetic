// 🍳 Lo que el cliente escogió en un armable, dicho como lo espera la caja.
//
// Vive aparte de `pedidoLaGranEsquina.js` por una razón práctica: aquí no se
// importa nada —ni Firestore ni navegador— y eso es lo que deja comprobar el
// contrato con un `node prueba-appetic.mjs` a secas. El resto de ese archivo sí
// habla con Firebase, y arrastrarlo a una prueba costaba más que separarlo.
//
// El contrato de vuelta, en la línea `kind: 'combo'` de `customerOrders`:
//
//   comboSeleccion: { [grupoId]: opcionId }      — un id por grupo
//   comboItems:     [{ productId, productName, qty }]
//   comboNoLleva:   { [grupoId]: true } | null   — lo que escogió y NO quiere
//
// ── Por qué "no lo lleva" se MANDA en vez de callarse ──
//
// El que no quiere chocolate paga lo mismo: el desayuno vale igual. Aun así se
// manda cuál era y que no lo lleva, por tres razones que en el local ya
// costaron caro:
//
//   1. el precio queda exacto — la bebida puede ser un chocolate de $3.000 o
//      un jugo de $5.000, y no es lo mismo;
//   2. la cocinera lee "Chocolate — NO LO LLEVA" en vez de adivinar. Si el
//      renglón simplemente no apareciera, no sabría si el cliente no lo pidió
//      o si la app se lo comió, y en la duda lo prepara;
//   3. el inventario no descuenta algo que sigue en la olla.

/**
 * Traduce la selección de un armable a lo que viaja al local.
 *
 * Solo se marca "no lo lleva" sobre grupos donde de verdad escogió algo: una
 * marca sobre un grupo vacío no significa nada y la caja no sabría a qué
 * referirla.
 */
export function seleccionDelArmable(producto, seleccion) {
  const elegidoPorGrupo = seleccion?.grupos || {}
  const marcadoNoLleva = seleccion?.noLleva || {}
  const comboSeleccion = {}
  const comboItems = []
  const comboNoLleva = {}

  for (const grupo of producto?.gruposOpciones || []) {
    const id = (elegidoPorGrupo[grupo.id] || [])[0]
    if (!id) continue
    const opcion = (grupo.opciones || []).find(o => o.id === id)
    if (!opcion) continue
    comboSeleccion[grupo.id] = opcion.id
    if (marcadoNoLleva[grupo.id]) comboNoLleva[grupo.id] = true
    comboItems.push({
      productId: opcion.lgeProductId || null,
      productName: opcion.lgeProductName || opcion.nombre,
      qty: opcion.lgeQty || 1,
    })
  }

  return {
    comboSeleccion,
    comboItems,
    // null y no {} : es lo que el saneador de allá espera cuando no hay nada
    // marcado, que es el caso normal.
    comboNoLleva: Object.keys(comboNoLleva).length > 0 ? comboNoLleva : null,
  }
}
