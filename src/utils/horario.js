// 🕒 Horario del local (D25/K4): el cliente ve el menú pero solo puede pedir
// dentro del horario Y los días de atención. Todo se evalúa en hora de Bogotá.

// Minutos transcurridos desde medianoche, ahora mismo, en Bogotá.
function minutosAhoraBogota() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const h = Number(partes.find(p => p.type === 'hour')?.value || 0) % 24
  const m = Number(partes.find(p => p.type === 'minute')?.value || 0)
  return h * 60 + m
}

function aMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Días de la semana en orden (índice = getDay: 0 domingo … 6 sábado).
const CLAVES_DIA = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const NOMBRE_DIA = {
  dom: 'domingo', lun: 'lunes', mar: 'martes', mie: 'miércoles',
  jue: 'jueves', vie: 'viernes', sab: 'sábado',
}
const MAP_WD = { Sun: 'dom', Mon: 'lun', Tue: 'mar', Wed: 'mie', Thu: 'jue', Fri: 'vie', Sat: 'sab' }

// Clave del día en Bogotá, con un desfase opcional en días (para cruces de medianoche).
function diaBogota(offsetDias = 0) {
  const base = new Date(Date.now() + offsetDias * 86400000)
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short' }).format(base)
  return MAP_WD[wd] || 'lun'
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
