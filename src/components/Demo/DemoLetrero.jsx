import { Link, useLocation, useNavigate } from 'react-router-dom'
import { quieroEsto, conPreview, olvidarBienvenida } from './demoUtils'
import { AVISO_BIENVENIDA } from './Recorrido'
import './Demo.css'

// 🧪 Letrero fijo de la demo (D10): que nadie la confunda con un restaurante de verdad, con el
// botón para volver a los recorridos guiados (la bienvenida solo sale sola una vez por pestaña),
// el salto entre cliente ⇄ dueño y el botón que convierte («Quiero esto para mi negocio»).
export default function DemoLetrero({ local, vista }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const recorridos = () => {
    // Fuera del menú: se navega y el menú abre la bienvenida al montarse. En el menú: se abre ya.
    olvidarBienvenida()
    if (pathname !== `/${local.slug}`) navigate(conPreview(`/${local.slug}`))
    else window.dispatchEvent(new Event(AVISO_BIENVENIDA))
  }
  return (
    <div className="demo-letrero" role="note">
      <span className="demo-letrero-txt"><b>🧪 Demo de Appetic</b><span className="demo-letrero-sub"> · toca todo, nada se daña</span></span>
      <div className="demo-letrero-acc">
        <button className="demo-letrero-guia" onClick={recorridos}>▶ <span>Recorrido guiado</span></button>
        {vista === 'cliente'
          ? <Link to={conPreview(`/${local.slug}/admin`)} className="demo-letrero-link">👔 <span>Ver como dueño</span></Link>
          : <Link to={conPreview(`/${local.slug}`)} className="demo-letrero-link">🙋 <span>Ver como cliente</span></Link>}
        <button className="demo-letrero-quiero" onClick={() => quieroEsto(local)}>Quiero esto</button>
      </div>
    </div>
  )
}
