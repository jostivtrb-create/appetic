// 📦 Productos de un local en Firestore: locales/{localId}/productos
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Trae los productos de un local, con CACHÉ por versión (cuida costos D32).
 * Si `version` coincide con lo guardado en el dispositivo, NO vuelve a leer
 * Firestore (0 lecturas). Solo lee cuando el menú cambió o no hay caché.
 *
 * @param {string} localId
 * @param {number|undefined} version  local.menuVersion (sube cuando el dueño edita)
 */
export async function getProductos(localId, version) {
  const cacheKey = `appetic_menu_${localId}`

  // 1) Intentar caché si nos dieron una versión para comparar.
  if (version != null) {
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        const c = JSON.parse(raw)
        if (c && c.version === version && Array.isArray(c.productos)) {
          return c.productos
        }
      }
    } catch { /* caché corrupta: seguimos a leer */ }
  }

  // 2) Leer de Firestore y ordenar en JS (NO con orderBy de Firestore).
  // orderBy('orden') OMITE los documentos que no tienen el campo `orden`: un
  // producto agregado sin ese campo "desaparecería" del menú al recargar. Al
  // ordenar aquí, los que tengan `orden` van por su valor y los que no, al
  // final — pero SIEMPRE aparecen.
  const col = collection(db, 'locales', localId, 'productos')
  const snap = await getDocs(col)
  const productos = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity))

  // 3) Guardar en caché con la versión.
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ version: version ?? null, productos }))
  } catch { /* sin espacio: no pasa nada */ }

  return productos
}
