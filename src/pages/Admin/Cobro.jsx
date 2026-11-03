import { useEffect, useMemo, useRef, useState } from 'react'
import { cop } from '../../utils/money'
import { cuentasDe, emojiCuenta } from '../../utils/cuentasDinero'
import { motivoErrorCuentas } from '../../services/cuentas'
import './Cobro.css'

// 💵 VENTANA DE COBRO (guía «Cuentas del negocio», D11 + D27). La usan la Caja (Cobrar ya), las
// comandas y la mesa entera. Arma lo que necesita services/cuentas.js → registrarVenta:
//   { pagos [{cuenta, nombre, monto}], propina {valor, cuenta, nombre} | null,
//     descuento {valor, cortesia, motivo} | null, recibido }
//
//   • Medio de pago: las cuentas del local (sale marcada la que el cliente escogió al pedir).
//   • Dividir: dos medios; el segundo se lleva lo que falte.
//   • Descuento (valor o %) o cortesía (todo gratis, con motivo).
//   • Propina: sin · 10 % · otra. Entra a la cuenta del primer pago y NO cuenta como venta (S15).
//   • Efectivo: «paga con» con billetes rápidos → vueltas.
// Enter cobra, Esc cierra.
//
// modo 'cambiar' (historial, D23): solo el medio de pago y un motivo opcional; sin descuento,
// propina ni vueltas (eso ya quedó como se cobró). Devuelve { pagos, propinaCuenta, motivo }.
const BILLETES = [10000, 20000, 50000, 100000]
const numero = t => Number(String(t).replace(/\D/g, '')) || 0

