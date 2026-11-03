import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { avisarDemoEntrada, avisarDemoLatido } from '../../services/demo'
import { conPreview, olvidarBienvenida } from './demoUtils'
import { AVISO_BIENVENIDA, terminarRecorrido } from './Recorrido'
import './Demo.css'

// 🧪 Letrero fijo de la demo (D10): que nadie la confunda con un restaurante de verdad, y UN solo
// botón (pedido del usuario, 30-oct): «Volver al inicio del demo», que corta el recorrido en curso
// y abre la bienvenida con los procesos. Queda por encima del bloqueo del recorrido.
// 🔄 La demo se reinicia sola si nadie la usa hace 30 min (guía «Blindaje» D5). Al llegar se avisa
// UNA vez por carga de la página (si justo se reinició, se recarga para ver la demo limpia) y luego
// «sigo aquí» cada 5 min mientras la pestaña esté a la vista.
let entradaAvisada = false
const LATIDO = 5 * 60000

function useDemoEnUso(activa) {
  // Si el servidor tarda, es porque la está dejando como nueva: se tapa con «Preparando…».
  const [preparando, setPreparando] = useState(false)
  useEffect(() => {
    if (!activa) return
    if (!entradaAvisada) {
      entradaAvisada = true
      const reloj = setTimeout(() => setPreparando(true), 1200)
      avisarDemoEntrada().then(r => {
        clearTimeout(reloj)
        setPreparando(false)
        let yaRecargo = false
        try { yaRecargo = sessionStorage.getItem('appetic_demo_recargada') === '1' } catch { /* nada */ }
        if (r?.reiniciada && !yaRecargo) {
          try { sessionStorage.setItem('appetic_demo_recargada', '1') } catch { /* nada */ }
          window.location.reload()
        } else if (!r?.reiniciada) {
          try { sessionStorage.removeItem('appetic_demo_recargada') } catch { /* nada */ }
        }
      })
    }
    const t = setInterval(() => { if (document.visibilityState === 'visible') avisarDemoLatido() }, LATIDO)
    return () => clearInterval(t)
  }, [activa])
  return preparando
}

export default function DemoLetrero({ local }) {
  // La vista previa (?preview=1) es del navegador: no hay nada que reiniciar en el servidor.
  const preparando = useDemoEnUso(!!local?.esDemo && !new URLSearchParams(window.location.search).has('preview'))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const volver = () => {
    terminarRecorrido()
    olvidarBienvenida()
    // Fuera del menú: se navega y el menú abre la bienvenida al montarse. En el menú: se abre ya.
    if (pathname !== `/${local.slug}`) navigate(conPreview(`/${local.slug}`))
    else window.dispatchEvent(new Event(AVISO_BIENVENIDA))
  }
  if (preparando) {
    return (
      <div className="demo-preparando" role="status">
        <div className="demo-preparando-caja">
          <span className="demo-preparando-ico" aria-hidden="true">🍔</span>
          <b>Preparando la demo para ti…</b>
          <small>La dejamos como nueva, sin lo que probaron otros. Unos segundos.</small>
        </div>
      </div>
    )
  }
  return (
    <div className="demo-letrero" role="note">
      <span className="demo-letrero-txt"><b>🧪 Demo de Appetic</b></span>
      <button className="demo-letrero-volver" onClick={volver}>↩ Volver al inicio del demo</button>
    </div>
  )
}
