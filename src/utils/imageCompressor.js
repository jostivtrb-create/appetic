// 🗜️ Comprime una imagen en el navegador antes de subirla (cuida costos de Storage).
// Redimensiona al lado máximo indicado y exporta en WebP (o JPEG de respaldo).
export async function comprimirImagen(file, { maxLado = 1000, calidad = 0.72 } = {}) {
  const dataUrl = await leerArchivo(file)
  const img = await cargarImagen(dataUrl)

  let { width, height } = img
  if (width > height && width > maxLado) {
    height = Math.round((height * maxLado) / width)
    width = maxLado
  } else if (height > maxLado) {
    width = Math.round((width * maxLado) / height)
    height = maxLado
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  const tipo = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
  const blob = await new Promise((res) => canvas.toBlob(res, tipo, calidad))
  return { blob, tipo, ext: tipo === 'image/webp' ? 'webp' : 'jpg' }
}

function leerArchivo(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function cargarImagen(src) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}
