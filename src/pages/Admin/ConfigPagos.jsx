import { useState } from 'react'
import { TIPOS_CUENTA, cuentasDe, emojiCuenta, idCuentaNueva } from '../../utils/cuentasDinero'
import { usaCocina } from '../../services/comandas'
import './ConfigPagos.css'

// 💳 CONFIGURACIÓN → CUENTAS Y PAGOS (guía «Cuentas del negocio» D7, D21, D13/S12).
//   • Las cuentas de dinero del local (Efectivo, Nequi, Bold, Daviplata, el banco…): son a la vez
//     los medios de pago del cobro y los bolsillos con saldo de Cuentas. «El cliente la ve» decide
//     si sale en el checkout. Nada se borra si tiene historia: se le quita «el cliente la ve» o se
//     elimina solo si es nueva (sus ventas viejas dirían «Cuenta borrada»).
//   • ¿Usa pantalla de cocina? Sin cocina, las comandas nacen listas para cobrar.
export default function ConfigPagos({ local, onUpdate }) {
  const [lista, setLista] = useState(() => cuentasDe(local).map(c => ({ ...c })))
  const [cocina, setCocina] = useState(usaCocina(local))
  const [nueva, setNueva] = useState({ nombre: '', tipo: 'transferencia', llave: '' })
  const [estado, setEstado] = useState('')
  const originales = new Set((local.pagos || []).map(c => c.id))

  const cambiar = (id, cambios) => { setLista(l => l.map(c => c.id === id ? { ...c, ...cambios } : c)); setEstado('') }
  const mover = (i, d) => setLista(l => { const n = [...l]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); return n })
  function agregar(e) {
    e.preventDefault()
    if (!nueva.nombre.trim()) return
    setLista(l => [...l, { id: idCuentaNueva(nueva.nombre, l), nombre: nueva.nombre.trim(), tipo: nueva.tipo, alCliente: true, ...(nueva.llave.trim() ? { llave: nueva.llave.trim() } : {}) }])
    setNueva({ nombre: '', tipo: 'transferencia', llave: '' })
    setEstado('')
  }

  const sinNombre = lista.some(c => !c.nombre.trim())
  const ningunaCliente = !lista.some(c => c.alCliente)
  async function guardar() {
    if (sinNombre || ningunaCliente) return
    setEstado('guardando')
    try {
      const pagos = lista.map(c => ({
        id: c.id, nombre: c.nombre.trim(), tipo: c.tipo, alCliente: c.alCliente !== false,
        ...(c.llave?.trim() ? { llave: c.llave.trim() } : {}),
      }))
      await onUpdate({ pagos, usaCocina: cocina })
      setEstado('ok')
    } catch { setEstado('error') }
  }

  return (
    <div className="cp">
      <section className="cp-card">
        <h3>Cuentas de dinero</h3>
        <p className="cp-ayuda">Donde entra la plata de cada venta. El cajero escoge una al cobrar y en <b>Cuentas</b> ves cuánto hay en cada una. Las que tienen 👁 también le salen al cliente para escoger cómo paga.</p>
        <ul className="cp-lista">
          {lista.map((c, i) => (
            <li key={c.id} className="cp-cuenta">
              <span className="cp-emoji" aria-hidden="true">{emojiCuenta(c)}</span>
              <div className="cp-campos">
                <input aria-label="Nombre de la cuenta" value={c.nombre} maxLength={30} onChange={e => cambiar(c.id, { nombre: e.target.value })} />
                <div className="cp-fila">
                  <select aria-label="Tipo" value={c.tipo} onChange={e => cambiar(c.id, { tipo: e.target.value })}>
                    {TIPOS_CUENTA.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.nombre}</option>)}
                  </select>
                  {c.tipo === 'transferencia' && (
                    <input aria-label="Número o llave" placeholder="Número o llave (opcional)" value={c.llave || ''} maxLength={40} onChange={e => cambiar(c.id, { llave: e.target.value })} />
                  )}
                </div>
                <label className="cp-check">
                  <input type="checkbox" checked={c.alCliente} onChange={e => cambiar(c.id, { alCliente: e.target.checked })} />
                  👁 El cliente la ve al pedir
                </label>
              </div>
              <div className="cp-acc">
                <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
                <button type="button" disabled={i === lista.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">↓</button>
                {!originales.has(c.id) && lista.length > 1 && (
                  <button type="button" onClick={() => setLista(l => l.filter(x => x.id !== c.id))} aria-label={`Quitar ${c.nombre}`}>🗑</button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <form className="cp-nueva" onSubmit={agregar}>
          <input placeholder="Nueva cuenta: Bold, Daviplata, Bancolombia…" value={nueva.nombre} maxLength={30} onChange={e => setNueva(n => ({ ...n, nombre: e.target.value }))} />
          <select aria-label="Tipo de la nueva cuenta" value={nueva.tipo} onChange={e => setNueva(n => ({ ...n, tipo: e.target.value }))}>
            {TIPOS_CUENTA.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.nombre}</option>)}
          </select>
          <button className="btn btn-ghost" disabled={!nueva.nombre.trim()}>＋ Agregar</button>
        </form>
        <p className="cp-nota">La primera de la lista sale marcada cuando el cliente pide. Las cuentas que ya tienen ventas no se pueden borrar (su historia quedaría sin nombre): si ya no la usas, quítale el 👁.</p>
      </section>

      <section className="cp-card">
        <h3>Cocina</h3>
        <label className="cp-switch">
          <input type="checkbox" checked={cocina} onChange={e => { setCocina(e.target.checked); setEstado('') }} />
          <span><b>Usamos la pantalla de cocina</b><small>Los pedidos pasan por la Cocina y se cobran cuando salen. Si la apagas, cada pedido queda listo para cobrar apenas se toma (ideal para un tráiler o un mostrador).</small></span>
        </label>
      </section>

      <div className="cp-guardar">
        {sinNombre && <p className="cp-aviso">Ponle nombre a todas las cuentas.</p>}
        {ningunaCliente && <p className="cp-aviso">Deja al menos una cuenta que el cliente vea al pedir.</p>}
        <button className="btn btn-primary" disabled={estado === 'guardando' || sinNombre || ningunaCliente} onClick={guardar}>
          {estado === 'guardando' ? 'Guardando…' : estado === 'ok' ? '✓ Guardado' : 'Guardar cambios'}
        </button>
        {estado === 'error' && <p className="cp-aviso">No se pudo guardar. Revisa el internet.</p>}
      </div>
    </div>
  )
}
