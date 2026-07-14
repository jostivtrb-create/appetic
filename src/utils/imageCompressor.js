// 🗜️ Comprime una imagen en el navegador antes de subirla (cuida costos de Storage).
// Redimensiona al lado máximo indicado y exporta en WebP (o JPEG de respaldo).
//
// Cargamos la imagen con URL.createObjectURL (no con FileReader.readAsDataURL):
// leer el archivo como base64 duplica su peso en memoria y en celulares con poca
// RAM o fotos grandes falla con un ProgressEvent ("[object ProgressEvent]").
// createObjectURL es liviano —es el mismo método de la vista previa, que sí
// funciona— así que subir la foto deja de fallar por memoria.
export async function comprimirImagen(file, { maxLado = 1000, calidad = 0.72 } = {}) {
  const img = await cargarImagen(file)

  let width = img.naturalWidth || img.width
  let height = img.naturalHeight || img.height
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
  const blob = await new Promise((res, rej) => canvas.toBlob(
    b => (b ? res(b) : rej(new Error('La imagen no se pudo procesar. Prueba con otra foto (JPG o PNG).'))),
    tipo,
    calidad,
  ))
  return { blob, tipo, ext: tipo === 'image/webp' ? 'webp' : 'jpg' }
}

function cargarImagen(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); res(img) }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      rej(new Error('No se pudo leer la imagen. Prueba con otra foto o formato (JPG o PNG).'))
    }
    img.src = url
  })
}
