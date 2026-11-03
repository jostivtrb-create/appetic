// 🕒 Horario del local (D25/K4): el cliente ve el menú pero solo puede pedir
// dentro del horario Y los días de atención. Todo se evalúa en hora de Bogotá.

// ⏰ Hora de Bogotá SIN Intl: Colombia es UTC−5 fijo todo el año (sin horario de verano desde 1993).
// Así funciona igual en los navegadores viejos de los Smart TV (Intl.formatToParts llegó en Chrome 57)
// y no depende de la zona horaria que tenga configurada el aparato.
const BOGOTA_MS = -5 * 3600000
export const enBogota = (ms = Date.now()) => new Date(Number(ms) + BOGOTA_MS)   // leer con getUTC…

// Minutos transcurridos desde medianoche, ahora mismo, en Bogotá.
export function minutosAhoraBogota() {
  const d = enBogota()
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

export function aMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Días de la semana en orden (índice = getDay: 0 domingo … 6 sábado).
const CLAVES_DIA = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const NOMBRE_DIA = {
  dom: 'domingo', lun: 'lunes', mar: 'martes', mie: 'miércoles',
  jue: 'jueves', vie: 'viernes', sab: 'sábado',
}

// Clave del día en Bogotá, con un desfase opcional en días (para cruces de medianoche).
export function diaBogota(offsetDias = 0) {
  return CLAVES_DIA[enBogota(Date.now() + offsetDias * 86400000).getUTCDay()]
}

// Devuelve un Set con los días activos, o null si "abre todos los días"
// (sin días definidos, o con nada marcado => no se bloquea por día).
function diasActivos(horario) {
  const dias = horario?.dias
  if (!dias) return null
  const set = Array.isArray(dias)
    ? new Set(dias)
    : new Set(Object.keys(dias).filter(k => dias[k]))
  return set.size === 0 ? null : set
}

// Cuál es el día de apertura relevante AHORA. Si el horario cruza medianoche
// (abre 18:00, cierra 02:00) y estamos en la madrugada, la jornada empezó ayer.
function diaVigente(horario) {
  const abre = horario?.abre, cierra = horario?.cierra
  if (abre && cierra) {
    const a = aMinutos(abre), c = aMinutos(cierra)
    if (a > c && minutosAhoraBogota() < c) return diaBogota(-1)
  }
  return diaBogota(0)
}

/**
 * ¿El local está abierto ahora?
 * horario = { abre: "11:00", cierra: "22:00", dias: { lun:true, ... } }
 * - Sin horario ni días definidos => se asume abierto (no bloquea).
 * - Respeta los días de atención marcados.
 * - Soporta horas que cruzan medianoche (ej: abre 18:00, cierra 02:00).
 */
export function estaAbierto(horario) {
  const set = diasActivos(horario)
  const tieneHoras = horario?.abre && horario?.cierra
  if (!set && !tieneHoras) return true

  // Bloqueo por día (usando el día de apertura vigente).
  if (set && !set.has(diaVigente(horario))) return false

  if (!tieneHoras) return true
  const ahora = minutosAhoraBogota()
  const abre = aMinutos(horario.abre)
  const cierra = aMinutos(horario.cierra)
  if (abre === cierra) return true // 24 horas
  if (abre < cierra) return ahora >= abre && ahora < cierra
  // Cruza medianoche
  return ahora >= abre || ahora < cierra
}

// Próximo día de atención a partir de hoy (para el mensaje de "cerrado").
function proximoDiaAbierto(set) {
  const hoyIdx = CLAVES_DIA.indexOf(diaBogota(0))
  for (let i = 1; i <= 7; i++) {
    const clave = CLAVES_DIA[(hoyIdx + i) % 7]
    if (set.has(clave)) return i === 1 ? 'mañana' : `el ${NOMBRE_DIA[clave]}`
  }
  return null
}

/**
 * Mensaje corto de por qué está cerrado (o null si está abierto).
 * Distingue entre "hoy no atiende" (día libre) y "fuera de horario".
 */
export function motivoCierre(horario) {
  if (estaAbierto(horario)) return null
  const set = diasActivos(horario)
  if (set && !set.has(diaBogota(0))) {
    const prox = proximoDiaAbierto(set)
    return prox ? `Hoy no atiende. Vuelve ${prox}.` : 'Hoy no atiende.'
  }
  return horario?.abre ? `Abre a las ${horario.abre}.` : 'Cerrado ahora.'
}
