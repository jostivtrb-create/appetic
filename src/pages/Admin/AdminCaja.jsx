import { useConMenuDelDia } from '../../utils/useMinuto'
import { useEffect, useMemo, useState } from 'react'
import { comandasDe, motivoError } from '../../services/comandas'
import { cuentasNegocioDe } from '../../services/cuentas'
import { sembrarSiVacio } from '../../services/cuentasEjemplo'
import { cop } from '../../utils/money'
import { jornadaDe } from '../../utils/jornada'
import { cuentasDe } from '../../utils/cuentasDinero'
import { coloresComanda } from './comandaUtils'
import CajaVender from './CajaVender'
import CajaVentas from './CajaVentas'
import CajaGastos from './CajaGastos'
import ContarCaja from './ContarCaja'
import ImpresoraBoton, { useImpresora } from './Impresora'
import { tiene } from '../../utils/plan'
import { inventarioDe } from '../../services/inventario'
import { porAcabarse, cantidadTxt } from '../../utils/inventario'
import './Inventario.css'
import { avisarDemo } from '../../components/Demo/eventosDemo'
import './Cobro.css'
import './Caja.css'

// 💵 CAJA (guía «Cuentas del negocio» D6, D12, D22 y D29): el día del negocio, con el orden del
// POS de La Catrina —cabecera con la plata, pestañas 🛒 Vender · 🧾 Ventas · 💸 Gastos (abajo en
// el celular, arriba en el PC)—. La usan el dueño y el cajero. El cajero NO ve saldos ni ganancia:
// en la cabecera solo ve lo vendido hoy. Lo del mes (Cuentas) es solo del dueño.
//
// Reemplaza a la antigua «Comandas» (guía «Cuenta por mesa»): lo que estaba por cobrar ahora son
// las fichas de cuentas abiertas de Vender.
const VISTAS = [
  { id: 'vender', ico: '🛒', label: 'Vender' },
  { id: 'ventas', ico: '🧾', label: 'Ventas' },
  { id: 'gastos', ico: '💸', label: 'Gastos' },
]
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export default function AdminCaja({ local, productos, demo, usuario, esAdmin }) {
  // 🍲 El almuerzo de hoy también se vende aquí, con precio de mesa o para llevar (S21).
  const { local: localVenta, productos: productosVenta } = useConMenuDelDia(local, productos, 'personal')
  const api = useMemo(() => comandasDe(local.id, { demo }), [local.id, demo])
  const cuentasApi = useMemo(() => cuentasNegocioDe(local.id, { demo }), [local.id, demo])
  // Vista previa: historial y cuentas de ejemplo para que nada salga vacío (S8).
  useMemo(() => { if (demo) sembrarSiVacio(cuentasApi, local, productos) }, [demo, cuentasApi]) // eslint-disable-line react-hooks/exhaustive-deps
  const [vista, setVista] = useState('vender')
  const [contando, setContando] = useState(false)
  const impresora = useImpresora(local, 'caja')
  // 📦 Aviso de recarga (D8): lo que se está acabando, a la vista del dueño y del cajero.
  const conInventario = tiene(local, 'inventario')
  const [faltan, setFaltan] = useState([])
  const [verFaltan, setVerFaltan] = useState(false)
  useEffect(() => conInventario ? inventarioDe(local.id, { demo }).escucharInsumos(l => setFaltan(porAcabarse(l)), () => {}) : undefined, [conInventario, local.id, demo])
  const [porCobrar, setPorCobrar] = useState(null)
  const [errorEscucha, setErrorEscucha] = useState('')
  useEffect(() => api.escucharPorCobrar(l => { setPorCobrar(l); setErrorEscucha('') }, e => setErrorEscucha(motivoError(e))), [api])

  // Cabecera: lo vendido hoy (todos) y los saldos (solo el dueño).
  const hoy = jornadaDe(Date.now(), local.horario)
  const [dia, setDia] = useState(null)
  const [saldos, setSaldos] = useState({})
  useEffect(() => cuentasApi.escucharResumen(`d_${hoy}`, setDia, () => {}), [cuentasApi, hoy])
  useEffect(() => esAdmin ? cuentasApi.escucharSaldos(setSaldos, () => {}) : undefined, [cuentasApi, esAdmin])
  const cuentasTop = cuentasDe(local).slice(0, 2)
  const abiertas = new Set((porCobrar || []).map(c => c.destino?.mesa ? `m${c.destino.mesa}` : c.id)).size

  return (
    <div className="pv" style={coloresComanda(local).vars}>
      <header className="pv-top">
        <div className="pv-marca">
          <span className="pv-marca-logo" aria-hidden="true">
            {local.icono || local.logo ? <img src={local.icono || local.logo} alt="" /> : '🍽️'}
          </span>
          <div>
            <b>{local.nombre}</b>
            <small>Caja · {DIAS[new Date().getDay()]}</small>
          </div>
        </div>
        <div className="pv-caja">
          {esAdmin && cuentasTop.map(c => (
            <div key={c.id}><small>{c.tipo === 'efectivo' ? 'En caja' : c.nombre}</small><b>{cop(saldos[c.id] || 0)}</b></div>
          ))}
          <div><small>Hoy · {dia?.nVentas || 0}</small><b>{cop(dia?.ventas || 0)}</b></div>
          <ImpresoraBoton local={local} uso="caja" impresora={impresora} estilo={coloresComanda(local).vars} />
          {tiene(local, 'arqueo') && <button type="button" className="pv-contar" onClick={() => setContando(true)} aria-label="Contar la caja" title="Contar la caja">🧮<span>Contar</span></button>}
        </div>
      </header>

      <nav className={`pv-vistas${vista === 'vender' ? ' con-cobro' : ''}`} aria-label="Secciones de la caja">
        {VISTAS.map(t => (
          <button key={t.id} type="button" className={vista === t.id ? 'on' : ''} aria-current={vista === t.id ? 'page' : undefined}
            onClick={() => { setVista(t.id); avisarDemo(`caja-${t.id}`); window.scrollTo?.({ top: 0, behavior: 'smooth' }) }}>
            <span className="pv-vistas-ico" aria-hidden="true">{t.ico}{t.id === 'vender' && abiertas > 0 && <i>{abiertas}</i>}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {errorEscucha && <p className="pv-error" role="alert">{errorEscucha}</p>}
      {faltan.length > 0 && (
        <button type="button" className="inv-aviso inv-aviso-caja" onClick={() => setVerFaltan(v => !v)} aria-expanded={verFaltan}>
          <b>📦 {faltan.length === 1 ? 'Se está acabando 1 insumo' : `Se están acabando ${faltan.length} insumos`} {verFaltan ? '▲' : '▼'}</b>
          {verFaltan && <span>{faltan.map(i => `${i.nombre}: ${cantidadTxt(i.stock, i.unidad)}`).join(' · ')}</span>}
        </button>
      )}

      {vista === 'vender' && (
        <CajaVender local={localVenta} productos={productosVenta} api={api} cuentasApi={cuentasApi} demo={demo} usuario={usuario} porCobrar={porCobrar} impresora={impresora} />
      )}
      {vista === 'ventas' && <CajaVentas local={local} cuentasApi={cuentasApi} usuario={usuario} esAdmin={esAdmin} impresora={impresora} />}
      {vista === 'gastos' && <CajaGastos local={local} cuentasApi={cuentasApi} usuario={usuario} esAdmin={esAdmin} demo={demo} />}
      {contando && <ContarCaja local={local} cuentasApi={cuentasApi} usuario={usuario} esAdmin={esAdmin} onCerrar={() => setContando(false)} />}
    </div>
  )
}
