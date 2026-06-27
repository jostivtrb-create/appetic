import { useEffect, useState } from 'react'
import { cop } from '../../utils/money'

export default function AdminMetricas({ local, demo, obtener }) {
  const [datos, setDatos] = useState(null)
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    let activo = true
    async function cargar() {
      if (demo) { setDatos({ pedidos: 27, monto: 612000 }); setEstado('ok'); return }
      const m = await obtener(local.id)
      if (activo) { setDatos(m); setEstado('ok') }
    }
    cargar().catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [local.id, demo, obtener])

  if (estado === 'cargando') return <div className="local-loading"><div className="local-spinner" /></div>
  if (estado === 'error') return <p className="ap-vacio">No se pudieron cargar las métricas.</p>

  return (
    <div className="am">
      <p className="am-intro">Pedidos enviados a tu WhatsApp desde Appetic.</p>
      <div className="am-cards">
        <div className="am-card">
          <span className="am-num">{datos.pedidos}</span>
          <span className="am-label">Pedidos</span>
        </div>
        <div className="am-card">
          <span className="am-num">{cop(datos.monto)}</span>
          <span className="am-label">Monto estimado</span>
        </div>
      </div>
      <p className="ac-hint">* Mide los pedidos que los clientes te enviaron por WhatsApp (intención de compra), no ventas confirmadas.</p>
    </div>
  )
}
