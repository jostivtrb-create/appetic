// 😋 "Para antojarte" — resumen de los platos FUERTES de un local para el INICIO.
//
// El inicio NO puede leer los productos de cada local (serían N lecturas por visitante):
// este mini-resumen se guarda DENTRO del doc del local (campo `destacadosHome`) y se
// recalcula solo en dos momentos:
//   • al correr el seed del local (scripts/seed-*.mjs), y
//   • cada vez que el dueño guarda/borra un producto en su panel (AdminPage).
// Así el inicio cuesta 1 sola lectura y se mantiene actualizado sin backend.
//
// Reglas: solo productos marcados "Nuestro fuerte" (destacado), CON foto y disponibles
// (sin foto no antoja). Máximo 6 guardados; el inicio muestra 2 por local y los rota a diario.
// Es JS plano (sin imports): lo usan el navegador (panel) y Node (seeds) por igual.

const MAX_GUARDADOS = 6

// Precio del producto para el resumen: el fijo, o el RANGO de sus variantes.
// Guardamos el menor y el mayor para que el inicio pueda decir "$19.000 - $65.000"
// en vez del viejo "desde $19.000", que escondía hasta dónde llegaba el plato.
// `desde` se mantiene por los resúmenes VIEJOS ya guardados en Firestore, que no
// traen precioMax: ahí el inicio sigue mostrando "desde" hasta que el dueño vuelva
// a guardar el producto (o se re-corra el seed) y se recalcule este resumen.
function precioDesde(p) {
  if (p?.variantes?.length) {
    const precios = p.variantes.map(v => Number(v.precio) || 0).filter(n => n > 0)
    if (precios.length) {
      const min = Math.min(...precios)
      const max = Math.max(...precios)
      return { precio: min, precioMax: max, desde: max > min }
    }
  }
  const fijo = Number(p?.precio) || 0
  return { precio: fijo, precioMax: fijo, desde: false }
}

export function computeDestacadosHome(productos = []) {
  return productos
    .filter(p => p && p.destacado && p.foto && p.disponible !== false)
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
    .slice(0, MAX_GUARDADOS)
    .map(p => {
      const { precio, precioMax, desde } = precioDesde(p)
      return { id: p.id, nombre: p.nombre || '', foto: p.foto, precio, precioMax, desde }
    })
}
