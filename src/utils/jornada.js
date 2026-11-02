// 📅 JORNADA de las cuentas (guía «Cuentas del negocio», S11): el «día» del negocio sigue su
// horario, no la medianoche. Si abre 18:00 y cierra 02:00, lo vendido a la 1 a. m. cuenta para
// la jornada que empezó el día anterior. Todo en hora de Bogotá.
//
//   jornadaDe(ms, horario) → 'AAAA-MM-DD'      mesDe('2026-11-02') → '2026-11'
//   horaDe(ms) → 0…23 (para las horas pico)

const PARTES = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
})

function partes(ms) {
  const p = Object.fromEntries(PARTES.formatToParts(new Date(ms)).map(x => [x.type, x.value]))
  return { fecha: `${p.year}-${p.month}-${p.day}`, h: Number(p.hour) % 24, m: Number(p.minute) }
}

const aMin = hhmm => { const [h, m] = String(hhmm || '').split(':').map(Number); return (h || 0) * 60 + (m || 0) }

// Fecha 'AAAA-MM-DD' ± n días (se trabaja en UTC sobre la fecha ya local: sin líos de zona).
export function sumarDias(fecha, n) {
  const d = new Date(`${fecha}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function jornadaDe(ms = Date.now(), horario) {
  const { fecha, h, m } = partes(ms)
  const abre = horario?.abre, cierra = horario?.cierra
  if (abre && cierra) {
    const a = aMin(abre), c = aMin(cierra)
    // Cruza la medianoche y estamos en la madrugada, antes del cierre → es la jornada de ayer.
    if (a > c && h * 60 + m < c) return sumarDias(fecha, -1)
  }
  return fecha
}

export const horaDe = (ms = Date.now()) => partes(ms).h
export const mesDe = jornada => String(jornada).slice(0, 7)

export function mesAnterior(mes) {
  const [y, m] = mes.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

// Todos los días de un mes 'AAAA-MM' → ['AAAA-MM-01', …].
export function diasDelMes(mes) {
  const [y, m] = mes.split('-').map(Number)
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: n }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`)
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const nombreMes = mes => MESES[Number(mes.slice(5, 7)) - 1] || ''
export const nombreMesCorto = mes => MESES_CORTOS[Number(mes.slice(5, 7)) - 1] || ''

// «Hoy» · «Ayer» · «Antier» · «Martes 14 oct» (como el historial de La Catrina).
export function etiquetaJornada(jornada, hoy) {
  if (jornada === hoy) return 'Hoy'
  if (jornada === sumarDias(hoy, -1)) return 'Ayer'
  if (jornada === sumarDias(hoy, -2)) return 'Antier'
  const d = new Date(`${jornada}T12:00:00Z`)
  const dia = DIAS[d.getUTCDay()]
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${d.getUTCDate()} ${MESES_CORTOS[d.getUTCMonth()]}`
}

// «3:42 p. m.»
export function horaCorta(ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit' })
}
