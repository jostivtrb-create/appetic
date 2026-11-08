import { useState } from 'react'
import { WHATSAPP_VENTAS } from '../../config/demo'
import { urlWhatsApp } from '../../utils/whatsapp'
import {
  planPara, tiene, estadoPago, fechaCorta, quiereBuscador, paquetesDe, precioMes, nombresPaquetes, paquetesProximos,
  DIAS_GRACIA,
} from '../../utils/plan'
import { cop } from '../../utils/money'
import { PAQUETES, paquete } from '../../utils/paquetes'
import { PanelHero, PanelTarjeta } from './PanelPagina'
import './Plan.css'

// 💳 Lo que el DUEÑO ve de su plan (guía «Planes en la app»):
//   <Candado>      sección que su plan no trae (D18)
//   <AvisoPago>    franja arriba del panel: montaje, por vencer (5 días antes) y gracia (D3)
//   <PanelApagado> el local se cortó: el panel solo muestra esto (D2)
//   <MiPlan>       Configuración → Mi plan (D5)
//   <SalirEnBuscador> interruptor de Configuración → Negocio (D6)
// Todo lleva al WhatsApp de ventas: el plan y los pagos los maneja el superadmin.

const abrirVentas = texto => window.open(urlWhatsApp(WHATSAPP_VENTAS, texto), '_blank', 'noopener')

const QUE_ES = {
  domicilios: { titulo: 'Domicilios', texto: 'Tu cliente pide a domicilio, la app le cobra el envío según la distancia y tu domiciliario tiene su propio panel.' },
  domiciliario: { titulo: 'Domiciliarios', texto: 'Tus domiciliarios entran con su correo y ven los pedidos a domicilio.' },
  mesero: { titulo: 'Mesero', texto: 'Tus meseros toman el pedido en su celular y lo mandan directo a la cocina.' },
  cocina: { titulo: 'Pantalla de cocina', texto: 'Las comandas llegan solas a la tablet de la cocina, en orden y con su reloj.' },
  arqueo: { titulo: 'Contar la caja', texto: 'Cuentan los billetes y monedas cuando quieran y la app les dice si sobra o falta plata.' },
  impresora: { titulo: 'La impresora térmica', texto: 'Las comandas salen en papel en la cocina y el ticket del cliente en la caja, sin instalar nada.' },
  inventario: { titulo: 'El inventario', texto: 'Cada venta descuenta los ingredientes de su receta, te avisa antes de que algo se acabe y le pides al proveedor por WhatsApp.' },
  cuentas: { titulo: 'Las cuentas del negocio', texto: 'Gastos, saldos, nómina y tu ganancia del día y del mes, sin cuaderno ni calculadora.' },
  gastos: { titulo: 'Los gastos', texto: 'Anotas lo que compras y la app lo resta de tu ganancia.' },
  cajero: { titulo: 'Los cajeros', texto: 'Tus cajeros entran con su correo, venden, cobran y anotan gastos.' },
  mesas: { titulo: 'QR por mesa', texto: 'Cada mesa con su QR: el cliente pide desde la mesa y lleva la cuenta de su mesa.' },
}

