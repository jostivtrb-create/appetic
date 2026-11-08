import { useMemo, useState } from 'react'
import { tiene } from '../../utils/plan'
import { Candado } from './PlanAvisos'
import { ticketDe, renglones, anchoEnLetras } from '../../utils/impresora/documento'
import './ConfigPagos.css'
import './Impresora.css'

// 🖨️ CONFIGURACIÓN → IMPRESORA (guía «Mejoras frente a Loggro» D6 y S8). Opcional: el dueño la
// prende si quiere papel. Aquí se decide QUÉ se imprime y cómo se ve el ticket; la impresora la
// conecta cada aparato desde su pantalla (botón 🖨️ en la Caja y en la Cocina).
const EJEMPLO = {
  en: Date.now(), destino: { tipo: 'mesa', mesa: '4' }, por: { nombre: 'Laura' },
  items: [{ cantidad: 2, nombre: 'Bandeja paisa', precio: 52000, opciones: 'sin cebolla' }, { cantidad: 1, nombre: 'Limonada', precio: 6000 }],
  subtotal: 58000, descuento: null, total: 58000, pagos: [{ nombre: 'Efectivo', cuenta: 'efectivo', monto: 58000 }], recibido: 60000,
}

export default function ConfigImpresora({ local, onUpdate }) {
  const i = local.impresion || {}
  const [cfg, setCfg] = useState({ activa: !!i.activa, ancho: i.ancho || 58, comandas: i.comandas !== false, ticket: i.ticket !== false, encabezado: i.encabezado || '', pie: i.pie ?? '¡Gracias por tu visita!' })
  const [estado, setEstado] = useState('')
  const cambiar = c => { setCfg(x => ({ ...x, ...c })); setEstado('') }
  const conCocina = tiene(local, 'cocina') && local.usaCocina !== false
  const muestra = useMemo(() => renglones(ticketDe(EJEMPLO, local, cfg), anchoEnLetras(cfg.ancho)), [local, cfg])

  if (!tiene(local, 'impresora')) return <Candado local={local} funcion="impresora" />

  async function guardar() {
    setEstado('guardando')
    try {
      await onUpdate({ impresion: { ...cfg, ancho: Number(cfg.ancho), encabezado: cfg.encabezado.slice(0, 200), pie: cfg.pie.slice(0, 200) } })
      setEstado('ok')
    } catch { setEstado('error') }
  }

  return (
    <div className="cp">
      <section className="cp-card">
        <label className="cp-switch">
          <input type="checkbox" checked={cfg.activa} onChange={e => cambiar({ activa: e.target.checked })} />
          <span><b>Usamos impresora térmica</b><small>Para comandas en papel en la cocina y el ticket del cliente en la caja. Sin instalar nada: cada aparato la conecta con el botón 🖨️ de su pantalla.</small></span>
        </label>
      </section>

      {cfg.activa && <>
        <section className="cp-card">
          <h3>Qué se imprime</h3>
          {conCocina && (
            <label className="cp-switch">
              <input type="checkbox" checked={cfg.comandas} onChange={e => cambiar({ comandas: e.target.checked })} />
              <span><b>Comandas en la cocina</b><small>Cada comanda nueva sale sola en la impresora de la cocina, y otra vez si el mesero la cambia.</small></span>
            </label>
          )}
          <label className="cp-switch">
            <input type="checkbox" checked={cfg.ticket} onChange={e => cambiar({ ticket: e.target.checked })} />
            <span><b>Ticket del cliente en la caja</b><small>Al cobrar, y cuando lo pidan desde Ventas. Es un comprobante de pago, no una factura electrónica.</small></span>
          </label>
          <div className="imp-anchos" role="radiogroup" aria-label="Ancho del papel">
            <small>Ancho del papel</small>
            {[58, 80].map(a => (
              <button type="button" key={a} role="radio" aria-checked={Number(cfg.ancho) === a} className={Number(cfg.ancho) === a ? 'on' : ''} onClick={() => cambiar({ ancho: a })}>{a} mm</button>
            ))}
          </div>
        </section>

        {cfg.ticket && (
          <section className="cp-card">
            <h3>Cómo se ve el ticket</h3>
            <div className="imp-config">
              <div className="imp-campos">
                <label>Debajo del nombre <small>NIT, dirección o teléfono. Hasta 4 renglones.</small>
                  <textarea rows={3} maxLength={200} value={cfg.encabezado} placeholder={'NIT 900.123.456-7\nCra 10 # 20-30'} onChange={e => cambiar({ encabezado: e.target.value })} />
                </label>
                <label>Al final <small>Un mensaje para el cliente.</small>
                  <textarea rows={2} maxLength={200} value={cfg.pie} onChange={e => cambiar({ pie: e.target.value })} />
                </label>
              </div>
              <div className={`imp-papel a${cfg.ancho}`} aria-label="Así se verá el ticket">
                {muestra.map((r, k) => <div key={k} className={[r.grande && 'g', r.negrita && 'b', r.centro && 'c'].filter(Boolean).join(' ')}>{r.texto || ' '}</div>)}
              </div>
            </div>
          </section>
        )}
      </>}

      <div className="cp-guardar">
        <button className="btn btn-primary" disabled={estado === 'guardando'} onClick={guardar}>
          {estado === 'guardando' ? 'Guardando…' : estado === 'ok' ? '✓ Guardado' : 'Guardar cambios'}
        </button>
        {estado === 'error' && <p className="cp-aviso">No se pudo guardar. Revisa el internet.</p>}
      </div>
    </div>
  )
}
