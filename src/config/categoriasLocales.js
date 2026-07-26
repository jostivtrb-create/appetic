// 🗂️ Catálogo CURADO de categorías de locales (los chips del inicio).
// Es la fuente única: el inicio, el superadmin (selector de etiquetas) y la skill
// /Agregar_Menu leen de aquí. Cada local lleva `etiquetas: ['id', ...]` (1–3 idealmente).
//
// ⚠️ Curado a propósito (decisión de producto): agregar una categoría nueva es añadir
// UNA línea aquí — así los chips se mantienen consistentes (sin duplicados ni emojis
// dispares). El inicio solo muestra las categorías que tengan al menos un local activo,
// o sea que las que aún no se usan no estorban.
export const CATEGORIAS_LOCALES = [
  { id: 'comida-rapida', nombre: 'Comida rápida', emoji: '⚡' },
  { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔' },
  { id: 'perros', nombre: 'Perros y salchipapas', emoji: '🌭' },
  { id: 'pizza', nombre: 'Pizza', emoji: '🍕' },
  { id: 'almuerzos', nombre: 'Almuerzos', emoji: '🍛' },
  { id: 'pollo', nombre: 'Pollo y alitas', emoji: '🐔' },
  { id: 'asados', nombre: 'Asados y parrilla', emoji: '🥩' },
  { id: 'mexicana', nombre: 'Mexicana', emoji: '🌮' },
  { id: 'postres', nombre: 'Postres y helados', emoji: '🍨' },
  { id: 'pasabocas', nombre: 'Empanadas y pasabocas', emoji: '🥟' },
  { id: 'bebidas', nombre: 'Bebidas y jugos', emoji: '🧃' },
  { id: 'cafe', nombre: 'Café y desayunos', emoji: '☕' },
]

// Búsqueda rápida por id (para pintar chips de un local, validar etiquetas, etc.)
export function categoriaLocalPorId(id) {
  return CATEGORIAS_LOCALES.find(c => c.id === id) || null
}
