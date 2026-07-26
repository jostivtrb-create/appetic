// 🔖 Código corto de pedido: PREFIJO-XXXX (prefijo del local + 4 caracteres).
// Va en el mensaje de WhatsApp y sirve para que el domiciliario BUSQUE el pedido
// en la app y vea el precio REAL guardado en la base — así, aunque el cliente
// edite el texto de WhatsApp, el precio que manda no sirve.
//
// Alfabeto sin caracteres ambiguos (nada de 0/O, 1/I/L) para dictarlo por voz.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

// Prefijo de 2 letras a partir del slug/nombre del local (ej. 'fruti-tentacion' -> 'FT').
export function prefijoLocal(local) {
  const base = String(local?.slug || local?.nombre || 'PED')
  const palabras = base.split(/[-_\s]+/).filter(Boolean)
  const pref = palabras.length >= 2
    ? (palabras[0][0] || '') + (palabras[1][0] || '')
    : base.slice(0, 2)
  return (pref.toUpperCase().replace(/[^A-Z]/g, '') || 'PE').slice(0, 3)
}

// Genera un código nuevo (ej. 'FT-7K2Q'). No garantiza unicidad global (probabilidad
// de choque bajísima con 4 chars); el domiciliario ve fecha/cliente para desambiguar.
export function generarCodigoPedido(local) {
  let s = ''
  for (let i = 0; i < 4; i++) {
    s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)]
  }
  return `${prefijoLocal(local)}-${s}`
}

// Normaliza lo que teclea el domiciliario para buscar (mayúsculas, sin espacios).
// Acepta que escriba con o sin guion: 'ft7k2q' -> 'FT-7K2Q' si tiene el patrón.
export function normalizarCodigo(entrada) {
  let c = String(entrada || '').toUpperCase().replace(/\s+/g, '').trim()
  return c
}
