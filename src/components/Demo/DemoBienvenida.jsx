import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { marcarBienvenida, quieroEsto, conPreview } from './demoUtils'
import './Demo.css'

// 👋 Bienvenida de la demo (D12): lo primero que ve quien abre el link. Elige cómo quiere verla;
// desde cualquier lado puede pasar al otro con el letrero de arriba.
export default function DemoBienvenida({ local, onCliente, onRecorrido }) {
  const navigate = useNavigate()
  const [sinLogo, setSinLogo] = useState(false)
  // Mientras está abierta, el menú de atrás no se mueve.
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [])
  const cliente = () => { marcarBienvenida(); onCliente() }
  const duenio = () => { marcarBienvenida(); navigate(conPreview(`/${local.slug}/admin`)) }
  const recorrido = () => { marcarBienvenida(); onRecorrido?.() }
  // Portal al <body>: el menú vive dentro de contenedores animados que atraparían el «fixed».
  return createPortal(
    <div className="demo-bienv" role="dialog" aria-modal="true" aria-label="Bienvenida a la demo">
      <div className="demo-bienv-caja">
        {local.logo && !sinLogo && <img className="demo-bienv-logo" src={local.logo} alt={local.nombre} onError={() => setSinLogo(true)} />}
        <p className="demo-bienv-kicker">Demo de Appetic</p>
        <h1>Así funcionaría tu restaurante</h1>
        <p className="demo-bienv-lead">
          <b>{local.nombre}</b> es un restaurante de prueba. Haz pedidos, cambia precios, ponle tus colores:
          todo funciona de verdad y <b>nada se daña</b>.
        </p>

        {onRecorrido && (
          <button className="demo-bienv-recorrido" onClick={recorrido}>
            <span className="demo-bienv-play" aria-hidden="true">▶</span>
            <span><b>Hacer el recorrido guiado</b><small>3 minutos · te muestro todo, paso a paso</small></span>
          </button>
        )}

        <div className="demo-bienv-opciones">
          <button onClick={cliente}>
            <span className="demo-bienv-ic" aria-hidden="true">🙋</span>
            <b>Ver como cliente</b>
            <small>El menú con fotos y cómo se pide</small>
          </button>
          <button onClick={duenio}>
            <span className="demo-bienv-ic" aria-hidden="true">👔</span>
            <b>Ver como dueño</b>
            <small>Mesero, cocina, domicilios, precios y colores</small>
          </button>
        </div>

        <button className="demo-bienv-quiero" onClick={() => quieroEsto(local)}>💬 Quiero esto para mi negocio</button>
      </div>
    </div>,
    document.body,
  )
}
