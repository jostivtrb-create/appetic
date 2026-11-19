// GET /<slug>/manifest.webmanifest (vercel.json lo reescribe a /api/manifest?slug=<slug>)
//
// 📲 Cada local se instala como SU app: su nombre, su ícono, sus colores, y al abrirla entra directo
// a su menú. index.html y src/utils/instalacion.js apuntan el <link rel="manifest"> a esta dirección
// cuando se está en el link de un local.
//
// El «scope» es el link del local (/<slug>), no toda la app: Android decide si una app «ya está
// instalada» mirando si la dirección cae dentro del scope de alguna instalada. Con scope «/», el
// primer local instalado (o Appetic) tapaba a todos los demás y Chrome respondía «Ya se instaló
// esta app». Para que Cuenta, Mis pedidos y «Mi pedido» no queden por fuera (Android les pondría
// una barra con la dirección), en esa app viven bajo el link del local: src/utils/appLocal.js.
//
// Si algo falla, responde el manifest general de Appetic para que instalar nunca se rompa.
import { conAdmin } from './_lib/admin.js'
import { SLUG_OK, parametros, localPorSlug, colorDe } from './_lib/local.js'

// Espejo del manifest de vite.config.js.
const GENERAL = {
  name: 'Appetic — el menú de tu barrio', short_name: 'Appetic', lang: 'es',
  description: 'Mira el menú de tu negocio favorito del barrio y pide en segundos.',
  theme_color: '#ED7D2B', background_color: '#FFFBF4', display: 'standalone', orientation: 'portrait',
  start_url: '/', scope: '/',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

export function manifestDe(slug, l) {
  const nombre = String(l.nombre || 'Appetic').slice(0, 45)
  const fondo = colorDe(l.tema?.bg, GENERAL.background_color)
  const icono = (t, p) => ({ src: `/api/icono?slug=${slug}&t=${t}&p=${p}`, sizes: `${t}x${t}`, type: 'image/png', purpose: p })
  return {
    ...GENERAL,
    id: `/${slug}`, name: nombre,
    // Debajo del ícono caben unas 12 letras: si el nombre es largo, lo que quepa en palabras enteras.
    short_name: nombre.length > 12 ? (nombre.split(/\s+/).reduce((a, p) => ((a + ' ' + p).trim().length <= 12 ? (a + ' ' + p).trim() : a), '') || nombre.slice(0, 12)) : nombre,
    description: `Mira el menú de ${nombre} y pide en segundos.`,
    // «?app=» le dice a la app que es la de este local (src/utils/appLocal.js).
    start_url: `/${slug}?app=${slug}`, scope: `/${slug}`, theme_color: fondo, background_color: fondo,
    icons: (l.icono || l.logo)
      ? [icono(192, 'any'), icono(512, 'any'), icono(192, 'maskable'), icono(512, 'maskable')]
      : GENERAL.icons,
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
  const general = () => res.status(200).end(JSON.stringify(GENERAL))
  const { slug } = parametros(req)
  if (!SLUG_OK.test(slug)) return general()
  try {
    const f = await conAdmin(res)
    if (!f) return
    const l = await localPorSlug(f, slug)
    return l ? res.status(200).end(JSON.stringify(manifestDe(slug, l))) : general()
  } catch (e) {
    console.error('[manifest]', e)
    return general()
  }
}
