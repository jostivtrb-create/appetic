// 🕒 Horario del local (D25/K4): el cliente ve el menú pero solo puede pedir
// dentro del horario de atención. Todo se evalúa en hora de Bogotá.

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

/**
 * ¿El local está abierto ahora?
 * horario = { abre: "11:00", cierra: "22:00" }
 * - Sin horario definido => se asume abierto (no bloquea).
 * - Soporta horarios que cruzan medianoche (ej: abre 18:00, cierra 02:00).
 */
export function estaAbierto(horario) {
  if (!horario?.abre || !horario?.cierra) return true
  const ahora = minutosAhoraBogota()
  const abre = aMinutos(horario.abre)
  const cierra = aMinutos(horario.cierra)
  if (abre === cierra) return true // 24 horas
  if (abre < cierra) return ahora >= abre && ahora < cierra
  // Cruza medianoche
  return ahora >= abre || ahora < cierra
}
