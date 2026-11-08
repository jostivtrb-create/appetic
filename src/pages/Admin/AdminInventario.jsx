import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { cop } from '../../utils/money'
import { ms } from '../../services/comandas'
import { inventarioDe, motivoErrorInventario } from '../../services/inventario'
import { UNIDADES, cantidadTxt, costoTxt, aBase, estadoInsumo, porAcabarse, costoPlato, mensajePedido } from '../../utils/inventario'
import { coloresComanda } from './comandaUtils'
import { horaCorta, etiquetaJornada, jornadaDe } from '../../utils/jornada'
import { primerNombre } from './CajaVentas'
import { conTope } from '../../utils/conTope'
import { PanelHero, PanelCuerpo, PanelLado, useEntrar } from './PanelPagina'
import './Caja.css'
import './Inventario.css'

// 📦 INVENTARIO (guía «Mejoras frente a Loggro» paso 4 · guía «Paquetes» D5 y D13). Solo el dueño.
//   📦 Insumos     → lo que hay, el mínimo y el costo; tocar uno para editarlo o anotar una merma.
//   🍳 Recetas     → cuánto gasta cada plato; con eso, su costo y su ganancia.
//   🧮 Contar      → conteo físico: se escribe lo que hay de verdad y queda el ajuste.
//   🚚 Proveedores → la lista, y pedirle por WhatsApp lo que se está acabando.
// Las COMPRAS entran desde el gasto de la Caja (D7) y las VENTAS descuentan solas (receta × cantidad).
// Cuando algo llega al mínimo solo se AVISA (D8): aquí y en la cabecera de la Caja.
// Diseño (guía «Diseño de pantallas del panel», 8-nov): encabezado con el resumen; las 4 partes son la
// lista de la izquierda (en el celular, lista que entra al detalle). Lo de adentro no cambió.
const VISTAS = [
  { id: 'insumos', ico: '📦', label: 'Insumos', nota: 'Lo que hay, el mínimo y el costo' },
  { id: 'recetas', ico: '🍳', label: 'Recetas', nota: 'Cuánto gasta cada plato' },
  { id: 'contar', ico: '🧮', label: 'Contar', nota: 'Conteo físico y ajuste' },
  { id: 'proveedores', ico: '🚚', label: 'Proveedores', nota: 'Pedirles por WhatsApp' },
]
const ESTADO = { ok: { t: 'Bien', c: 'ok' }, bajo: { t: 'Por acabarse', c: 'bajo' }, agotado: { t: 'Agotado', c: 'agotado' } }
const TIPO_MOV = { compra: '🛒 Compra', conteo: '🧮 Conteo', merma: '🗑️ Merma', ajuste: '✏️ Ajuste' }
const precioDe = p => Number(p?.precio) || 0
const grande = u => !!UNIDADES[u]?.grande
const enGrande = (n, u) => (grande(u) ? (Number(n) || 0) / UNIDADES[u].factor : Number(n) || 0)
const etiquetaGrande = u => UNIDADES[u]?.grande || 'und'

