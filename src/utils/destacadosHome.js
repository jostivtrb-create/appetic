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

// Precio "desde" del producto: el fijo, o el menor de sus variantes.
function precioDesde(p) {
  if (p?.variantes?.length) {
    const precios = p.variantes.map(v => Number(v.precio) || 0).filter(n => n > 0)
    if (precios.length) return { precio: Math.min(...precios), desde: true }
  }
  return { precio: Number(p?.precio) || 0, desde: false }
}

export function computeDestacadosHome(productos = []) {
  return productos
    .filter(p => p && p.destacado && p.foto && p.disponible !== false)
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
    .slice(0, MAX_GUARDADOS)
    .map(p => {
      const { precio, desde } = precioDesde(p)
      return { id: p.id, nombre: p.nombre || '', foto: p.foto, precio, desde }
    })
}
