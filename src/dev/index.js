// 🧪 Registro de locales de DESARROLLO.
// Solo se usa en modo DEV para previsualizar menús sin tocar Firestore.
// Devuelve { local, productos } o null si el slug no es un local de dev.
//
// Producción: estos locales se crean de verdad con sus scripts seed-*.mjs.
// Perros Criiollos ya está sembrado en Firebase, así que se administra como local
// real (sin modo DEMO ni métricas de ejemplo); solo queda 'demo' como plantilla.
const DEV_SLUGS = ['demo']

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

  return null
}