export default function Cobro({ local, titulo, detalle, total, sugerida, onConfirmar, onCerrar, modo = 'cobrar', pagosIniciales = null }) {
  const cambiar = modo === 'cambiar'
  const cuentas = useMemo(() => cuentasDe(local), [local])
  const primera = cuentas.find(c => c.id === sugerida)?.id || cuentas[0].id
  const ini = pagosIniciales || []
  const [c1, setC1] = useState(ini[0]?.cuenta || primera)
  const [dividir, setDividir] = useState(ini.length > 1)
  const [m1, setM1] = useState(ini.length > 1 ? String(ini[0].monto) : '')
  const [c2, setC2] = useState(ini[1]?.cuenta || cuentas.find(c => c.id !== (ini[0]?.cuenta || primera))?.id || primera)
  const [desc, setDesc] = useState('')          // '' | 'valor' | 'cortesia'
  const [descTxt, setDescTxt] = useState('')    // «5000» o «10%»
  const [motivo, setMotivo] = useState('')
  const [propina, setPropina] = useState(0)
  const [propinaOtra, setPropinaOtra] = useState(false)
  const [recibido, setRecibido] = useState('')
  const [estado, setEstado] = useState('')      // '' | cobrando | error
  const [error, setError] = useState('')
  const cobrarRef = useRef(null)

  // ── Las cuentas del cobro ──
  const valorDesc = desc === 'cortesia' ? total
    : desc === 'valor' ? Math.min(total, descTxt.includes('%') ? Math.round(total * numero(descTxt) / 100) : numero(descTxt)) : 0
  const neto = total - valorDesc                       // lo que se vende
  const parte1 = dividir ? Math.min(numero(m1), neto) : neto
  const parte2 = dividir ? neto - parte1 : 0
  const cuenta = id => cuentas.find(c => c.id === id)
  const pagos = neto > 0
    ? [{ cuenta: c1, nombre: cuenta(c1)?.nombre, monto: parte1 }, ...(dividir ? [{ cuenta: c2, nombre: cuenta(c2)?.nombre, monto: parte2 }] : [])]
    : []
  const aCobrar = neto + propina
  // Efectivo que entra (con la propina, si va al efectivo) → vueltas.
  const efectivoParte = pagos.filter(p => cuenta(p.cuenta)?.tipo === 'efectivo').reduce((s, p) => s + p.monto, 0)
    + (cuenta(c1)?.tipo === 'efectivo' ? propina : 0)
  const vueltas = numero(recibido) - efectivoParte

  const faltaMotivo = desc === 'cortesia' && !motivo.trim()
  const divisionMala = dividir && (parte1 <= 0 || parte2 <= 0 || c1 === c2)
  const listo = !faltaMotivo && !divisionMala && estado !== 'cobrando'
    && !(efectivoParte > 0 && recibido && vueltas < 0 && !cambiar)

  async function cobrar() {
    if (!listo) return
    setEstado('cobrando'); setError('')
    try {
      if (cambiar) {
        await onConfirmar({ pagos, propinaCuenta: { cuenta: c1, nombre: cuenta(c1)?.nombre }, motivo })
        return
      }
      await onConfirmar({
        pagos,
        propina: propina > 0 ? { valor: propina, cuenta: c1, nombre: cuenta(c1)?.nombre } : null,
        descuento: valorDesc > 0 ? { valor: valorDesc, cortesia: desc === 'cortesia', motivo } : null,
        recibido: efectivoParte > 0 ? numero(recibido) : 0,
      })
    } catch (e) {
      // El detalle va a la consola: el mensaje de pantalla es genérico y así no se sabe qué pasó.
      console.error('[cobro] no se pudo cobrar:', e?.code || '', e)
      setEstado('error'); setError(motivoErrorCuentas(e))
    }
  }

  // Enter cobra (si no estás escribiendo un motivo), Esc cierra.
  const cobrarFn = useRef(cobrar); cobrarFn.current = cobrar
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') onCerrar()
      if (e.key === 'Enter' && e.target?.tagName !== 'TEXTAREA') { e.preventDefault(); cobrarFn.current() }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onCerrar])

  const Chips = ({ valor, onCambio, excluir }) => (
    <div className="cb-cuentas" role="radiogroup">
      {cuentas.filter(c => c.id !== excluir).map(c => (
        <button key={c.id} role="radio" aria-checked={valor === c.id} className={valor === c.id ? 'on' : ''} onClick={() => onCambio(c.id)}>
          <span aria-hidden="true">{emojiCuenta(c)}</span>{c.nombre}
        </button>
      ))}
    </div>
  )

  return (
    <div className="cb-velo" onClick={onCerrar}>
      <div className="cb" role="dialog" aria-modal="true" aria-label={`Cobrar ${titulo}`} onClick={e => e.stopPropagation()}>
        <header className="cb-cab">
          <div>
            <small>{cambiar ? 'Cambiar el pago' : 'Cobrar'}</small>
            <h2>{titulo}</h2>
          </div>
          <button className="cb-x" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </header>
        {detalle && <p className="cb-detalle">{detalle}</p>}

        {neto > 0 && (
          <section className="cb-sec">
            <div className="cb-sec-cab">
              <h3>¿Cómo paga?</h3>
              {cuentas.length > 1 && (
                <button className="cb-link" onClick={() => { setDividir(d => !d); setM1('') }}>
                  {dividir ? 'Un solo medio' : '➗ Dividir en dos'}
                </button>
              )}
            </div>
            <Chips valor={c1} onCambio={id => { setC1(id); if (id === c2) setC2(cuentas.find(c => c.id !== id)?.id) }} />
            {dividir && (
              <div className="cb-div">
                <label className="cb-campo">
                  <span>En {cuenta(c1)?.nombre}</span>
                  <input inputMode="numeric" autoFocus placeholder="$0" value={m1 ? cop(numero(m1)) : ''} onChange={e => setM1(e.target.value)} />
                </label>
                <p className="cb-resto">El resto, <b>{cop(Math.max(0, parte2))}</b>, en:</p>
                <Chips valor={c2} onCambio={setC2} excluir={c1} />
                {numero(m1) >= neto && <p className="cb-aviso">Si paga todo en {cuenta(c1)?.nombre}, no hace falta dividir.</p>}
              </div>
            )}
          </section>
        )}

        {!cambiar && <section className="cb-sec cb-fila">
          <h3>Descuento</h3>
          <div className="cb-mini" role="radiogroup">
            {[['', 'No'], ['valor', 'Descuento'], ['cortesia', '🎁 Cortesía']].map(([v, t]) => (
              <button key={v} role="radio" aria-checked={desc === v} className={desc === v ? 'on' : ''} onClick={() => { setDesc(v); setDescTxt('') }}>{t}</button>
            ))}
          </div>
        </section>}
        {desc === 'valor' && (
          <div className="cb-desc">
            <input inputMode="text" autoFocus placeholder="$5.000 o 10%" value={descTxt} onChange={e => setDescTxt(e.target.value.replace(/[^\d%]/g, ''))} />
            {[5, 10, 15].map(p => <button key={p} className="cb-chip" onClick={() => setDescTxt(`${p}%`)}>{p}%</button>)}
            {valorDesc > 0 && <span className="cb-menos">− {cop(valorDesc)}</span>}
          </div>
        )}
        {desc && (
          <input className="cb-motivo" maxLength={80} placeholder={desc === 'cortesia' ? '¿Por qué es cortesía? (obligatorio)' : 'Motivo (opcional)'}
            value={motivo} onChange={e => setMotivo(e.target.value)} />
        )}

        {cambiar && (
          <input className="cb-motivo" maxLength={80} placeholder="¿Por qué se cambia? (opcional)" value={motivo} onChange={e => setMotivo(e.target.value)} />
        )}

        {neto > 0 && !cambiar && (
          <section className="cb-sec cb-fila">
            <h3>Propina</h3>
            <div className="cb-mini" role="radiogroup">
              <button role="radio" aria-checked={propina === 0 && !propinaOtra} className={propina === 0 && !propinaOtra ? 'on' : ''} onClick={() => { setPropina(0); setPropinaOtra(false) }}>Sin</button>
              <button role="radio" aria-checked={!propinaOtra && propina > 0} className={!propinaOtra && propina > 0 ? 'on' : ''} onClick={() => { setPropina(Math.round(neto * 0.1 / 100) * 100); setPropinaOtra(false) }}>10 %</button>
              <button role="radio" aria-checked={propinaOtra} className={propinaOtra ? 'on' : ''} onClick={() => { setPropinaOtra(true); setPropina(0) }}>Otra</button>
            </div>
          </section>
        )}
        {propinaOtra && (
          <input className="cb-motivo" inputMode="numeric" autoFocus placeholder="Valor de la propina" value={propina ? cop(propina) : ''} onChange={e => setPropina(numero(e.target.value))} />
        )}
        {propina > 0 && <p className="cb-nota">La propina ({cop(propina)}) entra a {cuenta(c1)?.nombre} pero no se suma como venta.</p>}

        {efectivoParte > 0 && !cambiar && (
          <section className="cb-sec cb-efectivo">
            <h3>Paga con</h3>
            <div className="cb-billetes">
              <button className={numero(recibido) === efectivoParte ? 'on' : ''} onClick={() => setRecibido(String(efectivoParte))}>Exacto</button>
              {BILLETES.filter(b => b > efectivoParte).slice(0, 3).map(b => (
                <button key={b} className={numero(recibido) === b ? 'on' : ''} onClick={() => setRecibido(String(b))}>{cop(b)}</button>
              ))}
              <input inputMode="numeric" placeholder="Otro" value={recibido && !BILLETES.includes(numero(recibido)) && numero(recibido) !== efectivoParte ? cop(numero(recibido)) : ''} onChange={e => setRecibido(e.target.value)} />
            </div>
            {recibido && (vueltas >= 0
              ? <p className="cb-vueltas">Vueltas <b>{cop(vueltas)}</b></p>
              : <p className="cb-aviso">Faltan {cop(-vueltas)} en efectivo.</p>)}
          </section>
        )}

        <div className="cb-total">
          {(valorDesc > 0 || propina > 0) && (
            <div className="cb-cuenta">
              <span>Subtotal</span><span>{cop(total)}</span>
              {valorDesc > 0 && <><span>{desc === 'cortesia' ? 'Cortesía' : 'Descuento'}</span><span>− {cop(valorDesc)}</span></>}
              {propina > 0 && <><span>Propina</span><span>+ {cop(propina)}</span></>}
            </div>
          )}
          {error && <p className="cb-error" role="alert">⚠️ {error}</p>}
          <button ref={cobrarRef} className="cb-cobrar cj-cobrar" disabled={!listo} onClick={cobrar}>
            {estado === 'cobrando' ? (cambiar ? 'Guardando…' : 'Cobrando…')
              : cambiar ? (divisionMala ? 'Reparte el pago entre dos medios' : 'Guardar el cambio')
              : faltaMotivo ? 'Escribe el motivo de la cortesía'
                : divisionMala ? 'Reparte el pago entre dos medios'
                  : aCobrar === 0 ? '🎁 Registrar cortesía'
                    : `Cobrar ${cop(aCobrar)}`}
          </button>
          <small className="cb-ayuda">Enter para cobrar · Esc para cerrar</small>
        </div>
      </div>
    </div>
  )
}
