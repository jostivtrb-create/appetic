import { useEffect, useState } from 'react'

// 🖥️ ¿Estamos en la versión de ESCRITORIO?
//
// La app nació 100% para el celular y ese diseño no se toca: todo lo de PC vive
// detrás de este breakpoint. La mayoría de la adaptación es CSS puro
// (src/styles/desktop.css), pero unas pocas piezas necesitan cambiar de
// COMPORTAMIENTO, no solo de aspecto:
//   • el carrito, que en PC es un panel lateral fijo y no una hoja que se abre;
//   • la barra de navegación, que en el celular se esconde cuando hay una capa
//     encima (modal/carrito) y en PC debe quedarse siempre visible.
//
// 1024px es el mismo corte que usa desktop.css. Si cambia uno, cambia el otro.
export const PC_MIN_WIDTH = 1024
const CONSULTA = `(min-width: ${PC_MIN_WIDTH}px)`

export function useEsEscritorio() {
  const [esPC, setEsPC] = useState(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(CONSULTA).matches
      : false
  ))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(CONSULTA)
    const alCambiar = e => setEsPC(e.matches)
    setEsPC(mq.matches) // por si el ancho cambió entre el primer render y el efecto
    mq.addEventListener('change', alCambiar)
    return () => mq.removeEventListener('change', alCambiar)
  }, [])

  return esPC
}
