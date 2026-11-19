// 🏪 Lo que comparten api/manifest.js y api/icono.js: encontrar el local por su link y sus colores.

export const SLUG_OK = /^[a-z0-9-]{2,60}$/

// El slug llega como ?slug= (en Vercel ya viene en req.query; en local se lee de la dirección).
export function parametros(req) {
  const q = new URL(req.url || '/', 'http://x').searchParams
  const de = k => String(req.query?.[k] ?? q.get(k) ?? '')
  return { slug: de('slug').toLowerCase(), t: de('t'), p: de('p') }
}

export async function localPorSlug(f, slug) {
  const s = await f.getFirestore().collection('locales').where('slug', '==', slug).limit(1).get()
  return s.empty ? null : s.docs[0].data()
}

export const colorDe = (v, respaldo) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : respaldo)
