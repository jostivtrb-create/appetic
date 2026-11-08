import { useRef, useState } from 'react'
import { TIPOS_CUENTA, cuentasDe, emojiCuenta, idCuentaNueva, linkPagoValido, usaLinkPago } from '../../utils/cuentasDinero'
import { tiene } from '../../utils/plan'
import { Candado } from './PlanAvisos'
import { PanelHero, PanelCuerpo, PanelLado, PanelTarjeta, PanelSwitch, PanelGuardar, useEntrar } from './PanelPagina'
import './ConfigPagos.css'

// 💳 CONFIGURACIÓN → CUENTAS Y PAGOS (guía «Cuentas del negocio» D7, D21, D13/S12).
//   • Las cuentas de dinero del local (Efectivo, Nequi, Bold, Daviplata, el banco…): son a la vez
//     los medios de pago del cobro y los bolsillos con saldo de Cuentas. «El cliente la ve» decide
//     si sale en el checkout. Nada se borra si tiene historia: se le quita «el cliente la ve» o se
//     elimina solo si es nueva (sus ventas viejas dirían «Cuenta borrada»).
//   • ¿Usa pantalla de cocina? Sin cocina, las comandas nacen listas para cobrar.
// Diseño (guía «Diseño de pantallas del panel», 8-nov): las cuentas son la lista de la izquierda
// (en el celular, lista que entra al detalle); a la derecha, la cuenta elegida. La lógica no cambió.
export default function ConfigPagos({ local, onUpdate }) {
  const [lista, setLista] = useState(() => cuentasDe(local).map(c => ({ ...c })))
  // Lo que el dueño eligió (sin mirar el plan): si sube al Empresario, su elección sigue ahí.
  const [cocina, setCocina] = useState(local?.usaCocina !== false)
  const conCocina = tiene(local, 'cocina')
  const conLink = usaLinkPago(local) // el link de pago viene con el Paquete Domicilios
  const [nueva, setNueva] = useState({ nombre: '', tipo: 'transferencia', llave: '' })
  const [estado, setEstado] = useState('')
  // Las cuentas que ya existían no se borran desde aquí (sus ventas y su saldo quedarían «Cuenta
  // borrada»). Incluye el Efectivo implícito de un local que nunca configuró cuentas (auditoría H7).
  const originales = new Set(cuentasDe(local).map(c => c.id))
  const entrar = useEntrar()
  const [sel, setSel] = useState(() => cuentasDe(local)[0]?.id || 'nueva')
  const elegir = id => { setSel(id); entrar.abrir() }
  const foto = JSON.stringify({ lista, cocina })
  const inicial = useRef(foto)
  const sinGuardar = foto !== inicial.current

  const cambiar = (id, cambios) => { setLista(l => l.map(c => c.id === id ? { ...c, ...cambios } : c)); setEstado('') }
  const mover = (i, d) => setLista(l => { const n = [...l]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); return n })
  function agregar(e) {
    e.preventDefault()
    if (!nueva.nombre.trim()) return
    const id = idCuentaNueva(nueva.nombre, lista)
    setLista(l => [...l, { id, nombre: nueva.nombre.trim(), tipo: nueva.tipo, alCliente: true, ...(nueva.llave.trim() ? { llave: nueva.llave.trim() } : {}) }])
    setSel(id)
    setNueva({ nombre: '', tipo: 'transferencia', llave: '' })
    setEstado('')
  }

  const sinNombre = lista.some(c => !c.nombre.trim())
  const linkMalo = conLink && lista.some(c => c.tipo !== 'efectivo' && c.link?.trim() && !linkPagoValido(c.link))
  const ningunaCliente = !lista.some(c => c.alCliente)
  async function guardar() {
    if (sinNombre || ningunaCliente || linkMalo) return
    setEstado('guardando')
    try {
      const pagos = lista.map(c => ({
        id: c.id, nombre: c.nombre.trim(), tipo: c.tipo, alCliente: c.alCliente !== false,
        ...(c.llave?.trim() ? { llave: c.llave.trim() } : {}),
        ...(c.tipo !== 'efectivo' && c.link?.trim() ? { link: c.link.trim() } : {}),
      }))
      await onUpdate({ pagos, usaCocina: cocina })
      inicial.current = foto
      setEstado('ok')
    } catch { setEstado('error') }
  }

  const c = lista.find(x => x.id === sel)
  const i = lista.findIndex(x => x.id === sel)
  const tipoDe = x => TIPOS_CUENTA.find(t => t.id === x.tipo)?.nombre || 'Otra'
  const alCliente = lista.filter(x => x.alCliente).length
  const titulo = c ? c.nombre || 'Cuenta sin nombre' : sel === 'cocina' ? 'Cocina' : 'Nueva cuenta'
  const problema = sinNombre ? 'Ponle nombre a todas las cuentas.' : ningunaCliente ? 'Deja al menos una cuenta que el cliente vea al pedir.' : linkMalo ? 'Revisa los links de pago: deben empezar por https://' : ''

  return (
    <div className={`cp cp2${entrar.abierto ? ' pp-dentro' : ''}`}>
      <PanelHero icono="💳" titulo="Cuentas y pagos" sub="Dónde entra la plata de cada venta y cómo te puede pagar el cliente" chips={[
        { t: `${lista.length} ${lista.length === 1 ? 'cuenta' : 'cuentas'}` },
        { t: `👁 ${alCliente} las ve el cliente`, tono: alCliente ? null : 'aviso' },
        conCocina ? { t: cocina ? '🍳 Con pantalla de cocina' : '🍳 Sin cocina: se cobra al tomar' } : null,
      ]} />

      <PanelCuerpo entrar={entrar} titulo={titulo} lado={
        <PanelLado icono="💳" titulo="Tus cuentas" sel={sel} onSel={elegir} grupos={[
          { items: lista.map(x => ({
            id: x.id, icono: emojiCuenta(x), nombre: x.nombre || 'Sin nombre',
            nota: `${tipoDe(x)} · ${x.alCliente ? '👁 la ve el cliente' : 'solo para ti'}${x.link ? ' · 🔗' : ''}`,
            tono: !x.nombre.trim() ? 'aviso' : x.alCliente ? null : 'off',
          })) },
          { items: [{ id: 'nueva', icono: '＋', nombre: 'Nueva cuenta', nota: 'Bold, Daviplata, Bancolombia…' }] },
          { titulo: 'Ajustes', items: [{ id: 'cocina', icono: '🍳', nombre: 'Cocina', nota: !conCocina ? 'Paquete Cocina' : cocina ? 'Usamos la pantalla de cocina' : 'Sin pantalla de cocina' }] },
        ]} />
      }>
        {c && (
          <PanelTarjeta icono={emojiCuenta(c)} titulo={<>Cuenta: <em>{c.nombre || 'sin nombre'}</em></>}
            sub="Donde entra la plata. El cajero la escoge al cobrar y en Cuentas ves cuánto hay."
            acciones={<>
              <span className="cp2-orden" role="group" aria-label="Orden">
                <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
                <button type="button" disabled={i === lista.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">↓</button>
              </span>
              {!originales.has(c.id) && lista.length > 1 && (
                <button type="button" className="pp-btn cp2-quitar" onClick={() => { setLista(l => l.filter(x => x.id !== c.id)); setSel(lista[0]?.id === c.id ? lista[1]?.id : lista[0]?.id) }}>🗑 Quitar</button>
              )}
            </>}>
            <div className="pp-grid cp2-grid">
              <div className="pp-sub">
                <label className="pp-campo"><span>Nombre</span>
                  <input value={c.nombre} maxLength={30} onChange={e => cambiar(c.id, { nombre: e.target.value })} placeholder="Ej: Nequi" />
                </label>
                <div className="pp-campo"><span>Tipo</span>
                  <div className="cp2-tipos" role="radiogroup" aria-label="Tipo de cuenta">
                    {TIPOS_CUENTA.map(t => (
                      <button key={t.id} type="button" role="radio" aria-checked={c.tipo === t.id} className={c.tipo === t.id ? 'on' : ''} onClick={() => cambiar(c.id, { tipo: t.id })}>
                        <span aria-hidden="true">{t.emoji}</span>{t.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pp-sub">
                {c.tipo === 'transferencia' && (
                  <label className="pp-campo"><span>Número o llave <small>(opcional)</small></span>
                    <input placeholder="Ej: 3001234567" value={c.llave || ''} maxLength={40} onChange={e => cambiar(c.id, { llave: e.target.value })} />
                  </label>
                )}
                {c.tipo !== 'efectivo' && (conLink ? (
                  <label className="pp-campo"><span>🔗 Link de pago <small>(opcional)</small></span>
                    <input type="url" inputMode="url" placeholder="https://…" value={c.link || ''} maxLength={300} className={c.link?.trim() && !linkPagoValido(c.link) ? 'cp2-mal' : ''} onChange={e => cambiar(c.id, { link: e.target.value })} />
                    {c.link?.trim() && !linkPagoValido(c.link) && <small className="cp-link-mal">Pega el link completo, que empiece por https://</small>}
                    <small className="cp2-ayuda">Bold, Wompi, Mercado Pago, tu banco… Si el cliente escoge esta cuenta, le sale el botón para pagar con tu link y subir el comprobante.</small>
                  </label>
                ) : <Candado local={local} funcion="domicilios" titulo="Los links de pago (con comprobante del cliente)" compacto />)}
                <PanelSwitch titulo="👁 El cliente la ve al pedir" texto={c.alCliente ? 'Sale en el menú para escoger cómo paga.' : 'Solo la usas tú (por ejemplo, el banco donde consignas).'}
                  checked={c.alCliente} onChange={v => cambiar(c.id, { alCliente: v })} />
              </div>
            </div>
            <p className="pp-ayuda">La primera de la lista sale marcada cuando el cliente pide. Las cuentas que ya tienen ventas no se pueden borrar (su historia quedaría sin nombre): si ya no la usas, apaga «El cliente la ve».</p>
          </PanelTarjeta>
        )}

        {sel === 'nueva' && (
          <PanelTarjeta icono="＋" titulo="Nueva cuenta" sub="Agrega otra forma de recibir plata: Bold, Daviplata, el banco…">
            <form className="pp-sub cp2-nueva" onSubmit={agregar}>
              <label className="pp-campo"><span>Nombre</span>
                <input placeholder="Ej: Bold" value={nueva.nombre} maxLength={30} onChange={e => setNueva(n => ({ ...n, nombre: e.target.value }))} autoFocus />
              </label>
              <div className="pp-campo"><span>Tipo</span>
                <div className="cp2-tipos" role="radiogroup" aria-label="Tipo de la nueva cuenta">
                  {TIPOS_CUENTA.map(t => (
                    <button key={t.id} type="button" role="radio" aria-checked={nueva.tipo === t.id} className={nueva.tipo === t.id ? 'on' : ''} onClick={() => setNueva(n => ({ ...n, tipo: t.id }))}>
                      <span aria-hidden="true">{t.emoji}</span>{t.nombre}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" disabled={!nueva.nombre.trim()}>＋ Agregar cuenta</button>
            </form>
          </PanelTarjeta>
        )}

        {sel === 'cocina' && (
          <PanelTarjeta icono="🍳" titulo="Cocina" sub="Cómo pasan los pedidos antes de cobrarse.">
            <div className="pp-sub">
              {!conCocina ? <Candado local={local} funcion="cocina" compacto /> : (
                <PanelSwitch titulo="Usamos la pantalla de cocina" checked={cocina} onChange={v => { setCocina(v); setEstado('') }}
                  texto="Los pedidos pasan por la Cocina y se cobran cuando salen. Si la apagas, cada pedido queda listo para cobrar apenas se toma (ideal para un tráiler o un mostrador)." />
              )}
            </div>
          </PanelTarjeta>
        )}

        <PanelGuardar sinGuardar={sinGuardar} estado={estado} problema={problema} onGuardar={guardar} />
      </PanelCuerpo>
    </div>
  )
}