export default function AdminInventario({ local, productos = [], demo, usuario }) {
  const api = useMemo(() => inventarioDe(local.id, { demo }), [local.id, demo])
  const [vista, setVista] = useState('insumos')
  const [insumos, setInsumos] = useState(null)
  const [recetas, setRecetas] = useState({})
  const [proveedores, setProveedores] = useState([])
  const [error, setError] = useState('')
  useEffect(() => api.escucharInsumos(setInsumos, e => setError(motivoErrorInventario(e))), [api])
  useEffect(() => api.escucharRecetas(setRecetas, () => {}), [api])
  useEffect(() => api.escucharProveedores(setProveedores, () => {}), [api])
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }
  const activos = (insumos || []).filter(i => i.activo !== false)
  const porId = useMemo(() => Object.fromEntries((insumos || []).map(i => [i.id, i])), [insumos])
  const faltan = porAcabarse(insumos)
  const valor = activos.reduce((s, i) => s + Math.max(0, Number(i.stock) || 0) * (Number(i.costoUnit) || 0), 0)
  const comun = { local, api, insumos: activos, porId, recetas, proveedores, por, productos }

  const entrar = useEntrar()
  const elegir = id => { setVista(id); entrar.abrir() }
  const actual = VISTAS.find(v => v.id === vista)

  return (
    <div className={`pv inv inv2${entrar.abierto ? ' pp-dentro' : ''}`} style={coloresComanda(local).vars}>
      <PanelHero miga={local.nombre} icono="📦" titulo="Inventario" sub="Lo que compras para cocinar, lo que gasta cada plato y lo que se está acabando" chips={[
        { t: `📦 ${activos.length} insumos` },
        { t: faltan.length ? `⚠️ ${faltan.length} por acabarse` : '✓ Nada por acabarse', tono: faltan.length ? 'aviso' : 'ok' },
        { t: `💰 Lo que hay vale ${cop(valor)}` },
      ]} />
      {error && <p className="pv-error" role="alert">{error}</p>}

      <PanelCuerpo entrar={entrar} titulo={actual.label} lado={
        <PanelLado icono="📦" titulo="Inventario" sel={vista} onSel={elegir} grupos={[{ items: VISTAS.map(v => ({
          id: v.id, icono: v.ico, nombre: v.label,
          nota: v.id === 'insumos' && faltan.length ? `${faltan.length} por acabarse` : v.nota,
          tono: v.id === 'insumos' && faltan.length ? 'aviso' : null,
          n: v.id === 'insumos' ? activos.length : v.id === 'proveedores' ? proveedores.length : null,
        })) }]} />
      }>
        <div className="inv2-trabajo">
          {vista === 'insumos' && <Insumos {...comun} cargando={insumos === null} todos={insumos || []} faltan={faltan} />}
          {vista === 'recetas' && <Recetas {...comun} />}
          {vista === 'contar' && <Contar {...comun} />}
          {vista === 'proveedores' && <Proveedores {...comun} />}
        </div>
      </PanelCuerpo>
    </div>
  )
}

// Hoja (ventana de abajo) en el body: así no hereda estilos de donde se abra.
function Hoja({ titulo, onCerrar, children }) {
  return createPortal(
    <div className="pv-hoja-fondo centro inv-hoja-fondo" onClick={onCerrar}>
      <div className="pv-hoja inv-hoja" role="dialog" aria-modal="true" aria-label={titulo} onClick={e => e.stopPropagation()}>
        <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={onCerrar}>✕</button>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>, document.body)
}