// 🔒 «Viene en el Paquete Domicilios». `compacto`: una línea dentro de otra pantalla.
export function Candado({ local, funcion, compacto = false, titulo }) {
  const pq = paquete(planPara(funcion))
  const base = QUE_ES[funcion] || { titulo: 'Esto', texto: '' }
  const q = titulo ? { ...base, titulo } : base
  const pedir = () => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero agregar el ${pq.nombre} de Appetic para tener ${q.titulo.toLowerCase()}.`)
  if (compacto) {
    return (
      <div className="pl-candado-linea">
        <span>🔒 <b>{q.titulo}</b> {titulo ? 'vienen' : 'viene'} en el <b>{pq.nombre}</b>.</span>
        <button type="button" className="pl-link" onClick={pedir}>Quiero agregarlo</button>
      </div>
    )
  }
  return (
    <div className="pl-candado">
      <div className="pl-candado-ico" aria-hidden="true">{pq.icono}</div>
      <h2>{q.titulo} viene en el {pq.nombre}</h2>
      {q.texto && <p>{q.texto}</p>}
      <p className="pl-candado-plan">Hoy tienes: <b>{nombresPaquetes(paquetesDe(local))}</b>.</p>
      <button type="button" className="btn btn-primary" onClick={pedir}>💬 Quiero agregar el {pq.nombre}</button>
      <small>Lo sumas cuando quieras, sin cambiar de app ni perder nada.</small>
    </div>
  )
}

// Franja de aviso arriba del panel (solo dueño y superadmin).
export function AvisoPago({ local }) {
  const p = estadoPago(local)
  const pagar = () => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero pagar mi plan de Appetic (${nombresPaquetes(paquetesDe(local))}).`)
  let tono, texto
  if (p.estado === 'montaje') {
    tono = 'info'
    texto = <>🛠️ Estamos montando tu local. Funciona completo, pero <b>se apaga en {p.dias} {p.dias === 1 ? 'día' : 'días'}</b> si no se registra el primer pago.</>
  } else if (p.estado === 'por-vencer') {
    tono = 'aviso'
    texto = <>📅 Tu plan vence el <b>{fechaCorta(p.vence)}</b> ({p.dias === 1 ? 'mañana' : `en ${p.dias} días`}).</>
  } else if (p.estado === 'gracia') {
    tono = 'alerta'
    texto = <>⚠️ Tu plan venció el <b>{fechaCorta(p.vence)}</b>. Tienes {p.dias} {p.dias === 1 ? 'día' : 'días'} más antes de que el menú se apague.</>
  } else return null
  return (
    <div className={`pl-aviso pl-aviso--${tono}`} role="status">
      <span>{texto}</span>
      <button type="button" onClick={pagar}>{p.estado === 'montaje' ? 'Hablar con Appetic' : 'Pagar'}</button>
    </div>
  )
}

// El local se cortó: el dueño solo ve esto; su equipo, que hable con el dueño.
export function PanelApagado({ local, esAdmin }) {
  const p = estadoPago(local)
  const pagar = () => abrirVentas(`¡Hola! Soy de ${local.nombre}: mi plan de Appetic se venció y quiero pagar para volver a prenderlo.`)
  return (
    <div className="pl-apagado">
      <div className="pl-apagado-ico" aria-hidden="true">🔌</div>
      {esAdmin ? (
        <>
          <h1>{local.nombre} está apagado</h1>
          <p>
            {p.vence
              ? <>Tu plan venció el <b>{fechaCorta(p.vence)}</b> y pasaron los {DIAS_GRACIA} días de gracia.</>
              : <>Terminó el tiempo de montaje sin que se registrara el primer pago.</>}
            {' '}Tus clientes ven el menú «temporalmente fuera de servicio».
          </p>
          <p><b>No se borró nada.</b> Apenas pagues, todo vuelve tal cual: menú, pedidos, equipo y cuentas.</p>
          <button type="button" className="btn btn-primary" onClick={pagar}>💬 Pagar y volver a prender</button>
        </>
      ) : (
        <>
          <h1>El panel de {local.nombre} está apagado</h1>
          <p>Por ahora no se pueden tomar pedidos aquí. Habla con el dueño del local.</p>
        </>
      )}
    </div>
  )
}

