// GET /api/icono?slug=<slug>&t=<180|192|512>&p=<any|maskable|apple> — el ícono de la app de un local.
//
// Sale del ícono cuadrado del local (o de su logo, si no tiene), que el dueño sube desde su panel:
//   • any      → el ícono completo, con fondo transparente (escritorio, pantalla de apertura).
//   • maskable → Android recorta el ícono con su forma (círculo, gota…): va centrado, dentro de la
//                zona segura, sobre un fondo liso para que no lo corte ni le deje esquinas blancas.
//   • apple    → iPhone no admite transparencia (la pinta de negro): también sobre fondo liso.
// El fondo liso es el del propio ícono si ya trae uno (así no se ve un cuadro dentro de otro); si es
// transparente, el color de fondo del local.
// Si algo falla, manda al ícono general de Appetic para que instalar nunca se rompa.
import { conAdmin } from './_lib/admin.js'
import { SLUG_OK, parametros, localPorSlug, colorDe } from './_lib/local.js'

const GENERAL = { any: '/icons/icon-512.png', maskable: '/icons/icon-maskable.png', apple: '/icons/apple-touch-icon.png' }
// Cuánto del lado ocupa el ícono. La zona segura de un maskable es un círculo del 80%.
const OCUPA = { any: 1, maskable: 0.76, apple: 0.84 }
// De dónde se acepta la imagen: de la propia app o del almacenamiento de Firebase (panel del local).
const ORIGENES = ['firebasestorage.googleapis.com', 'storage.googleapis.com']
const PESO_MAX = 8 * 1024 * 1024

export default async function handler(req, res) {
  const { slug, t: tam, p: uso } = parametros(req)
  const p = OCUPA[uso] ? uso : 'any'
  const t = [180, 192, 512].includes(Number(tam)) ? Number(tam) : 512
  const general = () => { res.statusCode = 302; res.setHeader('Location', GENERAL[p]); res.end() }
  if (!SLUG_OK.test(slug)) return general()
  try {
    const f = await conAdmin(res)
    if (!f) return
    const l = await localPorSlug(f, slug)
    const origen = l?.icono || l?.logo
    if (!origen) return general()

    const host = String(req.headers.host || '')
    const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host)
    const url = new URL(origen, `${local ? 'http' : 'https'}://${host}`)
    if (url.host !== host && !(url.protocol === 'https:' && ORIGENES.includes(url.hostname))) return general()
    const r = await fetch(url)
    if (!r.ok) return general()
    const bytes = Buffer.from(await r.arrayBuffer())
    if (bytes.length > PESO_MAX) return general()

    const { default: sharp } = await import('sharp')
    const transparente = { r: 0, g: 0, b: 0, alpha: 0 }
    const encajar = (lado) => sharp(bytes).resize(lado, lado, { fit: 'contain', background: transparente }).ensureAlpha()

    // ¿El ícono ya trae fondo? Se mira en pequeño el centro de sus cuatro bordes (las esquinas no
    // sirven: muchos íconos las traen redondeadas).
    const M = 64
    const mini = await encajar(M).raw().toBuffer()
    const px = (x, y) => { const i = (y * M + x) * 4; return { r: mini[i], g: mini[i + 1], b: mini[i + 2], a: mini[i + 3] } }
    const bordes = [px(M / 2, 1), px(M / 2, M - 2), px(1, M / 2), px(M - 2, M / 2)]
    const conFondo = bordes.every(c => c.a > 250)

    // Un ícono con fondo propio llena el cuadro del iPhone (que no recorta más que las esquinas).
    const ocupa = p === 'apple' && conFondo ? 1 : OCUPA[p]
    const dibujo = await encajar(Math.round(t * ocupa)).png().toBuffer()
    let png = dibujo
    if (p !== 'any') {
      // …si es liso (los cuatro bordes del mismo color). Con un fondo dibujado (textura, marco) no hay
      // un color que lo continúe: va el del local.
      const liso = conFondo && ['r', 'g', 'b'].every(k => Math.max(...bordes.map(c => c[k])) - Math.min(...bordes.map(c => c[k])) < 24)
      const fondo = liso ? { r: bordes[0].r, g: bordes[0].g, b: bordes[0].b, alpha: 1 } : colorDe(l.tema?.bg, '#FFFBF4')
      png = await sharp({ create: { width: t, height: t, channels: 4, background: fondo } })
        .composite([{ input: dibujo, gravity: 'center' }]).png().toBuffer()
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'image/png')
    // El navegador lo guarda una hora; Vercel lo sirve de su caché un día y lo rehace en segundo plano.
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
    return res.end(png)
  } catch (e) {
    console.error('[icono]', e)
    return general()
  }
}
