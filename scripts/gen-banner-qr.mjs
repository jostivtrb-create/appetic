// 📱 Reescribe el QR del banner publicitario para que apunte al inicio de Appetic.
// Uso: node scripts/gen-banner-qr.mjs [ruta-al-banner.png ...]
//
// El banner original venía con un QR decorativo hecho por IA: parecía un QR pero
// no codificaba nada, así que ningún celular podía escanearlo. Este script lo
// tapa y dibuja uno real encima, respetando la tarjeta crema y sus márgenes.
//
// Sin argumentos procesa los banners del repo. Las medidas están tomadas sobre la
// versión de 4096px de ancho y se escalan solas al tamaño de cada archivo.
import sharp from 'sharp'
import QRCode from 'qrcode'

const URL = 'https://appetic.vercel.app'
const CREMA = { r: 0xFB, g: 0xEC, b: 0xD8, alpha: 1 }
const TINTA = '#1A1612'

const BASE_W = 4096                            // ancho de referencia de las medidas
const TARJETA = { x: 132, y: 4575, w: 839, h: 833 }  // tarjeta crema del QR
const CENTRO = { x: 553, y: 4994, lado: 606 }        // centro y lado del área de módulos
const RADIO = 70                               // radio de las esquinas redondeadas

const POR_DEFECTO = [
  'assets/brand/appetic-banner-2048.png',
  'assets/brand/appetic-banner-1024.png',
]

// El QR se dibuja sin borde: la tarjeta crema ya hace de zona de silencio.
// Nivel Q = 25% de recuperación, aguanta manchas y dobleces al imprimir.
async function qrPng(lado) {
  const svg = await QRCode.toString(URL, {
    type: 'svg', errorCorrectionLevel: 'Q', margin: 0,
    color: { dark: TINTA, light: '#FBECD8' },
  })
  return sharp(Buffer.from(svg)).resize(lado, lado, { kernel: 'nearest' }).png().toBuffer()
}

async function procesar(ruta) {
  const img = sharp(ruta)
  const { width } = await img.metadata()
  const s = width / BASE_W
  const r = v => Math.round(v * s)

  // Tapar el QR viejo sin comerse las esquinas redondeadas: dos rectángulos
  // cruzados cubren todo el interior de la tarjeta salvo los cuatro arcos.
  const pad = r(RADIO)
  const tapas = [
    { left: r(TARJETA.x) + pad, top: r(TARJETA.y), w: r(TARJETA.w) - pad * 2, h: r(TARJETA.h) },
    { left: r(TARJETA.x), top: r(TARJETA.y) + pad, w: r(TARJETA.w), h: r(TARJETA.h) - pad * 2 },
  ].map(t => ({
    input: { create: { width: t.w, height: t.h, channels: 4, background: CREMA } },
    left: t.left, top: t.top,
  }))

  const lado = r(CENTRO.lado)
  const qr = await qrPng(lado)
  const compuesto = await img
    .composite([...tapas, { input: qr, left: r(CENTRO.x) - Math.round(lado / 2), top: r(CENTRO.y) - Math.round(lado / 2) }])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()

  await sharp(compuesto).toFile(ruta)
  console.log(`✓ ${ruta} (${width}px) — QR → ${URL}`)
}

const rutas = process.argv.slice(2).length ? process.argv.slice(2) : POR_DEFECTO
for (const ruta of rutas) await procesar(ruta)
