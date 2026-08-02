import { useRef, useEffect } from 'react'
import { useEsEscritorio } from '../../utils/useEsEscritorio'
import './CategoryNav.css'

// Barra de categorías tipo carrusel: se desliza sola, lento y en bucle, PERO el
// dedo puede arrastrarla (scroll nativo). Al tocarla/arrastrarla se queda quieta;
// a los ~7 s sin tocarla, retoma el giro desde donde quedó. Respeta reduce-motion.
//
// 🖥️ En PC el carrusel se apaga: allí las pestañas caben todas en una o dos
// filas (desktop.css las envuelve con flex-wrap) y se ven de un vistazo. El
// bucle infinito necesita la lista DUPLICADA para no tener costura, y sin
// scroll horizontal esa copia queda a la vista —las categorías salían dos
// veces—. Así que en escritorio no se duplica ni se anima: se listan y ya.
export default function CategoryNav({ categorias, activa, onSelect }) {
  const trackRef = useRef(null)
  const interact = useRef(false)   // el usuario la está tocando/arrastrando
  const pos = useRef(0)            // posición fluida del auto-scroll
  const raf = useRef(0)
  const timer = useRef(null)
  const esPC = useEsEscritorio()

  const varias = (categorias?.length || 0) > 1 && !esPC

  // Auto-scroll continuo por JS (compatible con el arrastre nativo del usuario).
  useEffect(() => {
    const track = trackRef.current
    if (!track || !varias) return
    // (Antes se cortaba aquí con prefers-reduced-motion, pero en iOS ese flag lo
    //  enciende el Modo de bajo consumo y dejaba el carrusel quieto solo en iPhone.)

    const SPEED = 0.4 // px por frame (~despacio)
    pos.current = track.scrollLeft
    function frame() {
      raf.current = requestAnimationFrame(frame)
      const half = track.scrollWidth / 2
      if (interact.current) { pos.current = track.scrollLeft; return }
      pos.current += SPEED
      if (half > 0 && pos.current >= half) pos.current -= half // bucle sin costura
      track.scrollLeft = pos.current
    }
    raf.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf.current)
  }, [varias, categorias?.length])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  if (!categorias?.length) return null
  // Se duplica la lista para que el bucle no tenga costura.
  const loop = varias ? [...categorias, ...categorias] : categorias

  function pausar() {
    interact.current = true
    if (timer.current) clearTimeout(timer.current)
  }
  function reanudarEn7s() {
    // Normaliza al primer juego (sin salto: el contenido está duplicado) y espera 7 s.
    const track = trackRef.current
    if (track) {
      const half = track.scrollWidth / 2
      if (half > 0 && track.scrollLeft >= half) track.scrollLeft -= half
      pos.current = track.scrollLeft
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { interact.current = false }, 7000)
  }

  return (
    <nav className={`catnav ${varias ? 'catnav-marquee' : ''}`} aria-label="Categorías">
      <div
        ref={trackRef}
        className="catnav-track catnav-track--scroll"
        onPointerDown={pausar}
        onPointerUp={reanudarEn7s}
        onPointerCancel={reanudarEn7s}
        onTouchStart={pausar}
        onTouchEnd={reanudarEn7s}
        onWheel={() => { pausar(); reanudarEn7s() }}
      >
        {loop.map((c, i) => (
          <button
            key={`${c.id}-${i}`}
            className={`catnav-tab ${activa === c.id ? 'catnav-tab-active' : ''}`}
            onClick={() => onSelect(c.id)}
            aria-current={activa === c.id ? 'true' : undefined}
          >
            {c.emoji && <span className="catnav-emoji">{c.emoji}</span>}
            {c.nombre}
          </button>
        ))}
      </div>
    </nav>
  )
}
