import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase'
import { comprimirImagen } from '../utils/imageCompressor'

// 📷 Sube la foto de un producto (comprimida) y devuelve su URL pública.
export async function subirFotoProducto(localId, productoId, file) {
  const { blob, tipo, ext } = await comprimirImagen(file)
  const ruta = `locales/${localId}/productos/${productoId}.${ext}`
  const r = ref(storage, ruta)
  await uploadBytes(r, blob, { contentType: tipo })
  return await getDownloadURL(r)
}

// 🖼️ Sube el BANNER del local (horizontal, se comprime más ancho) y devuelve su URL.
export async function subirBanner(localId, file) {
  const { blob, tipo, ext } = await comprimirImagen(file, { maxLado: 1400 })
  const ruta = `locales/${localId}/banner.${ext}`
  const r = ref(storage, ruta)
  await uploadBytes(r, blob, { contentType: tipo })
  return await getDownloadURL(r)
}

// 🧀 Sube la foto de una OPCIÓN (topping/salsa) de un grupo y devuelve su URL.
// Misma carpeta del local (locales/{localId}/...), subcarpeta opciones/.
export async function subirFotoOpcion(localId, grupoId, opcId, file) {
  const { blob, tipo, ext } = await comprimirImagen(file)
  const ruta = `locales/${localId}/opciones/${grupoId}-${opcId}.${ext}`
  const r = ref(storage, ruta)
  await uploadBytes(r, blob, { contentType: tipo })
  return await getDownloadURL(r)
}

// 🔗 Sube la foto de un plato u opción de un MENÚ EXTERNO (el menú no vive en
// Appetic, pero sus fotos sí). `clave` es la misma con la que se guarda en
// `local.fotosExternas` ("combo-<id>", "opcion-<id>"…).
export async function subirFotoExterna(localId, clave, file) {
  const { blob, tipo, ext } = await comprimirImagen(file)
  const ruta = `locales/${localId}/externas/${clave}.${ext}`
  const r = ref(storage, ruta)
  await uploadBytes(r, blob, { contentType: tipo })
  return await getDownloadURL(r)
}
