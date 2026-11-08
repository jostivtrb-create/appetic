import { useEffect, useState } from 'react'
import { cop } from '../../utils/money'
import { ms } from '../../services/comandas'
import { motivoErrorCuentas } from '../../services/cuentas'
import { etiquetaJornada, horaCorta, jornadaDe } from '../../utils/jornada'
import { nombreCuenta, cuentasDe } from '../../utils/cuentasDinero'
import { conTope } from '../../utils/conTope'
import { primerNombre } from './CajaVentas'
import { Diferencia } from './ContarCaja'

// 🧮 Los conteos de la caja que hizo el equipo (guía «Mejoras frente a Loggro» D18). Solo el dueño:
// ve lo contado contra lo que debería haber y, si no cuadra, ajusta el saldo o lo deja así.
export default function ArqueosLista({ local, api, usuario }) {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState('')
  useEffect(() => api.escucharArqueos(setLista, e => setError(motivoErrorCuentas(e)), { n: 8 }), [api])
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }
  const hoy = jornadaDe(Date.now(), local.horario)
  const variasCajas = cuentasDe(local).filter(c => c.tipo === 'efectivo').length > 1

  async function revisar(a, accion) {
    if (ocupado) return
    setOcupado(a.id); setError('')
    try { await conTope(api.revisarArqueo(a, accion, por, local), 12000) }
    catch (e) { setError(motivoErrorCuentas(e)) } finally { setOcupado('') }
  }

  if (!lista?.length && !error) return null
  return (
    <>
      <h2 className="pv-panel-titulo">🧮 Conteos de la caja</h2>
      {error && <p className="pv-error" role="alert">{error}</p>}
      <div className="pv-card pv-ventas">
        {(lista || []).map(a => (
          <div key={a.id} className="pv-venta ca-arqueo">
            <span className="pv-venta-hora">{horaCorta(ms(a.en))}</span>
            <span className="pv-venta-info">
              <b>{cop(a.contado)} contados{variasCajas ? ` · ${nombreCuenta(local, a.cuenta)}` : ''}</b>
              <small>{etiquetaJornada(a.jornada, hoy)} · {primerNombre(a.por)} · debía haber {cop(a.esperado)}</small>
              {a.diferencia !== 0 && (a.revisado
                ? <small>{a.revisado.accion === 'ajustado' ? '✓ Saldo ajustado' : '✓ Dejado así'} por {primerNombre(a.revisado.por)}</small>
                : (
                  <span className="ca-arqueo-acc">
                    <button type="button" className="pv-link" disabled={!!ocupado} onClick={() => revisar(a, 'aceptado')}>Dejar así</button>
                    <button type="button" className="pv-link" disabled={!!ocupado} onClick={() => revisar(a, 'ajustado')}>{ocupado === a.id ? 'Ajustando…' : 'Ajustar el saldo'}</button>
                  </span>
                ))}
            </span>
            <span className="pv-venta-total"><Diferencia valor={a.diferencia} /></span>
          </div>
        ))}
      </div>
    </>
  )
}
