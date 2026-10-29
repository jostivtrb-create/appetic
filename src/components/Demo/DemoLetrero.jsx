import { Link } from 'react-router-dom'
import { quieroEsto, conPreview } from './demoUtils'
import './Demo.css'

// 🧪 Letrero fijo de la demo (D10): que nadie la confunda con un restaurante de verdad, con el
// salto entre cliente ⇄ dueño y el botón que convierte («Quiero esto para mi negocio»).
export default function DemoLetrero({ local, vista }) {
  return (
    <div className="demo-letrero" role="note">
      <span className="demo-letrero-txt"><b>🧪 Demo de Appetic</b><span className="demo-letrero-sub"> · toca todo, nada se daña</span></span>
      <div className="demo-letrero-acc">
        {vista === 'cliente'
          ? <Link to={conPreview(`/${local.slug}/admin`)} className="demo-letrero-link">👔 Ver como dueño</Link>
          : <Link to={conPreview(`/${local.slug}`)} className="demo-letrero-link">🙋 Ver como cliente</Link>}
        <button className="demo-letrero-quiero" onClick={() => quieroEsto(local)}>Quiero esto</button>
      </div>
    </div>
  )
}
