// 🎮 Señales para el recorrido guiado de la demo: la app avisa «pasó X» y el recorrido avanza.
// Fuera de la demo nadie escucha, así que no hace nada.
export const EVENTO_DEMO = 'appetic-demo'
export function avisarDemo(tipo) {
  try { window.dispatchEvent(new CustomEvent(EVENTO_DEMO, { detail: tipo })) } catch { /* nada */ }
}
