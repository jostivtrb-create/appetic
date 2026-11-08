// 🔔 AVISOS DEL DUEÑO A SUS CLIENTES (guía «Paquetes de Appetic» D9, D18, D31, D34 · paquete Base).
// Puro: lo usan la app y /api/avisar-clientes.
//   locales/{id}/suscriptores/{token} = { token, motivo 'pedido'|'favorito', desde }
//   locales/{id}/avisos/{id}          = { titulo, mensaje, semana, en, por, enviadas, fallidas }
//   locales/{id}/avisosSemana/{AAAA-MM-DD del lunes} = { n }   ← cuántos lleva esa semana (máx. 3)
export const MAX_POR_SEMANA = 3
export const TITULO_MAX = 50
export const MENSAJE_MAX = 140

// Lunes de la semana (hora de Bogotá) como 'AAAA-MM-DD': la llave del tope semanal.
export function semanaDe(ahora = Date.now()) {
  const d = new Date(ahora - 5 * 3600000)
  const dia = (d.getUTCDay() + 6) % 7 // 0 = lunes
  return new Date(d.getTime() - dia * 86400000).toISOString().slice(0, 10)
}
export const limpiarTexto = (t, max) => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
