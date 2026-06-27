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
