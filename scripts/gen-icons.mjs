// 🎨 Genera los íconos de la PWA en los tamaños correctos a partir del logo.
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp'

const SRC = 'assets/brand/appetic-logo.png'
const OUT = 'public/icons'
const TRANSP = { r: 0, g: 0, b: 0, alpha: 0 }
const NARANJA = { r: 0xE8, g: 0x73, b: 0x2B, alpha: 1 } // fondo para íconos sin transparencia

async function main() {
  // --- "any": logo con su transparencia (se ve el mordisco) ---
  await sharp(SRC).resize(192, 192, { fit: 'contain', background: TRANSP }).png().toFile(`${OUT}/icon-192.png`)
  await sharp(SRC).resize(512, 512, { fit: 'contain', background: TRANSP }).png().toFile(`${OUT}/icon-512.png`)
  await sharp(SRC).resize(64, 64, { fit: 'contain', background: TRANSP }).png().toFile(`${OUT}/favicon.png`)

  // --- maskable: logo dentro de la "safe zone" (80%) sobre fondo naranja ---
  const logo80 = await sharp(SRC).resize(410, 410, { fit: 'contain', background: TRANSP }).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: NARANJA } })
    .composite([{ input: logo80, gravity: 'center' }])
    .png().toFile(`${OUT}/icon-maskable.png`)

  // --- apple-touch (iOS no maneja transparencia): logo a sangre sobre naranja ---
  await sharp(SRC).resize(180, 180, { fit: 'cover' }).flatten({ background: NARANJA }).png().toFile(`${OUT}/apple-touch-icon.png`)

  console.log('✓ Íconos generados en', OUT)
}

main().catch(e => { console.error(e); process.exit(1) })
