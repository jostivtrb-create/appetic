import { useEffect, useState } from 'react'
import { cop } from '../../utils/money'
import { obtenerEstadisticas } from '../../services/stats'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function fechaCorta(key) {
  if (!key) return ''
  const [, m, d] = key.split('-')
  return `${Number(d)} ${MESES[Number(m) - 1] || ''}`
}

// Datos de ejemplo para el modo demo.
const DEMO = {
  total: { visitas: 312, pedidos: 27, monto: 612000 },
  hoy: { visitas: 18, pedidos: 3, monto: 64000, fecha: 'hoy' },
  dias: [
    { fecha: '2026-06-27', visitas: 18, pedidos: 3, monto: 64000 },
    { fecha: '2026-06-26', visitas: 41, pedidos: 6, monto: 138000 },
    { fecha: '2026-06-25', visitas: 33, pedidos: 5, monto: 92000 },
    { fecha: '2026-06-24', visitas: 27, pedidos: 4, monto: 81000 },
  ],
}

export default function AdminMetricas({ local, demo }) {
  const [data, setData] = useState(null)
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    let activo = true
    async function cargar() {
      if (demo) { setData(DEMO); setEstado('ok'); return }
      const d = await obtenerEstadisticas(local.id)
      if (activo) { setData(d); setEstado('ok') }
    }
    cargar().catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [local.id, demo])

  if (estado === 'cargando') return <div className="local-loading"><div className="local-spinner" /></div>
  if (estado === 'error') return <p className="ap-vacio">No se pudieron cargar las métricas.</p>

  const { hoy, total, dias } = data

  const Tarjetas = ({ d }) => (
    <div className="am-cards">
      <div className="am-card"><span className="am-num">{d.visitas ?? 0}</span><span className="am-label">Visitas</span></div>
      <div className="am-card"><span className="am-num">{d.pedidos ?? 0}</span><span className="am-label">Pedidos</span></div>
      <div className="am-card"><span className="am-num am-money">{cop(d.monto ?? 0)}</span><span className="am-label">Estimado</span></div>
    </div>
  )

  return (
    <div className="am">
      <h3 className="am-sec">Hoy</h3>
      <Tarjetas d={hoy} />

      <h3 className="am-sec">Acumulado</h3>
      <Tarjetas d={total} />

      {dias?.length > 0 && (
        <>
          <h3 className="am-sec">Por día</h3>
          <div className="am-tabla">
            {dias.map(dd => (
              <div key={dd.fecha} className="am-fila">
                <span className="am-fila-fecha">{fechaCorta(dd.fecha)}</span>
                <span className="am-fila-dato">👁️ {dd.visitas ?? 0}</span>
                <span className="am-fila-dato">🛍️ {dd.pedidos ?? 0}</span>
                <span className="am-fila-monto">{cop(dd.monto ?? 0)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="ac-hint">
        * "Visitas" = cuántas personas abrieron tu menú. "Pedidos" y "Estimado" miden lo que te
        enviaron por WhatsApp (intención de compra), no ventas confirmadas.
      </p>
    </div>
  )
}