// ⚙️ Configuración → Mi plan: sus paquetes, lo que paga y lo que le falta (guía «Paquetes», fase B).
export function MiPlan({ local }) {
  const mios = paquetesDe(local)
  const p = estadoPago(local)
  const proximos = paquetesProximos(local)
  const pedir = pq => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero agregar el ${pq.nombre} de Appetic.`)
  const pagar = () => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero pagar mi plan de Appetic (${nombresPaquetes(mios)}).`)
  const estadoTxt = {
    cortesia: 'Sin vencimiento',
    montaje: `En montaje · ${p.dias} ${p.dias === 1 ? 'día' : 'días'} para el primer pago`,
    'al-dia': `Al día · pagado hasta el ${fechaCorta(p.vence)}`,
    'por-vencer': `Vence el ${fechaCorta(p.vence)}`,
    gracia: `Venció el ${fechaCorta(p.vence)} · ${p.dias} ${p.dias === 1 ? 'día' : 'días'} de gracia`,
    cortado: 'Apagado',
  }[p.estado]
  const tono = { cortesia: 'ok', montaje: 'info', 'al-dia': 'ok', 'por-vencer': 'aviso', gracia: 'aviso', cortado: 'aviso' }[p.estado]
  const aPagar = ['por-vencer', 'gracia', 'montaje'].includes(p.estado)
  // Diseño nuevo (guía «Diseño de pantallas del panel», 8-nov): el estado y el precio en el encabezado;
  // los paquetes como tarjetas (los que tienes en verde, los demás con «Agregarlo»).
  return (
    <div className="pl-mio pl2">
      <PanelHero icono="💳" titulo="Mi plan" sub="Tu plan de Appetic, hasta cuándo está pago y qué más puedes agregar" chips={[
        { t: estadoTxt, tono },
        { t: `${mios.length} ${mios.length === 1 ? 'paquete' : 'paquetes'}` },
      ]} derecha={
        <div className={`pl2-precio pl-estado--${p.estado}`}>
          <small>Pagas</small>
          <b>{cop(precioMes(local))}<span> / mes</span></b>
          <em>{nombresPaquetes(mios)}</em>
          {aPagar && <button type="button" className="btn btn-primary" onClick={pagar}>💬 Pagar mi plan</button>}
        </div>
      } />
      {proximos && <p className="pl2-aviso">📅 Desde tu próximo pago quedas con: <b>{nombresPaquetes(proximos)}</b>.</p>}

      <PanelTarjeta icono="📦" titulo="Tus paquetes" sub="Sin contratos: mes a mes. Para agregar o quitar un paquete, o para pagar, escríbenos por WhatsApp.">
        <div className="pp-grid">
          {PAQUETES.map(pq => {
            const lo = mios.includes(pq.id)
            return (
              <article key={pq.id} className={`pl2-paq${lo ? ' si' : ''}`}>
                <span className="pl2-paq-ico" aria-hidden="true">{pq.icono}</span>
                <div className="pl2-paq-txt"><strong>{pq.nombre}</strong><small>{pq.resumen}</small></div>
                {lo ? <span className="pl2-tiene">✓ Lo tienes</span>
                  : <button type="button" className="pp-btn" onClick={() => pedir(pq)}>＋ Agregarlo</button>}
              </article>
            )
          })}
        </div>
      </PanelTarjeta>
    </div>
  )
}

// 🔎 ¿Sale en el buscador de Appetic? (Configuración → Negocio, D6)
// `sinMarco`: solo el interruptor y sus avisos (para meterlo en una tarjeta del diseño nuevo).
export function SalirEnBuscador({ local, onUpdate, sinMarco = false }) {
  const [on, setOn] = useState(quiereBuscador(local))
  const [msg, setMsg] = useState('')
  const p = estadoPago(local).estado
  async function cambiar() {
    const v = !on
    setOn(v); setMsg('')
    try { await onUpdate({ enBuscador: v }); setMsg('Guardado ✓') } catch { setOn(!v); setMsg('No se pudo guardar') }
  }
  const Marco = sinMarco ? 'div' : 'section'
  return (
    <Marco className={sinMarco ? 'pl-buscador' : 'ac-sec'}>
      {!sinMarco && <h3>🔎 Buscador de Appetic</h3>}
      <label className="pl-switch">
        <span>
          <strong>Salir en el buscador</strong>
          <small>
            {on
              ? 'Gente del barrio que no te conoce te puede encontrar en Appetic.'
              : 'No sales en el buscador. Quien entra por tu link o tu QR se queda en tu menú: no ve otros locales.'}
          </small>
        </span>
        <input type="checkbox" checked={on} onChange={cambiar} disabled={!!local.esDemo} />
        <i aria-hidden="true" />
      </label>
      {on && p === 'montaje' && <p className="ac-hint">Vas a aparecer cuando terminemos de montar tu local y se registre el primer pago.</p>}
      {msg && <p className="ac-hint">{msg}</p>}
    </Marco>
  )
}
