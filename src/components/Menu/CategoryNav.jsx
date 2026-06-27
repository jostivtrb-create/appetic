import { useRef } from 'react'
import './CategoryNav.css'

export default function CategoryNav({ categorias, activa, onSelect }) {
  const navRef = useRef(null)

  function handle(id, e) {
    onSelect(id)
    // Centrar la pestaña tocada
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  if (!categorias?.length) return null

  return (
    <nav className="catnav" ref={navRef}>
      <div className="catnav-track">
        {categorias.map(c => (
          <button
            key={c.id}
            className={`catnav-tab ${activa === c.id ? 'catnav-tab-active' : ''}`}
            onClick={(e) => handle(c.id, e)}
          >
            {c.emoji && <span className="catnav-emoji">{c.emoji}</span>}
            {c.nombre}
          </button>
        ))}
      </div>
    </nav>
  )
}
