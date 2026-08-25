// 💵 Formato de pesos colombianos: 12000 -> "$12.000"
export function cop(valor) {
  const n = Math.round(Number(valor) || 0)
  return '$' + n.toLocaleString('es-CO')
}

// 🏷️ Rango de precios de un producto con variantes (tamaños, gramajes…).
//
// Antes la tarjeta decía "desde $19.000" y el cliente se llevaba la sorpresa al
// abrirla y ver que la familiar valía $65.000. Devolvemos el más barato Y el más
// caro para poder mostrar el rango completo de una: "entre $19.000 - $65.000".
//
// `rango` es false cuando no hay nada que comparar (precio fijo, una sola variante
// o todas al mismo precio): ahí se muestra el precio solo, sin "entre".
export function rangoPrecio(producto) {
  const precios = (producto?.variantes || [])
    .map(v => Number(v.precio) || 0)
    .filter(n => n > 0)
  if (!precios.length) {
    const fijo = Number(producto?.precio) || 0
    return { min: fijo, max: fijo, rango: false }
  }
  const min = Math.min(...precios)
  const max = Math.max(...precios)
  return { min, max, rango: max > min }
}

// Texto listo del rango: "entre $19.000 - $65.000" o "$26.000" si no hay rango.
export function copRango(min, max) {
  return max > min ? `entre ${cop(min)} - ${cop(max)}` : cop(min)
}
