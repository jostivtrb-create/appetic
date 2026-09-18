import { estaCompleto } from './price'

// 📝 Resume las elecciones de un ítem en texto legible.
// Ej: "Doble carne · Queso extra, Tocineta"
// Si se armó completo y eso le rebajó, va primero: "Completo · Caldo de
// costilla, Huevos fritos, …". Antes aquí iba el nombre de la oferta que le
// caía ("Combo Costilla"); las ofertas se reemplazaron por un descuento único
// y ya no hay nombre que poner, solo el hecho de que lo armó entero.
export function resumenSeleccion(producto, seleccion = {}) {
  const partes = []

  if (Number(producto?.descuentoCompleto) > 0 && estaCompleto(producto, seleccion)) {
    partes.push('Completo')
  }

  if (producto.variantes?.length && seleccion.varianteId) {
    const v = producto.variantes.find(x => x.id === seleccion.varianteId)
    if (v) partes.push(v.nombre)
  }

  const grupos = seleccion.grupos || {}
  const noLleva = seleccion.noLleva || {}
  for (const grupo of producto.gruposOpciones || []) {
    const elegidas = grupos[grupo.id] || []
    const nombres = elegidas
      .map(id => grupo.opciones.find(o => o.id === id)?.nombre)
      .filter(Boolean)
    // ⊘ Lo que NO quiere que le pongan va DICHO, no callado: un renglón que
    // falta no se distingue de uno que se perdió, y en la duda lo preparan.
    //
    // Se nombra el PASO y no la opción. Con "no lo lleva" se deja escogida la
    // más barata para poder cobrar, pero el cliente no la escogió: escribir
    // "Chocolate (NO LO LLEVA)" le atribuye una decisión que no tomó, y a quien
    // lo lee en el local le hace pensar que pidió chocolate.
    if (nombres.length) {
      partes.push(noLleva[grupo.id]
        ? `SIN ${(grupo.nombre || 'esto').toLowerCase()}`
        : nombres.join(', '))
    }
  }

  return partes.join(' · ')
}
