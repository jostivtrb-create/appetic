import { useRef, useState } from 'react'
import './CategoryNav.css'

// Barra de categorías tipo CARRUSEL CONTINUO: las pastillas se deslizan solas,
// lento y en bucle. Al tocar la barra se pausa un momento para poder elegir una
// (cada pastilla cambia la categoría activa). Respeta prefers-reduced-motion.
export default function CategoryNav({ categorias, activa, onSelect }) {
  const [pausado, setPausado] = useState(false)
  const timer = useRef(null)

  if (!categorias?.length) return null

  // Se duplica la lista para que el bucle no tenga costura (translateX -50%).
  const loop = categorias.length > 1 ? [...categorias, ...categorias] : categorias
  // Más categorías → ciclo más largo (misma sensación de lentitud).
  const dur = Math.max(18, categorias.length * 4)

  function pausar() {
    if (timer.current) clearTimeout(timer.current)
    setPausado(true)
  }
  function reanudarPronto() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPausado(false), 2600)
  }

  return (
    <nav
      className="catnav catnav-marquee"
      onPointerDown={pausar}
      onPointerUp={reanudarPronto}
      onPointerLeave={reanudarPronto}
      aria-label="Categorías"
    >
      <div
        className={`catnav-track catnav-track--anim ${pausado ? 'is-paused' : ''}`}
        style={{ '--catnav-dur': `${dur}s` }}
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
