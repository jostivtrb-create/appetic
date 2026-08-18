// 🎨 Constructor del PROMPT (en inglés) para generar la foto de un producto/opción con IA,
// foto-realista y a tono con los colores del local.
//
// La RECETA de este prompt vive y se mantiene en la skill /Agregar_Menu
// (references/prompt_ia_panel.md). Esto es su implementación en tiempo de ejecución:
// funciona para CUALQUIER producto que el dueño cree desde el panel, leyendo su
// nombre/descripción + los colores (tema) de su local.

// Nombre del color por TONO + qué tan OSCURO y qué tan VIVO es.
// El tono solo no basta: un café (#6F4A2F) y un naranja (#D98E2B) comparten tono, y
// llamar "warm orange ember" al café de La Comarca empujaba a la IA a pintar naranja
// peleando contra el hex. Igual el vino de Pilotos (#8A1212), que salía como "warm red".
// Por eso los tonos oscuros tienen su propio nombre (brown, maroon, wine, navy…).
const TONOS = [
  // [tope de hue, oscuro,               normal,               claro]
  [15,  'deep maroon red',    'warm red',           'soft coral'],
  [40,  'rich coffee brown',  'warm orange ember',  'warm peach'],
  [70,  'dark olive gold',    'golden yellow',      'pale butter yellow'],
  [160, 'deep forest green',  'fresh green',        'light lime green'],
  [200, 'deep teal',          'teal',               'pale aqua'],
  [255, 'deep navy blue',     'blue',               'light sky blue'],
  [290, 'deep purple',        'violet',             'soft lavender'],
  [345, 'wine burgundy',      'magenta pink',       'soft pink'],
  [360, 'deep maroon red',    'warm red',           'soft coral'],
]

