import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import './Ajustes.css'

// ⚙️ CONFIGURACIÓN como panel de ajustes de verdad: un menú de secciones (a la izquierda en el PC,
// arriba como pestañas en el celular) y el contenido de la sección a la derecha.
//   Catálogo · Negocio y horario · Apariencia · Equipo
// Cada sección es su propia página (/:slug/admin/config/<sección>).
export const SECCIONES_AJUSTES = [
  { id: 'catalogo', icono: '🍔', titulo: 'Catálogo', desc: 'Productos, precios, fotos y categorías' },
  { id: 'negocio', icono: '🏪', titulo: 'Negocio y horario', desc: 'WhatsApp, horario y entrega' },
  { id: 'apariencia', icono: '🎨', titulo: 'Apariencia', desc: 'Portada y animación del logo' },
  { id: 'equipo', icono: '👥', titulo: 'Equipo', desc: 'Meseros, cocina y domiciliarios' },
]

export default function AdminAjustes({ slug, sub, children }) {
  const actual = SECCIONES_AJUSTES.find(x => x.id === sub) || SECCIONES_AJUSTES[0]
  // En el celular las secciones son pestañas que se desplazan: la activa se trae a la vista.
  const nav = useRef(null)
  useEffect(() => {
    nav.current?.querySelector('.aj-item.on')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [actual.id])
  return (
    <div className="aj">
      <nav className="aj-nav" aria-label="Secciones de configuración" ref={nav}>
        {SECCIONES_AJUSTES.map(x => (
          <NavLink key={x.id} to={`/${slug}/admin/config/${x.id}${window.location.search}`} className={() => `aj-item ${x.id === actual.id ? 'on' : ''}`} replace>
            <span className="aj-ico" aria-hidden="true">{x.icono}</span>
            <span className="aj-txt"><strong>{x.titulo}</strong><small>{x.desc}</small></span>
          </NavLink>
        ))}
      </nav>
      <div className="aj-cuerpo">
        <header className="aj-cab">
          <h2>{actual.icono} {actual.titulo}</h2>
          <p>{actual.desc}</p>
        </header>
        {children(actual.id)}
      </div>
    </div>
  )
}