// ─────────────────────────────── 📦 Insumos ───────────────────────────────
function Insumos({ local, api, insumos, todos, faltan, proveedores, por, cargando }) {
  const [editando, setEditando] = useState(null) // insumo | 'nuevo'
  const [verInactivos, setVerInactivos] = useState(false)
  const [movs, setMovs] = useState(null)
  useEffect(() => api.escucharMovimientos(setMovs, () => setMovs([]), 30), [api])
  const lista = verInactivos ? todos : insumos
  const hoy = jornadaDe(Date.now(), local.horario)
  return (
    <div className="pv-panel">
      {faltan.length > 0 && (
        <div className="inv-aviso" role="status">
          <b>⚠️ {faltan.length === 1 ? 'Se está acabando 1 insumo' : `Se están acabando ${faltan.length} insumos`}</b>
          <span>{faltan.map(i => i.nombre).join(' · ')}</span>
        </div>
      )}
      <div className="pv-panel-cab">
        <h2 className="pv-panel-titulo">📦 Lo que hay</h2>
        <button type="button" className="pv-mandar" onClick={() => setEditando('nuevo')}>＋ Nuevo insumo</button>
      </div>
      <div className="pv-card inv-lista">
        {cargando ? <p className="pv-vacio">Cargando…</p>
          : !lista.length ? <p className="pv-vacio">Todavía no hay insumos. Agrega lo que compras para cocinar: carne, papa, pan, gaseosas…</p>
            : lista.map(i => {
              const e = ESTADO[estadoInsumo(i)]
              const tope = Math.max(Number(i.minimo) * 3, Number(i.stock), 1)
              return (
                <button type="button" key={i.id} className={`inv-fila${i.activo === false ? ' inactivo' : ''}`} onClick={() => setEditando(i)}>
                  <span className="inv-fila-nombre"><b>{i.nombre}</b><small>{i.costoUnit ? costoTxt(i.costoUnit, i.unidad) : 'Sin costo todavía'}{i.minimo ? ` · mínimo ${cantidadTxt(i.minimo, i.unidad)}` : ''}</small></span>
                  <span className="inv-fila-stock">
                    <b>{cantidadTxt(i.stock, i.unidad)}</b>
                    <span className={`inv-barra ${e.c}`}><i style={{ width: `${Math.max(0, Math.min(100, (Number(i.stock) / tope) * 100))}%` }} /></span>
                  </span>
                  <span className={`inv-chip ${e.c}`}>{e.t}</span>
                </button>
              )
            })}
      </div>
      {todos.some(i => i.activo === false) && (
        <button type="button" className="pv-link" onClick={() => setVerInactivos(v => !v)}>{verInactivos ? 'Ocultar los que ya no se usan' : 'Ver los que ya no se usan'}</button>
      )}
      <p className="pv-nota">Las compras se anotan en <b>Caja → Gastos</b> («Es compra de insumos»): suman aquí y actualizan el costo. Cada venta descuenta lo que diga la receta de sus platos.</p>

      <h2 className="pv-panel-titulo">Últimos movimientos</h2>
      <div className="pv-card pv-ventas">
        {movs === null ? <p className="pv-vacio">Cargando…</p>
          : !movs.length ? <p className="pv-vacio">Aquí salen las compras, los conteos y las mermas.</p>
            : movs.map((m, k, arr) => {
              const j = jornadaDe(ms(m.en) || Date.now(), local.horario)
              const jAnt = k ? jornadaDe(ms(arr[k - 1].en) || Date.now(), local.horario) : null
              return (
                <Fragment key={m.id}>
                  {j !== jAnt && <div className="pv-dia"><span>{etiquetaJornada(j, hoy)}</span></div>}
                  <div className="pv-venta pv-gasto-fila">
                    <span className="pv-venta-hora">{horaCorta(ms(m.en))}</span>
                    <span className="pv-venta-info"><b>{TIPO_MOV[m.tipo] || m.tipo} · {m.nombre}</b><small>{primerNombre(m.por)}{m.motivo ? ` · ${m.motivo}` : ''}{m.monto ? ` · ${cop(m.monto)}` : ''}</small></span>
                    <span className={`pv-venta-total${m.cantidad > 0 ? ' cu-mas' : ''}`}>{m.cantidad > 0 ? '+' : ''}{cantidadTxt(m.cantidad, m.unidad)}</span>
                  </div>
                </Fragment>
              )
            })}
      </div>
      {editando && <InsumoHoja api={api} insumo={editando === 'nuevo' ? null : editando} proveedores={proveedores} por={por} onCerrar={() => setEditando(null)} />}
    </div>
  )
}