function nombreColor(hex) {
  const m = (hex || '').replace('#', '')
  if (m.length < 6) return null
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  // Luminancia PERCEPTUAL (no la claridad HSL): el ojo ve el verde mucho más claro que
  // el azul o el rojo. Con claridad HSL, un lima (#B7E04A) y un ámbar (#E8A03D) daban
  // casi el mismo número y el ámbar de Pilotos terminaba llamándose "peach".
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (d < 25) return lum > 0.7 ? 'clean white' : lum < 0.25 ? 'deep charcoal' : 'soft grey'
  // Saturación HSL. Manda junto con la luminancia:
  //  • Un color a tope de saturación NUNCA es "pálido" aunque sea claro (#FFC42E es
  //    amarillo dorado intenso, no "pale butter").
  //  • Lo que separa un CAFÉ de un naranja no es que sea oscuro, es que está apagado:
  //    #6F4A2F (café) y #C8341F (rojo ladrillo) tienen luminancia casi igual, pero
  //    saturación 0.41 vs 0.73.
  const s = d / (255 - Math.abs(max + min - 255))
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = ((h * 60) + 360) % 360
  const [, oscuro, normal, claro] = TONOS.find(t => h < t[0]) || TONOS[1]
  if (lum < 0.30 || (lum < 0.42 && s < 0.55)) return oscuro
  if (lum > 0.68 && s < 0.85) return claro
  return normal
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
 * @param {{nombre:string, descripcion?:string, tipo?:'producto'|'opcion'|'banner', local:object}} args
 * @returns {string} prompt listo para pegar en Gemini
 */
export function construirPromptImagenIA({ nombre, descripcion = '', tipo = 'producto', local }) {
  const n = (nombre || '').trim()
  const desc = descripcion.trim() ? ` — ${descripcion.trim()}` : ''
  const fondo = moodDelLocal(local)

  if (tipo === 'banner') {
    // Portada horizontal del local. CLAVE: describe SU comida REAL (sus platos estrella o,
    // si no hay, sus categorías) para que la IA no invente un despliegue genérico que no pega
    // con la marca. Mismo MOOD/colores que las fotos de producto (coherencia).
    const platos = (local?.destacadosHome || []).map(p => (p?.nombre || '').trim()).filter(Boolean)
    const cats = (local?.categorias || [])
      .map(c => (c?.nombre || '').trim())
      .filter(c => c && !/bebida|adici[oó]n|salsa|extra/i.test(c))
    const lista = (platos.length ? platos : cats).slice(0, 5).join(', ')
    const detalle = lista ? ` — an abundant, appetizing spread featuring ${lista}` : ' — an abundant, appetizing spread of its real dishes'
    return `Photorealistic wide horizontal banner food photography of the real menu of a food place called "${n}"${detalle}, freshly made, vibrant and mouth-watering, natural lighting, ${fondo}, horizontal cinematic composition, high detail, sharp focus, no text, no watermark, no logo, no hands.`
  }
  if (tipo === 'opcion') {
    // Topping / salsa / adición: primer plano de un solo ingrediente.
    return `Photorealistic professional close-up food photography of "${n}"${desc}, a single fresh ingredient or topping, appetizing, vibrant colors, soft natural lighting, shallow depth of field, high detail, sharp focus, ${fondo}, centered, square composition, no text, no watermark, no logo, no hands.`
  }
  // Plato / bebida principal.
  return `Photorealistic professional food photography of "${n}"${desc}, freshly made, appetizing and mouth-watering, natural soft lighting, shallow depth of field, high detail, sharp focus, ${fondo}, centered on a clean serving surface, square composition, no text, no watermark, no logo, no hands.`
}

// Los platos REALES del local, para que el afiche no muestre comida genérica.
// Prefiere los destacados (los que el dueño marcó "Nuestro fuerte"); si no hay,
// cae a sus categorías (quitando bebidas/adiciones, que no lucen en un afiche).
function platosDelLocal(local, max = 4) {
  const platos = (local?.destacadosHome || []).map(p => (p?.nombre || '').trim()).filter(Boolean)
  const cats = (local?.categorias || [])
    .map(c => (c?.nombre || '').trim())
    .filter(c => c && !/bebida|adici[oó]n|salsa|extra|jugo/i.test(c))
  return (platos.length ? platos : cats).slice(0, max)
}

/**
 * 📢 Prompt para el AFICHE PUBLICITARIO de redes sociales: "ya hacemos domicilios",
 * con el NOMBRE del local, su TELÉFONO y sus COLORES de marca.
 *
 * Dos decisiones que hacen que salga bien (y que se aprendieron a la mala):
 *  1. **NO se le pide a la IA que dibuje el logo.** Los modelos de imagen deforman
 *     emblemas y letras de marca; el resultado parece una copia mala del logo real.
 *     El afiche se construye solo con TIPOGRAFÍA + COMIDA + COLOR, y se le prohíbe
 *     explícitamente inventar logos, escudos o mascotas.
 *  2. **Solo TRES textos**, escritos literal y entre comillas. Cuantas más frases
 *     lleve una imagen generada, más falta de ortografía aparece. Nombre, titular
 *     de domicilios y teléfono: nada más.
 *
 * @param {{local:object, telefono?:string}} args telefono ya formateado ("320 843 5143")
 * @returns {string} prompt listo para pegar en Gemini
 */
export function construirPromptPublicidad({ local, telefono = '' }) {
  const nombre = (local?.nombre || '').trim()
  const tema = local?.tema || {}
  const tel = String(telefono || '').trim()

  // Colores de marca: cada uno con su ROL + nombre + hex. El rol evita que dos tonos
  // parecidos (ej. dos verdes) lleguen con el mismo nombre y la IA los confunda; el hex
  // afina el tono exacto (los modelos leen bien nombre y hex juntos).
  const conRol = (hex, rol) => {
    if (!hex) return ''
    const nom = nombreColor(hex)
    return `${rol}: ${nom ? nom + ' ' : ''}${hex}`
  }
  const paleta = [
    conRol(tema.primary, 'main'),
    conRol(tema.primarySoft, 'light tone'),
    conRol(tema.accent, 'highlight'),
  ].filter(Boolean).join(', ')

  const platos = platosDelLocal(local)
  const comida = platos.length
    ? `the real food this place sells — ${platos.join(', ')} — bursting through the air`
    : 'delicious street food bursting through the air'

  // Los textos del afiche, numerados y entre comillas: es lo que mejor respeta la IA.
  const textos = [
    `1. The business name, the biggest and boldest element: "${nombre}"`,
    '2. The headline: "AHORA CON DOMICILIOS"',
    tel ? `3. The phone number, large and clearly readable: "${tel}"` : null,
  ].filter(Boolean).join('\n')

  return `Epic, high-energy advertising poster for social media (vertical 4:5), for a Colombian food business. Bold, loud and full of life — the kind of poster that stops the scroll.

THE POSTER MUST CONTAIN EXACTLY THESE TEXTS, spelled letter by letter as written, in Spanish, and NOTHING else:
${textos}

SCENE: ${comida}, with splashes of sauce, flying ingredients, sparks and motion streaks, and a delivery scooter speeding with a delivery box, leaving light trails. Dramatic rim lighting, energetic diagonal composition, cinematic depth, sense of speed and celebration.

BRAND COLORS (use them for the background gradient, the glows and the typography): ${paleta || 'vivid warm tones'}.

TYPOGRAPHY: massive bold condensed sans-serif with thick outlines and strong drop shadows, street-food poster style, extremely legible, high contrast against the background. Perfect Spanish spelling, no typos, no invented or duplicated words, no extra sentences, no watermark.

VERY IMPORTANT: do NOT draw any logo, emblem, badge, crest, shield, mascot or brand symbol, and do not try to recreate an existing brand mark. Build the entire design ONLY from typography, food and color.

Ultra detailed, vibrant, saturated, professional advertising quality, vertical 4:5 composition.`
}
