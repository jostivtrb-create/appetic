import { useLocation, useNavigate } from 'react-router-dom'
import { conPreview, olvidarBienvenida } from './demoUtils'
import { AVISO_BIENVENIDA, terminarRecorrido } from './Recorrido'
import './Demo.css'

// 🧪 Letrero fijo de la demo (D10): que nadie la confunda con un restaurante de verdad, y UN solo
// botón (pedido del usuario, 30-oct): «Volver al inicio del demo», que corta el recorrido en curso
// y abre la bienvenida con los procesos. Queda por encima del bloqueo del recorrido.
export default function DemoLetrero({ local }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const volver = () => {
    terminarRecorrido()
    olvidarBienvenida()
    // Fuera del menú: se navega y el menú abre la bienvenida al montarse. En el menú: se abre ya.
    if (pathname !== `/${local.slug}`) navigate(conPreview(`/${local.slug}`))
    else window.dispatchEvent(new Event(AVISO_BIENVENIDA))
  }
  return (
    <div className="demo-letrero" role="note">
      <span className="demo-letrero-txt"><b>🧪 Demo de Appetic</b></span>
      <button className="demo-letrero-volver" onClick={volver}>↩ Volver al inicio del demo</button>
    </div>
  )
}
