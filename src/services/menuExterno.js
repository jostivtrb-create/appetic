// 🔗 Locales cuyo menú no vive en Appetic.
//
// Casi todos los locales guardan su carta aquí y el dueño la edita desde su
// panel. Pero alguno ya tiene su propio sistema —caja, cocina, inventario— y
// publica el menú allá cada mañana. Pedirle que lo escriba dos veces sería
// pedirle que se equivoque: tarde o temprano una de las dos copias queda vieja,
// y la que queda vieja es siempre la que ve el cliente.
//
// Estos locales traen `menuExterno: '<fuente>'` en su ficha, y aquí se decide
// de dónde sale su menú. El resto de Appetic no se entera: recibe la misma
// lista de productos de siempre.

/**
 * El menú de un local externo. Devuelve [] si la fuente no se reconoce o si
 * falla la lectura — un menú vacío se explica solo en pantalla, mientras que
 * un error rompe la página entera.
 */
export async function getMenuExterno(fuente) {
  try {
    if (fuente === 'la-gran-esquina') {
      const { getMenuLaGranEsquina } = await import('./menuLaGranEsquina')
      return await getMenuLaGranEsquina()
    }
    console.warn('[menuExterno] fuente desconocida:', fuente)
    return []
  } catch (err) {
    console.error('[menuExterno] no se pudo leer el menú de', fuente, err)
    return []
  }
}
