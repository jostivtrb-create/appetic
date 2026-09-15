import { ofertaAplicada } from './price'

// 📝 Resume las elecciones de un ítem en texto legible.
// Ej: "Doble carne · Queso extra, Tocineta"
// Si una oferta le aplicó, va primero: "Combo Costilla · Caldo de costilla, …"
export function resumenSeleccion(producto, seleccion = {}) {
  const partes = []

  const oferta = ofertaAplicada(producto, seleccion)
  if (oferta?.oferta?.nombre) partes.push(oferta.oferta.nombre)

  if (producto.variantes?.length && seleccion.varianteId) {
    const v = producto.variantes.find(x => x.id === seleccion.varianteId)
    if (v) partes.push(v.nombre)
  }

  const grupos = seleccion.grupos || {}
  for (const grupo of producto.gruposOpciones || []) {
    const elegidas = grupos[grupo.id] || []
    const nombres = elegidas
      .map(id => grupo.opciones.find(o => o.id === id)?.nombre)
      .filter(Boolean)
    if (nombres.length) partes.push(nombres.join(', '))
  }

  return partes.join(' · ')
}
