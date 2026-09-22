// 🧪 Registro de locales de DESARROLLO.
// Solo se usa en modo DEV para previsualizar menús sin tocar Firestore.
// Devuelve { local, productos } o null si el slug no es un local de dev.
//
// Producción: estos locales se crean de verdad con sus scripts seed-*.mjs.
// Perros Criiollos ya está sembrado en Firebase, así que se administra como local
// real (sin modo DEMO ni métricas de ejemplo); solo queda 'demo' como plantilla.
const DEV_SLUGS = ['demo']

// ¿Este slug es un local de previsualización en DEV? (síncrono, para decidir modo)
// El ?preview=1 —el mismo que ya abre el MENÚ desde el código— también vale aquí:
// así se puede revisar el PANEL de cualquier local armado en src/dev sin sembrarlo
// ni iniciar sesión. Igual que el modo demo, no escribe nada en Firestore, y va
// atado a DEV para que no exista en producción.
export function isDevSlug(slug) {
  if (!import.meta.env.DEV) return false
  if (DEV_SLUGS.includes(slug)) return true
  return new URLSearchParams(window.location.search).has('preview')
}

export async function getDevLocal(slug) {
  if (!import.meta.env.DEV) return null

  if (slug === 'demo') {
    const { MOCK_LOCAL, MOCK_PRODUCTOS } = await import('./mockLocal')
    return { local: MOCK_LOCAL, productos: MOCK_PRODUCTOS }
  }

  // Los demás locales de src/dev los arma la vista previa (fuente única).
  const { getPreviewLocal } = await import('../preview')
  return getPreviewLocal(slug)
}
