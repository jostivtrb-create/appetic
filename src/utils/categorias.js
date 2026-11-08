// 🗂️ CATEGORÍAS DEL MENÚ: pausa a mano y horario (guía «Editar el catálogo» D8, D12, S16).
// Sin Firebase: lo usan el panel, el menú del cliente, el Menú en Pantalla, la Caja y el servidor.
//
//   local.categorias = [{ id, nombre, emoji, pausada?: true, horario?: { dias: ['lun',…], de: 'HH:MM', a: 'HH:MM' } }]
//
// • `pausada`: el dueño la apagó con el interruptor. No se vende hasta que la vuelva a prender.
// • `horario`: solo se vende esos días y entre esas horas (hora de Colombia). Sin días marcados =
//   todos los días. Si `de` > `a` cruza la medianoche (18:00 → 02:00).
import { aMinutos, diaBogota, minutosAhoraBogota } from './horario.js'

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/
export const DIAS_CAT = [
  { id: 'lun', corto: 'L' }, { id: 'mar', corto: 'M' }, { id: 'mie', corto: 'X' }, { id: 'jue', corto: 'J' },
  { id: 'vie', corto: 'V' }, { id: 'sab', corto: 'S' }, { id: 'dom', corto: 'D' },
]
const NOMBRE_DIA = { lun: 'lunes', mar: 'martes', mie: 'miércoles', jue: 'jueves', vie: 'viernes', sab: 'sábado', dom: 'domingo' }

export const horarioValido = h => !!h && HORA.test(h.de) && HORA.test(h.a) && h.de !== h.a

// ¿Se vende ahora? `ahora` permite probar: { dia: 'lun', minutos: 600 }.
export function categoriaActiva(cat, ahora = null) {
  if (!cat) return true
  if (cat.pausada) return false
  const h = cat.horario
  if (!horarioValido(h)) return true
  const min = ahora?.minutos ?? minutosAhoraBogota()
  const de = aMinutos(h.de), a = aMinutos(h.a)
  const dias = Array.isArray(h.dias) && h.dias.length ? new Set(h.dias) : null
  // Cruza medianoche y estamos en la madrugada: la franja empezó «ayer».
  const madrugada = de > a && min < a
  const dia = ahora?.dia ?? diaBogota(madrugada ? -1 : 0)
  if (dias && !dias.has(dia)) return false
  return de < a ? (min >= de && min < a) : (min >= de || min < a)
}

// Ids de las categorías que NO se venden ahora (para filtrar productos de una vez).
export function categoriasApagadas(local, ahora = null) {
  return new Set((local?.categorias || []).filter(c => !categoriaActiva(c, ahora)).map(c => c.id))
}

// Texto corto para el panel: «Pausada», «L a V · 6:00 a. m. – 11:00 a. m.», o ''.
export function textoHorarioCat(cat) {
  if (cat?.pausada) return 'Pausada'
  const h = cat?.horario
  if (!horarioValido(h)) return ''
  const hora = t => { const [hh, mm] = t.split(':').map(Number); const p = hh < 12 ? 'a. m.' : 'p. m.'; return `${hh % 12 || 12}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${p}` }
  const dias = Array.isArray(h.dias) && h.dias.length && h.dias.length < 7
    ? (h.dias.length === 1 ? NOMBRE_DIA[h.dias[0]] : DIAS_CAT.filter(d => h.dias.includes(d.id)).map(d => d.corto).join(' '))
    : 'Todos los días'
  return `${dias} · ${hora(h.de)} – ${hora(h.a)}`
}

// Id ascii desde el nombre, sin repetir los que ya existen.
export function idCategoriaNueva(nombre, existentes) {
  const base = String(nombre || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'cat'
  const usados = new Set((existentes || []).map(c => c.id))
  let id = base, n = 2
  while (usados.has(id)) id = `${base}-${n++}`
  return id
}

// Íconos para escoger (S10): comida y bebida, los más usados en un restaurante colombiano.
export const ICONOS_CAT = [
  '🍔', '🍕', '🌭', '🌮', '🌯', '🥪', '🍟', '🍗', '🍖', '🥩', '🥓', '🍤',
  '🍣', '🍜', '🍝', '🥘', '🍲', '🍛', '🥗', '🥙', '🫓', '🥟', '🧆', '🌽',
  '🥔', '🍳', '🥞', '🧇', '🥐', '🍞', '🧀', '🥚', '🍰', '🎂', '🧁', '🍩',
  '🍪', '🍦', '🍨', '🍫', '🍓', '🍉', '🍍', '🥭', '🍹', '🥤', '🧃', '☕',
  '🍺', '🍷', '🥛', '🧋', '⭐', '🔥', '👶', '🎉',
]
