// 🧪 Registro de locales de DESARROLLO.
// Solo se usa en modo DEV para previsualizar menús sin tocar Firestore.
// Devuelve { local, productos } o null si el slug no es un local de dev.
//
// Producción: estos locales se crean de verdad con sus scripts seed-*.mjs.
const DEV_SLUGS = ['demo', 'perros-criollos']

// ¿Este slug es un local de previsualización en DEV? (síncrono, para decidir modo)
export function isDevSlug(slug) {
  return import.meta.env.DEV && DEV_SLUGS.includes(slug)
}

export async function getDevLocal(slug) {
  if (!import.meta.env.DEV) return null

  if (slug === 'demo') {
    const { MOCK_LOCAL, MOCK_PRODUCTOS } = await import('./mockLocal')
    return { local: MOCK_LOCAL, productos: MOCK_PRODUCTOS }
  }

  if (slug === 'perros-criollos') {
    const { PERROS_LOCAL, PERROS_PRODUCTOS } = await import('./perrosCriollos')
    return { local: PERROS_LOCAL, productos: PERROS_PRODUCTOS }
  }

  return null
}
