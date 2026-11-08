import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import './Ajustes.css'
import { SECCIONES_AJUSTES } from '../../config/ajustes'

// ⚙️ CONFIGURACIÓN como panel de ajustes de verdad: un menú de secciones (a la izquierda en el PC,
// arriba como pestañas en el celular) y el contenido de la sección a la derecha.
//   Catálogo · Menú del día · Negocio y horario · Cuentas y pagos · Apariencia · Pantalla de TV · Equipo · Mi plan
// Cada sección es su propia página (/:slug/admin/config/<sección>).

// `conMenu`: el menú de secciones de la página. Quien tiene la barra del panel lo ve ahí, como
// desplegable de «Configuración» (pedido del usuario, 3-nov); solo la vista previa sin barra lo pinta aquí.
export default function AdminAjustes({ slug, sub, conMenu = true, children }) {
  const actual = SECCIONES_AJUSTES.find(x => x.id === sub) || SECCIONES_AJUSTES[0]
  // En el celular las secciones son pestañas que se desplazan: la activa se trae a la vista.
  const nav = useRef(null)
  useEffect(() => {
    nav.current?.querySelector('.aj-item.on')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [actual.id])
  return (
    <div className={`aj${conMenu ? '' : ' aj--sin-menu'}${actual.id === 'catalogo' ? ' aj--ancho' : ''}`}>
      {conMenu && <nav className="aj-nav" aria-label="Secciones de configuración" ref={nav}>
        {SECCIONES_AJUSTES.map(x => (
          <NavLink key={x.id} to={`/${slug}/admin/config/${x.id}${window.location.search}`} className={() => `aj-item ${x.id === actual.id ? 'on' : ''}`} replace>
            <span className="aj-ico" aria-hidden="true">{x.icono}</span>
            <span className="aj-txt"><strong>{x.titulo}</strong><small>{x.desc}</small></span>
          </NavLink>
        ))}
      </nav>}
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
