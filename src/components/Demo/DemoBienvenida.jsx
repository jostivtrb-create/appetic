import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { marcarBienvenida, quieroEsto } from './demoUtils'
import { SERVICIOS, ORDEN_SERVICIOS, iniciarRecorrido } from './Recorrido'
import './Demo.css'

// 👋 Bienvenida de la demo: lo primero que ve quien abre el link. Muestra los 5 SERVICIOS de la
// propuesta, con su mismo número, nombre e ícono (guía «Demo de clientes» D19): quien llega con el
// papel en la mano encuentra lo que acaba de leer. Cada uno es un recorrido guiado; al terminar
// ofrece el siguiente.
export default function DemoBienvenida({ local, onCerrar }) {
  const [sinLogo, setSinLogo] = useState(false)
  // Mientras está abierta, el menú de atrás no se mueve.
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [])
  const empezar = id => { marcarBienvenida(); iniciarRecorrido(id); onCerrar() }
  const soloMirar = () => { marcarBienvenida(); onCerrar() }
  // Portal al <body>: el menú vive dentro de contenedores animados que atraparían el «fixed».
  return createPortal(
    <div className="demo-bienv" role="dialog" aria-modal="true" aria-label="Bienvenida a la demo">
      <div className="demo-bienv-caja">
        {local.logo && !sinLogo && <img className="demo-bienv-logo" src={local.logo} alt={local.nombre} onError={() => setSinLogo(true)} />}
        <p className="demo-bienv-kicker">Demo de Appetic</p>
        <h1>Así funcionaría tu negocio</h1>
        <p className="demo-bienv-lead">
          <b>{local.nombre}</b> es un restaurante de prueba: todo funciona de verdad y <b>nada se daña</b>.
          Elige uno de los 5 servicios y te guío paso a paso.
        </p>

        <ol className="demo-bienv-procesos">
          {ORDEN_SERVICIOS.map((id, i) => {
            const s = SERVICIOS[id]
            return (
              <li key={id}>
                <button className={i === 0 ? 'primero' : ''} onClick={() => empezar(id)}>
                  <span className="demo-bienv-num" aria-hidden="true">{s.num}</span>
                  <img className="demo-bienv-icono" src={s.icono} alt="" aria-hidden="true" />
                  <span className="demo-bienv-txt"><b>{s.nombre}</b><small>{s.resumen}</small></span>
                  <span className="demo-bienv-ir" aria-hidden="true">▶</span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="demo-bienv-pie">
          <button className="demo-bienv-mirar" onClick={soloMirar}>Solo mirar el menú</button>
          <button className="demo-bienv-quiero" onClick={() => quieroEsto()}>💬 Quiero esto para mi negocio</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
