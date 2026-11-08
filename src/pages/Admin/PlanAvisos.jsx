import { useState } from 'react'
import { WHATSAPP_VENTAS } from '../../config/demo'
import { urlWhatsApp } from '../../utils/whatsapp'
import {
  PLANES, LISTA_PLANES, planDe, planPara, nombrePlan, tiene, estadoPago, fechaCorta, quiereBuscador,
  DIAS_GRACIA,
} from '../../utils/plan'
import { cop } from '../../utils/money'
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
  mesas: { titulo: 'QR por mesa', texto: 'Cada mesa con su QR: el cliente pide desde la mesa y lleva la cuenta de su mesa.' },
}

// 🔒 «Disponible en el plan Comerciante». `compacto`: una línea dentro de otra pantalla.
export function Candado({ local, funcion, compacto = false, titulo }) {
  const plan = PLANES[planPara(funcion)]
  const base = QUE_ES[funcion] || { titulo: 'Esto', texto: '' }
  const q = titulo ? { ...base, titulo } : base
  const pedir = () => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero pasarme al plan ${plan.nombre} de Appetic para tener ${q.titulo.toLowerCase()}.`)
  if (compacto) {
    return (
      <div className="pl-candado-linea">
        <span>🔒 <b>{q.titulo}</b> {titulo ? 'vienen' : 'viene'} en el plan <b>{plan.nombre}</b>.</span>
        <button type="button" className="pl-link" onClick={pedir}>Quiero el plan {plan.nombre}</button>
      </div>
    )
  }
  return (
    <div className="pl-candado">
      <div className="pl-candado-ico" aria-hidden="true">🔒</div>
      <h2>{q.titulo} viene en el plan {plan.nombre}</h2>
      {q.texto && <p>{q.texto}</p>}
      <p className="pl-candado-plan">Tu plan hoy: <b>{nombrePlan(planDe(local))}</b> · El {plan.nombre} cuesta <b>{cop(plan.precio)}</b> al mes.</p>
      <button type="button" className="btn btn-primary" onClick={pedir}>💬 Quiero el plan {plan.nombre}</button>
      <small>Subes cuando quieras, sin cambiar de app ni perder nada.</small>
    </div>
  )
}

// Franja de aviso arriba del panel (solo dueño y superadmin).
export function AvisoPago({ local }) {
  const p = estadoPago(local)
  const pagar = () => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero pagar mi plan ${nombrePlan(planDe(local))} de Appetic.`)
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

// ⚙️ Configuración → Mi plan.
export function MiPlan({ local }) {
  const actual = planDe(local)
  const p = estadoPago(local)
  const bajarA = local.suscripcion?.bajarA
  const siguiente = LISTA_PLANES.find(x => x.nivel === PLANES[actual].nivel + 1)
  const pedir = plan => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero pasarme al plan ${nombrePlan(plan)} de Appetic.`)
  const pagar = () => abrirVentas(`¡Hola! Soy de ${local.nombre} y quiero pagar mi plan ${nombrePlan(actual)} de Appetic.`)
  const estadoTxt = {
    cortesia: 'Sin vencimiento',
    montaje: `En montaje · ${p.dias} ${p.dias === 1 ? 'día' : 'días'} para el primer pago`,
    'al-dia': `Al día · pagado hasta el ${fechaCorta(p.vence)}`,
    'por-vencer': `Vence el ${fechaCorta(p.vence)}`,
    gracia: `Venció el ${fechaCorta(p.vence)} · ${p.dias} ${p.dias === 1 ? 'día' : 'días'} de gracia`,
    cortado: 'Apagado',
  }[p.estado]
  return (
    <div className="pl-mio">
      <section className={`pl-mio-tarjeta pl-estado--${p.estado}`}>
        <span className="pl-mio-eyebrow">Tu plan</span>
        <h3>Plan {nombrePlan(actual)}</h3>
        <p className="pl-mio-precio">{cop(PLANES[actual].precio)} <small>/ mes</small></p>
        <p className="pl-mio-estado">{estadoTxt}</p>
        {bajarA && <p className="ac-hint">Desde tu próximo pago pasas al plan {nombrePlan(bajarA)}.</p>}
        {['por-vencer', 'gracia', 'montaje'].includes(p.estado) && (
          <button type="button" className="btn btn-primary" onClick={pagar}>💬 Pagar mi plan</button>
        )}
      </section>

      <section className="ac-sec">
        <h3>Qué trae cada plan</h3>
        <ul className="pl-escalera">
          {LISTA_PLANES.map(pl => (
            <li key={pl.id} className={pl.id === actual ? 'on' : ''}>
              <div>
                <strong>{pl.nombre}</strong>
                <small>{pl.frase}</small>
              </div>
              <span>{cop(pl.precio)}</span>
              {pl.id === actual && <em>Tu plan</em>}
            </li>
          ))}
        </ul>
        <ul className="pl-trae">
          <li className="si">✓ Menú con fotos y QR, pedidos para recoger por WhatsApp, TV, menú del día, caja y cuentas</li>
          <li className={tiene(local, 'domicilios') ? 'si' : 'no'}>{tiene(local, 'domicilios') ? '✓' : '🔒'} Domicilios con cobro por distancia y domiciliarios</li>
          <li className={tiene(local, 'mesero') ? 'si' : 'no'}>{tiene(local, 'mesero') ? '✓' : '🔒'} Mesero, pantalla de cocina y QR por mesa</li>
        </ul>
        {siguiente && (
          <button type="button" className="btn btn-primary" onClick={() => pedir(siguiente.id)}>💬 Subir al plan {siguiente.nombre}</button>
        )}
        <p className="ac-hint">Sin contratos: mes a mes. Para cambiar de plan o pagar, escríbenos por WhatsApp.</p>
      </section>
    </div>
  )
}

// 🔎 ¿Sale en el buscador de Appetic? (Configuración → Negocio, D6)
export function SalirEnBuscador({ local, onUpdate }) {
  const [on, setOn] = useState(quiereBuscador(local))
  const [msg, setMsg] = useState('')
  const p = estadoPago(local).estado
  async function cambiar() {
    const v = !on
    setOn(v); setMsg('')
    try { await onUpdate({ enBuscador: v }); setMsg('Guardado ✓') } catch { setOn(!v); setMsg('No se pudo guardar') }
  }
  return (
    <section className="ac-sec">
      <h3>🔎 Buscador de Appetic</h3>
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
    </section>
  )
}
