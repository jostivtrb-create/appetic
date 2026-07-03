import { useEffect } from 'react'

// 🔒 Bloquea el scroll del fondo mientras hay un popup/overlay abierto.
// Los overlays (detalle de producto, carrito, checkout) son `position: fixed`
// con su propio scroll interno, así que congelar el body no afecta su
// desplazamiento. Usamos `position: fixed` en el body (no solo overflow:hidden)
// porque es lo único que frena de verdad el "arrastre" en móvil (iOS/Android),
// guardando y restaurando la posición para que la página no salte al cerrar.
export function useBloquearScroll(activo) {
  useEffect(() => {
    if (!activo) return
    const body = document.body
    const scrollY = window.scrollY
    const previo = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      body.style.position = previo.position
      body.style.top = previo.top
      body.style.left = previo.left
      body.style.right = previo.right
      body.style.width = previo.width
      body.style.overflow = previo.overflow
      window.scrollTo(0, scrollY)
    }
  }, [activo])
}