function InsumoHoja({ api, insumo, proveedores, por, onCerrar }) {
  const nuevo = !insumo
  const [f, setF] = useState(() => ({
    nombre: insumo?.nombre || '', unidad: insumo?.unidad || 'g',
    minimo: insumo ? String(enGrande(insumo.minimo, insumo.unidad) || '') : '',
    stock: '', costo: '', proveedorId: insumo?.proveedorId || '', activo: insumo?.activo !== false,
  }))
  const [merma, setMerma] = useState(null) // { cantidad, motivo }
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const u = f.unidad, eg = etiquetaGrande(u)
  const cambiar = c => { setF(x => ({ ...x, ...c })); setError('') }

  async function guardar(e) {
    e.preventDefault()
    if (!f.nombre.trim() || estado) return
    setEstado('guardando')
    try {
      const stockBase = aBase(f.stock, u, grande(u))
      const costoUnit = stockBase > 0 && Number(f.costo) > 0 ? Number(String(f.costo).replace(/\D/g, '')) / stockBase : 0
      await conTope(api.guardarInsumo({ id: insumo?.id, nombre: f.nombre, unidad: u, minimo: aBase(f.minimo, u, grande(u)), proveedorId: f.proveedorId, activo: f.activo, ...(nuevo ? { stock: stockBase, costoUnit } : {}) }), 12000)
      onCerrar()
    } catch (err) { setError(motivoErrorInventario(err)); setEstado('') }
  }
  async function anotarMerma() {
    const c = aBase(merma.cantidad, u, grande(u))
    if (!(c > 0) || !merma.motivo.trim() || estado) return
    setEstado('merma')
    try { await conTope(api.merma(insumo.id, c, merma.motivo, por), 12000); onCerrar() }
    catch (err) { setError(motivoErrorInventario(err)); setEstado('') }
  }

  return (
    <Hoja titulo={nuevo ? 'Nuevo insumo' : insumo.nombre} onCerrar={onCerrar}>
      {merma ? (
        <div className="inv-form">
          <p className="pv-nota">Lo que se dañó, se botó o se usó sin venderse. Sale del inventario y queda anotado.</p>
          <label>¿Cuánto? ({eg})<input inputMode="decimal" autoFocus value={merma.cantidad} onChange={e => setMerma(m => ({ ...m, cantidad: e.target.value }))} placeholder="0" /></label>
          <label>¿Por qué?<input maxLength={100} value={merma.motivo} onChange={e => setMerma(m => ({ ...m, motivo: e.target.value }))} placeholder="Ej.: se dañó, se quemó, se cayó" /></label>
          <div className="pv-eliminar-acc">
            <button type="button" className="pv-link" onClick={() => setMerma(null)}>Volver</button>
            <button type="button" className="pv-peligro" disabled={!(aBase(merma.cantidad, u, grande(u)) > 0) || !merma.motivo.trim() || !!estado} onClick={anotarMerma}>{estado === 'merma' ? 'Anotando…' : 'Anotar merma'}</button>
          </div>
        </div>
      ) : (
        <form className="inv-form" onSubmit={guardar}>
          <label>Nombre<input maxLength={50} autoFocus={nuevo} value={f.nombre} onChange={e => cambiar({ nombre: e.target.value })} placeholder="Ej.: Carne de res, Papa criolla, Pan de hamburguesa" /></label>
          {nuevo ? (
            <div className="inv-unidades" role="radiogroup" aria-label="Cómo se mide">
              <small>Se mide en</small>
              {Object.values(UNIDADES).map(x => (
                <button type="button" key={x.id} role="radio" aria-checked={u === x.id} className={u === x.id ? 'on' : ''} onClick={() => cambiar({ unidad: x.id })}>{x.grande ? `${x.grande} / ${x.corta}` : 'Unidades'}</button>
              ))}
            </div>
          ) : <p className="pv-nota">Hay {cantidadTxt(insumo.stock, u)} · {insumo.costoUnit ? costoTxt(insumo.costoUnit, u) : 'sin costo todavía'}</p>}
          {nuevo && (
            <div className="inv-dos">
              <label>¿Cuánto hay hoy? ({eg})<input inputMode="decimal" value={f.stock} onChange={e => cambiar({ stock: e.target.value })} placeholder="0" /></label>
              <label>¿Cuánto costó eso?<input inputMode="numeric" value={f.costo ? cop(Number(String(f.costo).replace(/\D/g, ''))) : ''} onChange={e => cambiar({ costo: e.target.value })} placeholder="$0 (opcional)" /></label>
            </div>
          )}
          <label>Avisar cuando quede ({eg})<input inputMode="decimal" value={f.minimo} onChange={e => cambiar({ minimo: e.target.value })} placeholder="Ej.: 2" /></label>
          {proveedores.length > 0 && (
            <label>Proveedor
              <select value={f.proveedorId} onChange={e => cambiar({ proveedorId: e.target.value })}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </label>
          )}
          {!nuevo && (
            <label className="inv-check"><input type="checkbox" checked={!f.activo} onChange={e => cambiar({ activo: !e.target.checked })} /> Ya no lo usamos (se oculta de la lista)</label>
          )}
          {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
          <div className="pv-eliminar-acc">
            {!nuevo ? <button type="button" className="pv-link peligro" onClick={() => setMerma({ cantidad: '', motivo: '' })}>🗑️ Anotar merma</button> : <span />}
            <button className="pv-cobrar inv-guardar" disabled={!f.nombre.trim() || !!estado}>{estado ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      )}
    </Hoja>
  )
}

// ─────────────────────────────── 🍳 Recetas ───────────────────────────────
function Recetas({ api, insumos, porId, recetas, productos }) {
  const [abierto, setAbierto] = useState(null)
  const [buscar, setBuscar] = useState('')
  const lista = productos.filter(p => !buscar || p.nombre?.toLowerCase().includes(buscar.toLowerCase()))
  return (
    <div className="pv-panel">
      <p className="pv-nota">Cuánto gasta <b>una</b> unidad de cada plato. Con eso, cada venta descuenta sus insumos y ves cuánto te cuesta y cuánto te deja.</p>
      {!insumos.length && <p className="inv-aviso suave">Primero agrega tus insumos en la pestaña 📦 Insumos.</p>}
      <input className="inv-buscar" placeholder="Buscar plato…" value={buscar} onChange={e => setBuscar(e.target.value)} />
      <div className="pv-card inv-lista">
        {!lista.length ? <p className="pv-vacio">No hay platos.</p> : lista.map(p => {
          const r = recetas[p.id], costo = r ? costoPlato(r, porId) : 0, precio = precioDe(p)
          const margen = precio > 0 && r ? Math.round(((precio - costo) / precio) * 100) : null
          return (
            <button type="button" key={p.id} className="inv-fila" onClick={() => setAbierto(p)} disabled={!insumos.length}>
              <span className="inv-fila-nombre"><b>{p.nombre}</b><small>{r?.items?.length ? r.items.map(x => porId[x.insumoId]?.nombre).filter(Boolean).join(', ') : 'Sin receta'}</small></span>
              <span className="inv-fila-stock">{r?.items?.length ? <><b>{cop(costo)}</b><small>cuesta · vale {cop(precio)}</small></> : <small>{cop(precio)}</small>}</span>
              {margen != null ? <span className={`inv-chip ${margen >= 50 ? 'ok' : margen >= 25 ? 'bajo' : 'agotado'}`}>Deja {margen}%</span> : <span className="inv-chip">＋ Receta</span>}
            </button>
          )
        })}
      </div>
      {abierto && <RecetaHoja api={api} producto={abierto} receta={recetas[abierto.id]} insumos={insumos} porId={porId} onCerrar={() => setAbierto(null)} />}
    </div>
  )
}

function RecetaHoja({ api, producto, receta, insumos, porId, onCerrar }) {
  const [filas, setFilas] = useState(() => (receta?.items || []).map(x => ({ insumoId: x.insumoId, cantidad: String(x.cantidad) })))
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const limpias = filas.filter(x => x.insumoId && Number(String(x.cantidad).replace(',', '.')) > 0).map(x => ({ insumoId: x.insumoId, cantidad: Number(String(x.cantidad).replace(',', '.')) }))
  const costo = costoPlato({ items: limpias }, porId), precio = precioDe(producto)
  const cambiar = (k, c) => setFilas(l => l.map((x, i) => (i === k ? { ...x, ...c } : x)))
  async function guardar() {
    if (estado) return
    setEstado('guardando')
    try { await conTope(api.guardarReceta(producto.id, limpias), 12000); onCerrar() }
    catch (err) { setError(motivoErrorInventario(err)); setEstado('') }
  }
  return (
    <Hoja titulo={`Receta · ${producto.nombre}`} onCerrar={onCerrar}>
      <p className="pv-nota">Lo que gasta <b>una</b> unidad. Las cantidades van en gramos, mililitros o unidades.</p>
      <div className="inv-receta">
        {filas.map((x, k) => {
          const ins = porId[x.insumoId]
          return (
            <div key={k} className="inv-receta-fila">
              <select value={x.insumoId} onChange={e => cambiar(k, { insumoId: e.target.value })} aria-label="Insumo">
                <option value="">Elige el insumo…</option>
                {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
              <input inputMode="decimal" value={x.cantidad} onChange={e => cambiar(k, { cantidad: e.target.value })} placeholder="0" aria-label="Cantidad" />
              <span className="inv-receta-u">{ins ? UNIDADES[ins.unidad]?.corta : ''}</span>
              <button type="button" className="pv-x-mini" aria-label="Quitar" onClick={() => setFilas(l => l.filter((_, i) => i !== k))}>✕</button>
            </div>
          )
        })}
        <button type="button" className="pv-link" onClick={() => setFilas(l => [...l, { insumoId: '', cantidad: '' }])}>＋ Agregar insumo</button>
      </div>
      <div className="inv-costo">
        <div><span>Le cuesta</span><b>{cop(costo)}</b></div>
        <div><span>Se vende en</span><b>{cop(precio)}</b></div>
        <div><span>Te deja</span><b className={precio - costo < 0 ? 'inv-rojo' : ''}>{cop(precio - costo)}{precio > 0 ? ` · ${Math.round(((precio - costo) / precio) * 100)}%` : ''}</b></div>
      </div>
      {limpias.some(x => !porId[x.insumoId]?.costoUnit) && <p className="pv-nota">Algún insumo todavía no tiene costo: se calcula con la primera compra.</p>}
      {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
      <button type="button" className="pv-cobrar" disabled={!!estado} onClick={guardar}>{estado ? 'Guardando…' : 'Guardar receta'}</button>
    </Hoja>
  )
}

// ─────────────────────────────── 🧮 Contar ───────────────────────────────
function Contar({ api, insumos, por }) {
  const [reales, setReales] = useState({})
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const cambios = insumos.filter(i => reales[i.id] !== undefined && reales[i.id] !== '')
    .map(i => ({ i, real: aBase(reales[i.id], i.unidad, grande(i.unidad)) }))
    .filter(x => Math.abs(x.real - (Number(x.i.stock) || 0)) > 0.0001)
  async function guardar() {
    if (!cambios.length || estado) return
    setEstado('guardando'); setError('')
    try {
      for (const { i, real } of cambios) await conTope(api.contar(i.id, real, por), 12000)
      setReales({}); setEstado('ok'); setTimeout(() => setEstado(''), 2500)
    } catch (err) { setError(motivoErrorInventario(err)); setEstado('') }
  }
  return (
    <div className="pv-panel">
      <p className="pv-nota">Cuenta lo que hay de verdad y escríbelo. La app corrige el inventario y deja anotada la diferencia. Lo que dejes vacío no se toca. Hazlo cada semana: las porciones nunca son exactas.</p>
      <div className="pv-card inv-lista">
        {!insumos.length ? <p className="pv-vacio">Todavía no hay insumos.</p> : insumos.map(i => {
          const r = reales[i.id], dif = r !== undefined && r !== '' ? aBase(r, i.unidad, grande(i.unidad)) - (Number(i.stock) || 0) : null
          return (
            <div key={i.id} className="inv-fila inv-contar">
              <span className="inv-fila-nombre"><b>{i.nombre}</b><small>La app dice {cantidadTxt(i.stock, i.unidad)}</small></span>
              <label className="inv-contar-in"><input inputMode="decimal" value={r ?? ''} onChange={e => setReales(x => ({ ...x, [i.id]: e.target.value }))} placeholder="Hay…" aria-label={`Cuánto hay de ${i.nombre}`} /><small>{etiquetaGrande(i.unidad)}</small></label>
              <span className={`inv-dif${dif == null || Math.abs(dif) < 0.0001 ? '' : dif > 0 ? ' mas' : ' menos'}`}>{dif == null ? '' : Math.abs(dif) < 0.0001 ? '✓' : `${dif > 0 ? '+' : ''}${cantidadTxt(dif, i.unidad)}`}</span>
            </div>
          )
        })}
      </div>
      {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
      {estado === 'ok' && <p className="pv-ok" role="status">✓ Conteo guardado</p>}
      <button type="button" className="pv-cobrar" disabled={!cambios.length || estado === 'guardando'} onClick={guardar}>
        {estado === 'guardando' ? 'Guardando…' : cambios.length ? `Guardar conteo · ${cambios.length} ${cambios.length === 1 ? 'cambio' : 'cambios'}` : 'Guardar conteo'}
      </button>
    </div>
  )
}

// ─────────────────────────────── 🚚 Proveedores ───────────────────────────────
function Proveedores({ local, api, insumos, proveedores }) {
  const [editando, setEditando] = useState(null)
  function pedir(p) {
    const suyos = insumos.filter(i => i.proveedorId === p.id || (p.insumos || []).includes(i.id))
    const bajos = suyos.filter(i => estadoInsumo(i) !== 'ok')
    const lineas = (bajos.length ? bajos : suyos).map(i => i.nombre)
    let tel = String(p.whatsapp || '').replace(/\D/g, '')
    if (tel.length === 10) tel = `57${tel}`
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensajePedido(local, p, lineas))}`, '_blank', 'noopener')
  }
  return (
    <div className="pv-panel">
      <div className="pv-panel-cab">
        <h2 className="pv-panel-titulo">🚚 Tus proveedores</h2>
        <button type="button" className="pv-mandar" onClick={() => setEditando('nuevo')}>＋ Nuevo proveedor</button>
      </div>
      <div className="pv-card inv-lista">
        {!proveedores.length ? <p className="pv-vacio">Agrega a quien le compras: su WhatsApp y qué te surte. Así le pides lo que se está acabando con un toque.</p>
          : proveedores.map(p => {
            const suyos = insumos.filter(i => i.proveedorId === p.id || (p.insumos || []).includes(i.id))
            const bajos = suyos.filter(i => estadoInsumo(i) !== 'ok')
            return (
              <div key={p.id} className="inv-fila inv-prov">
                <button type="button" className="inv-fila-nombre inv-prov-txt" onClick={() => setEditando(p)}><b>{p.nombre}</b><small>{suyos.length ? suyos.map(i => i.nombre).join(', ') : 'Sin insumos asignados'}</small></button>
                {bajos.length > 0 && <span className="inv-chip bajo">{bajos.length} por pedir</span>}
                <button type="button" className="inv-wa" disabled={!p.whatsapp || !suyos.length} onClick={() => pedir(p)}>📲 Pedir</button>
              </div>
            )
          })}
      </div>
      <p className="pv-nota">«Pedir» abre WhatsApp con la lista de lo que se está acabando (o todo lo que te surte, si nada está bajo). Lo revisas y lo envías.</p>
      {editando && <ProveedorHoja api={api} proveedor={editando === 'nuevo' ? null : editando} insumos={insumos} onCerrar={() => setEditando(null)} />}
    </div>
  )
}

function ProveedorHoja({ api, proveedor, insumos, onCerrar }) {
  const [f, setF] = useState({ nombre: proveedor?.nombre || '', whatsapp: proveedor?.whatsapp || '', insumos: proveedor?.insumos || insumos.filter(i => proveedor && i.proveedorId === proveedor.id).map(i => i.id) })
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const alternar = id => setF(x => ({ ...x, insumos: x.insumos.includes(id) ? x.insumos.filter(y => y !== id) : [...x.insumos, id] }))
  async function guardar(e) {
    e.preventDefault()
    if (!f.nombre.trim() || estado) return
    setEstado('guardando')
    try { await conTope(api.guardarProveedor({ id: proveedor?.id, ...f }), 12000); onCerrar() }
    catch (err) { setError(motivoErrorInventario(err)); setEstado('') }
  }
  return (
    <Hoja titulo={proveedor ? proveedor.nombre : 'Nuevo proveedor'} onCerrar={onCerrar}>
      <form className="inv-form" onSubmit={guardar}>
        <label>Nombre<input maxLength={60} value={f.nombre} onChange={e => setF(x => ({ ...x, nombre: e.target.value }))} placeholder="Ej.: Carnes Don Pedro" /></label>
        <label>WhatsApp<input inputMode="tel" maxLength={20} value={f.whatsapp} onChange={e => setF(x => ({ ...x, whatsapp: e.target.value }))} placeholder="320 000 0000" /></label>
        {insumos.length > 0 && (
          <div className="inv-surte"><small>¿Qué te surte?</small>
            {insumos.map(i => <button type="button" key={i.id} className={f.insumos.includes(i.id) ? 'on' : ''} aria-pressed={f.insumos.includes(i.id)} onClick={() => alternar(i.id)}>{i.nombre}</button>)}
          </div>
        )}
        {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
        <button className="pv-cobrar" disabled={!f.nombre.trim() || !!estado}>{estado ? 'Guardando…' : 'Guardar'}</button>
      </form>
    </Hoja>
  )
}
