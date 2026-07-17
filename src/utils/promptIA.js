// 🎨 Constructor del PROMPT (en inglés) para generar la foto de un producto/opción con IA,
// foto-realista y a tono con los colores del local.
//
// La RECETA de este prompt vive y se mantiene en la skill /Agregar_Menu
// (references/prompt_ia_panel.md). Esto es su implementación en tiempo de ejecución:
// funciona para CUALQUIER producto que el dueño cree desde el panel, leyendo su
// nombre/descripción + los colores (tema) de su local.

// hex → nombre aproximado del color (por tono), para describirlo en el prompt.
function nombreColor(hex) {
  const m = (hex || '').replace('#', '')
  if (m.length < 6) return null
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2 / 255
  if (max - min < 25) return l > 0.7 ? 'clean white' : l < 0.25 ? 'deep charcoal' : 'soft grey'
  const d = max - min
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  if (h < 15 || h >= 345) return 'warm red'
  if (h < 45) return 'warm orange ember'
  if (h < 70) return 'golden yellow'
  if (h < 160) return 'fresh green'
  if (h < 200) return 'teal'
  if (h < 255) return 'blue'
  if (h < 290) return 'violet'
  return 'magenta pink'
}

// ¿El fondo del local es oscuro? (luminancia percibida)
function esOscuro(hex) {
  const m = (hex || '').replace('#', '')
  if (m.length < 6) return false
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}

// Frase de fondo/mood a tono con la paleta del local.
function moodDelLocal(local) {
  const tema = local?.tema || {}
  const primaria = nombreColor(tema.primary) || 'warm'
  const acento = nombreColor(tema.accent) || primaria
  return esOscuro(tema.bg)
    ? `moody dark background with subtle ${primaria} and ${acento} tones that match the brand palette`
    : `clean bright background with subtle ${primaria} accents that match the brand palette`
}

/**
 * Construye el prompt en inglés para generar la foto con IA.
 * @param {{nombre:string, descripcion?:string, tipo?:'producto'|'opcion', local:object}} args
 * @returns {string} prompt listo para pegar en Gemini
 */
export function construirPromptImagenIA({ nombre, descripcion = '', tipo = 'producto', local }) {
  const n = (nombre || '').trim()
  const desc = descripcion.trim() ? ` — ${descripcion.trim()}` : ''
  const fondo = moodDelLocal(local)

  if (tipo === 'opcion') {
    // Topping / salsa / adición: primer plano de un solo ingrediente.
    return `Photorealistic professional close-up food photography of "${n}"${desc}, a single fresh ingredient or topping, appetizing, vibrant colors, soft natural lighting, shallow depth of field, high detail, sharp focus, ${fondo}, centered, square composition, no text, no watermark, no logo, no hands.`
  }
  // Plato / bebida principal.
  return `Photorealistic professional food photography of "${n}"${desc}, freshly made, appetizing and mouth-watering, natural soft lighting, shallow depth of field, high detail, sharp focus, ${fondo}, centered on a clean serving surface, square composition, no text, no watermark, no logo, no hands.`
}
