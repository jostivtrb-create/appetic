// 🖨️ El documento (documento.js) en bytes ESC/POS, el idioma de casi todas las impresoras
// térmicas de 58 y 80 mm. Puro: se prueba sin impresora.
//
// Tildes y eñes: se pide la página de códigos PC850 (ESC t 2), la que traen casi todas. Lo que no
// existe ahí (emojis, comillas tipográficas) se cambia por su letra simple o se quita.
import { renglones, anchoEnLetras } from './documento.js'

const ESC = 0x1b, GS = 0x1d
const PC850 = {
  'Ç': 0x80, 'ü': 0x81, 'é': 0x82, 'â': 0x83, 'ä': 0x84, 'à': 0x85, 'ç': 0x87, 'ê': 0x88, 'ë': 0x89, 'è': 0x8a,
  'ï': 0x8b, 'î': 0x8c, 'ì': 0x8d, 'Ä': 0x8e, 'É': 0x90, 'ô': 0x93, 'ö': 0x94, 'ò': 0x95, 'û': 0x96, 'ù': 0x97,
  'Ö': 0x99, 'Ü': 0x9a, 'á': 0xa0, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3, 'ñ': 0xa4, 'Ñ': 0xa5, 'ª': 0xa6, 'º': 0xa7,
  '¿': 0xa8, '¡': 0xad, 'Á': 0xb5, 'Â': 0xb6, 'À': 0xb7, 'Í': 0xd6, 'Ó': 0xe0, 'Ú': 0xe9, '°': 0xf8, '·': 0xfa,
}
const SIMPLE = { '“': '"', '”': '"', '‘': "'", '’': "'", '–': '-', '—': '-', '…': '...', '−': '-', '•': '*', '✓': 'OK', '×': 'x' }

export function codificar(texto) {
  const out = []
  for (const ch of String(texto)) {
    const c = ch.codePointAt(0)
    if (c >= 0x20 && c < 0x7f) out.push(c)
    else if (PC850[ch] != null) out.push(PC850[ch])
    else if (SIMPLE[ch]) for (const s of SIMPLE[ch]) out.push(s.charCodeAt(0))
    else {
      // Letra con tilde que no está: sin la tilde. Lo demás (emojis…) se quita.
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (base.length === 1 && base.charCodeAt(0) < 0x7f) out.push(base.charCodeAt(0))
    }
  }
  return out
}

export function aEscpos(doc, ancho = 58, { cortar = true } = {}) {
  const n = anchoEnLetras(ancho)
  const b = [ESC, 0x40, ESC, 0x74, 2]               // reiniciar · página PC850
  for (const r of renglones(doc, n)) {
    b.push(ESC, 0x61, r.centro ? 1 : 0)              // alinear
    b.push(ESC, 0x45, r.negrita ? 1 : 0)             // negrita
    b.push(GS, 0x21, r.grande ? 0x11 : 0x00)         // doble alto y ancho
    b.push(...codificar(r.texto), 0x0a)
  }
  b.push(GS, 0x21, 0, ESC, 0x45, 0, ESC, 0x61, 0)
  b.push(ESC, 0x64, 4)                              // avanzar 4 renglones
  if (cortar) b.push(GS, 0x56, 0x42, 0)             // corte parcial (las que no cortan lo ignoran)
  return new Uint8Array(b)
}
