// 🗓️ HORARIO DE LA SEMANA DEL PERSONAL (guía «Paquetes de Appetic» D10, paquete Contabilidad).
// Es una semana TIPO que se repite: quién trabaja qué día y a qué hora. La arma el dueño en
// Cuentas → Horario y la ve todo el equipo en su panel. (No confundir con `local.horario`, que es
// cuándo abre el negocio: utils/horario.js.)
//
//   locales/{id}/horarios/semana = { personas: [{ id, nombre, dias: { lun: { de: '08:00', a: '16:00' } | null, … } }],
//                                  actualizado, por }
export const DIAS = [
  { id: 'lun', corto: 'Lun', largo: 'Lunes' }, { id: 'mar', corto: 'Mar', largo: 'Martes' },
  { id: 'mie', corto: 'Mié', largo: 'Miércoles' }, { id: 'jue', corto: 'Jue', largo: 'Jueves' },
  { id: 'vie', corto: 'Vie', largo: 'Viernes' }, { id: 'sab', corto: 'Sáb', largo: 'Sábado' },
  { id: 'dom', corto: 'Dom', largo: 'Domingo' },
]
export const PRESETS = [
  { nombre: 'Mañana', de: '06:00', a: '14:00' },
  { nombre: 'Tarde', de: '14:00', a: '22:00' },
  { nombre: 'Completo', de: '08:00', a: '20:00' },
]
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

export const turnoValido = t => !!t && HORA.test(t.de) && HORA.test(t.a) && t.de !== t.a

// '14:00' → '2 p. m.' · '08:30' → '8:30 a. m.'
export function horaTxt(h) {
  const [H, M] = h.split(':').map(Number)
  return `${(H % 12) || 12}${M ? `:${String(M).padStart(2, '0')}` : ''} ${H < 12 ? 'a. m.' : 'p. m.'}`
}
export const turnoTxt = t => (turnoValido(t) ? `${horaTxt(t.de)} – ${horaTxt(t.a)}` : 'Descansa')
// Corto para la cuadrícula: '8–4', '2–10'.
export function turnoCorto(t) {
  if (!turnoValido(t)) return '—'
  const c = h => { const [H, M] = h.split(':').map(Number); return `${(H % 12) || 12}${M ? `:${String(M).padStart(2, '0')}` : ''}` }
  return `${c(t.de)}–${c(t.a)}`
}
// Horas del turno (cruza medianoche si «a» es menor que «de»).
export function horasTurno(t) {
  if (!turnoValido(t)) return 0
  const m = h => { const [H, M] = h.split(':').map(Number); return H * 60 + M }
  let d = m(t.a) - m(t.de)
  if (d <= 0) d += 24 * 60
  return d / 60
}
export const horasSemana = p => DIAS.reduce((s, d) => s + horasTurno(p?.dias?.[d.id]), 0)

// El día de hoy en Bogotá ('lun'…'dom').
export function hoyDia(ahora = Date.now()) {
  const d = new Date(ahora - 5 * 3600000).getUTCDay() // 0 = domingo
  return ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][d]
}

// Deja la lista limpia para guardar: solo personas con nombre y turnos válidos.
export function limpiarSemana(personas) {
  return (personas || []).filter(p => p?.id && String(p.nombre || '').trim()).slice(0, 60).map(p => ({
    id: String(p.id), nombre: String(p.nombre).trim().slice(0, 60),
    dias: Object.fromEntries(DIAS.map(d => [d.id, turnoValido(p.dias?.[d.id]) ? { de: p.dias[d.id].de, a: p.dias[d.id].a } : null])),
  }))
}
