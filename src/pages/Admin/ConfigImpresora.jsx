import { useMemo, useRef, useState } from 'react'
import { tiene } from '../../utils/plan'
import { Candado } from './PlanAvisos'
import { ticketDe, renglones, anchoEnLetras } from '../../utils/impresora/documento'
import { PanelHero, PanelTarjeta, PanelSwitch, PanelGuardar } from './PanelPagina'
import './ConfigPagos.css'
import './Impresora.css'

// 🖨️ CONFIGURACIÓN → IMPRESORA (guía «Mejoras frente a Loggro» D6 y S8). Opcional: el dueño la
// prende si quiere papel. Aquí se decide QUÉ se imprime y cómo se ve el ticket; la impresora la
// conecta cada aparato desde su pantalla (botón 🖨️ en la Caja y en la Cocina).
// Diseño (guía «Diseño de pantallas del panel», 8-nov): el interruptor va en el encabezado; a un lado
// «Qué se imprime», al otro «Cómo se ve el ticket» con la muestra del papel. La lógica no cambió.
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
  const inicial = useRef(JSON.stringify(cfg))
  const sinGuardar = JSON.stringify(cfg) !== inicial.current
  const hero = chips => <PanelHero icono="🖨️" titulo="Impresora" sub="Comandas en papel para la cocina y el ticket del cliente en la caja" chips={chips}
    derecha={tiene(local, 'impresora') ? <PanelSwitch grande titulo="Usamos impresora térmica" texto={cfg.activa ? 'Cada aparato la conecta con el botón 🖨️' : 'Apagada: no se imprime nada'} checked={cfg.activa} onChange={v => cambiar({ activa: v })} /> : null} />

  if (!tiene(local, 'impresora')) return <div className="cp cp2">{hero([])}<Candado local={local} funcion="impresora" /></div>

  async function guardar() {
    setEstado('guardando')
    try {
      await onUpdate({ impresion: { ...cfg, ancho: Number(cfg.ancho), encabezado: cfg.encabezado.slice(0, 200), pie: cfg.pie.slice(0, 200) } })
      inicial.current = JSON.stringify(cfg)
      setEstado('ok')
    } catch { setEstado('error') }
  }

  return (
    <div className="cp cp2 imp2">
      {hero(cfg.activa ? [
        { t: `● Encendida · ${cfg.ancho} mm`, tono: 'ok' },
        conCocina ? { t: cfg.comandas ? '🍳 Comandas en papel' : '🍳 Sin comandas', tono: cfg.comandas ? null : 'off' } : null,
        { t: cfg.ticket ? '🧾 Ticket del cliente' : '🧾 Sin ticket', tono: cfg.ticket ? null : 'off' },
      ] : [{ t: 'Apagada', tono: 'off' }])}

      {!cfg.activa ? (
        <div className="pp-vacio">
          <span aria-hidden="true">🖨️</span>
          <b>No usas impresora</b>
          <p className="pp-ayuda">Es opcional. Si la prendes, las comandas salen en papel en la cocina y el cliente recibe su ticket en la caja. No hay que instalar nada: cada aparato la conecta con el botón 🖨️ de su pantalla.</p>
          <button type="button" className="btn btn-primary" onClick={() => cambiar({ activa: true })}>Usar impresora</button>
        </div>
      ) : (
        <div className="imp2-cuerpo">
          <PanelTarjeta icono="✅" titulo="Qué se imprime">
            <div className="pp-sub imp2-que">
              {conCocina && <PanelSwitch titulo="🍳 Comandas en la cocina" texto="Cada comanda nueva sale sola en la impresora de la cocina, y otra vez si el mesero la cambia." checked={cfg.comandas} onChange={v => cambiar({ comandas: v })} />}
              <PanelSwitch titulo="🧾 Ticket del cliente en la caja" texto="Al cobrar, y cuando lo pidan desde Ventas. Es un comprobante de pago, no una factura electrónica." checked={cfg.ticket} onChange={v => cambiar({ ticket: v })} />
            </div>
            <div className="pp-sub">
              <h4 className="imp2-h4">📏 Ancho del papel</h4>
              <div className="imp2-anchos" role="radiogroup" aria-label="Ancho del papel">
                {[58, 80].map(a => (
                  <button type="button" key={a} role="radio" aria-checked={Number(cfg.ancho) === a} className={Number(cfg.ancho) === a ? 'on' : ''} onClick={() => cambiar({ ancho: a })}>
                    <b>{a} mm</b><small>{a === 58 ? 'La pequeña, la más común' : 'La ancha, de restaurante'}</small>
                  </button>
                ))}
              </div>
            </div>
          </PanelTarjeta>

          {cfg.ticket && (
            <PanelTarjeta icono="🧾" titulo="Cómo se ve el ticket" sub="Así le sale al cliente. Cambia los textos y míralo al instante.">
              <div className="imp-config">
                <div className="imp-campos">
                  <label className="pp-campo"><span>Debajo del nombre <small>NIT, dirección o teléfono. Hasta 4 renglones.</small></span>
                    <textarea rows={3} maxLength={200} value={cfg.encabezado} placeholder={'NIT 900.123.456-7\nCra 10 # 20-30'} onChange={e => cambiar({ encabezado: e.target.value })} />
                  </label>
                  <label className="pp-campo"><span>Al final <small>Un mensaje para el cliente.</small></span>
                    <textarea rows={2} maxLength={200} value={cfg.pie} onChange={e => cambiar({ pie: e.target.value })} />
                  </label>
                </div>
                <div className={`imp-papel a${cfg.ancho}`} aria-label="Así se verá el ticket">
                  {muestra.map((r, k) => <div key={k} className={[r.grande && 'g', r.negrita && 'b', r.centro && 'c'].filter(Boolean).join(' ')}>{r.texto || ' '}</div>)}
                </div>
              </div>
            </PanelTarjeta>
          )}
        </div>
      )}

      <PanelGuardar sinGuardar={sinGuardar} estado={estado} onGuardar={guardar} />
    </div>
  )
}
