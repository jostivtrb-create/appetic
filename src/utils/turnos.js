// 🔔 Turnos del día y «Pedidos listos» del TV, sin React ni Firebase (se prueba con `node prueba-appetic.mjs`).
//
// Guía: .mega-cuestionario/Guía para la Pantalla de TV.md (Etapa C · D14–D16, D24, S10, S16, S17)
//
//   locales/{id}/pantalla/turno   { fecha: 'AAAA-MM-DD', n }                 ← contador del día
//   locales/{id}/pantalla/listos  { fecha, items: [{ id, turno, nombre, en }] } ← lo que ve el TV
//
// Las comandas no se pueden leer sin sesión y el TV no inicia sesión: por eso la cocina escribe
// en `listos` solo lo que se muestra (turno y primer nombre), sin platos ni teléfonos.

export const MAX_LISTOS = 8
// Cuánto tiempo sigue un pedido en la franja del TV después de salir de la cocina.
export const MINUTOS_EN_FRANJA = 12

// ¿Esta comanda lleva turno? Solo si el dueño prendió los pedidos listos, el local usa cocina
// (sin cocina no hay un momento «listo», S16) y es para llevar del mostrador o del QR (D15).
export function llevaTurno(local, destino, origen) {
  if (!local?.pantalla?.pedidosListos || local?.usaCocina === false) return false
  return destino?.tipo === 'llevar' || origen === 'qr'
}

// El siguiente número: vuelve a 1 cada día (D16).
export function siguienteTurno(previo, fecha) {
  return previo?.fecha === fecha && Number(previo.n) > 0 ? Number(previo.n) + 1 : 1
}

// «Ana María Pérez» → «Ana». El TV dice el primer nombre (D16); vacío si no hay.
export function nombreCorto(nombre) {
  return String(nombre || '').trim().split(/\s+/)[0]?.slice(0, 16) || ''
}

// Agrega un pedido listo arriba de la lista del día (sin repetir la misma comanda).
export function agregarListo(previo, entrada, fecha, max = MAX_LISTOS) {
  const deHoy = previo?.fecha === fecha ? (previo.items || []) : []
  return { fecha, items: [entrada, ...deHoy.filter(x => x.id !== entrada.id)].slice(0, max) }
}

// «Deshacer» en la cocina: el pedido sale de la lista.
export function quitarListo(previo, id) {
  return { fecha: previo?.fecha || '', items: (previo?.items || []).filter(x => x.id !== id) }
}

// Lo que todavía se muestra en la franja: lo de los últimos minutos, el más nuevo primero.
// La hora `en` la pone el aparato de la COCINA; `ahora` es la del TV. Si el reloj del TV está muy
// descuadrado (TV Box sin hora que arranca en otro año), se mide contra el pedido más reciente para
// que la franja no se quede llena para siempre ni vacía (auditoría «pantalla de TV» H10).
export function listosVigentes(docListos, ahora = Date.now(), minutos = MINUTOS_EN_FRANJA) {
  const items = docListos?.items || []
  const ultimo = Math.max(0, ...items.map(x => Number(x.en || 0)))
  const ref = Math.abs(ahora - ultimo) < 6 * 3600000 ? Math.max(ahora, ultimo) : ultimo
  return items.filter(x => ref - Number(x.en || 0) < minutos * 60000)
}
