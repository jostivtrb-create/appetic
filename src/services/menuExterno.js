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
 * El menú de un local externo: `{ productos, avisoVacio }`.
 *
 * `avisoVacio` es lo que se le enseña al cliente cuando no hay productos, con
 * las palabras de ese negocio. Va aparte porque una lista vacía no explica
 * nada por sí sola, y una pantalla en blanco parece una app rota.
 *
 * Nunca lanza: si algo falla, el cliente ve un aviso en vez de una página
 * caída, y el detalle queda en la consola.
 */
export async function getMenuExterno(fuente, local = null) {
  try {
    if (fuente === 'la-gran-esquina') {
      const { getMenuLaGranEsquina } = await import('./menuLaGranEsquina')
      // Las fotos sí son de Appetic (ver `fotosExternas` en el doc del local).
      return await getMenuLaGranEsquina({ fotos: local?.fotosExternas })
    }
    console.warn('[menuExterno] fuente desconocida:', fuente)
    return { productos: [], avisoVacio: null }
  } catch (err) {
    console.error('[menuExterno] no se pudo leer el menú de', fuente, err)
    return {
      productos: [],
      avisoVacio: {
        emoji: '📡',
        titulo: 'No pudimos cargar el menú',
        detalle: 'Revisa tu conexión e inténtalo de nuevo.',
      },
    }
  }
}

/**
 * Todo lo que puede llevar foto en un menú externo, para el panel del dueño.
 * Secciones `{ id, titulo, items: [{ clave, nombre, detalle, tipo, apagado }] }`;
 * la `clave` es con la que la foto se guarda en `local.fotosExternas`.
 */
export async function getCatalogoFotosExterno(fuente) {
  if (fuente === 'la-gran-esquina') {
    const { getCatalogoFotosLaGranEsquina } = await import('./menuLaGranEsquina')
    return await getCatalogoFotosLaGranEsquina()
  }
  console.warn('[menuExterno] fuente desconocida:', fuente)
  return []
}
