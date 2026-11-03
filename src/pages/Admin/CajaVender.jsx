import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cop } from '../../utils/money'
import { tieneOpciones, precioItem } from '../../utils/price'
import { resumenSeleccion } from '../../utils/selectionSummary'
import {
  itemsDeComanda, etiquetaDestino, claveMesa, ms, nuevoIdComanda, usaCocina, itemsVivos,
} from '../../services/comandas'
import { pedidosDe } from '../../services/pedidos'
import { llevaTurno } from '../../utils/turnos'
import ProductModal from '../../components/Menu/ProductModal'
import ProductWizard from '../../components/Menu/ProductWizard'
import { useEsEscritorio } from '../../utils/useEsEscritorio'
import { Teclado } from './Teclado'
import Cobro from './Cobro'
import { avisarDemo } from '../../components/Demo/eventosDemo'
import { tiene } from '../../utils/plan'
import { Candado } from './PlanAvisos'

// 🛒 VENDER (Caja, guía «Cuentas del negocio» D6, D19, D20 y D29 — el orden de La Catrina):
//
//   ┌ fichas de CUENTAS: ⚡ Rápida · una por mesa / pedido por cobrar (su color, su total) · ＋ Mesa
//   ├ (celular) lo que se va pidiendo, con − n +
//   ├ buscador · pestañas de categoría (⭐ Frecuentes primero) · cuadrícula de fichas de producto
//   └ TICKET: fijo a la derecha en el PC; en el celular, barra abajo + hoja.
//
// «Rápida» es la venta de mostrador: Cobrar (paga ya y, si hay cocina, la comanda le llega
// pagada) o «Mandar y cobrar después» (queda como una ficha más). Una ficha de mesa junta TODAS
// sus comandas por cobrar: se cobra la mesa entera de una (D20), o comanda por comanda.
// Lo que se le agrega a una mesa abierta se manda a la cocina como comanda nueva.
//
// Sin cocina (D13): las comandas nacen entregadas y todo se puede cobrar ya.
// Atajos en el PC (S23): escribir busca · Enter agrega el primero · F2 cobra · Esc limpia.
//
// modo 'mesero' (D29): la MISMA pantalla para el mesero, sin cobrar: el botón grande es
// «🔥 Enviar a cocina» (a la mesa elegida, o pregunta para dónde va) y F2 envía.

const COLORES = ['#E0692A', '#1E6FD9', '#1B8A4B', '#9C27B0', '#C2185B', '#0F7C8C', '#D97706', '#4F46E5']
const DOMI = '#6A35C9'
const uid = () => Math.random().toString(36).slice(2, 10)
const normalizar = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
const totalComanda = c => (Number(c.total) || 0) + (Number(c.envio) || 0)
function precioDesde(p) {
  if (p.variantes?.length) return cop(Math.min(...p.variantes.map(v => Number(v.precio) || 0)))
  return cop(p.precio)
}

// La clave de la ficha: la mesa (o el nombre) junta varias comandas; lo demás va suelto.
const claveDe = c => claveMesa(c.destino) || `c:${c.id}`
function colorDe(key, destino) {
  if (destino?.tipo === 'domicilio') return DOMI
  let h = 0
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const n = Number(destino?.mesa)
  return COLORES[(n ? n - 1 : h) % COLORES.length]
}
function etiquetaCorta(destino) {
  if (!destino) return 'Cuenta'
  if (destino.tipo === 'domicilio') return `🛵 ${destino.nombre || 'Domicilio'}`
  if (destino.tipo === 'llevar' || destino.tipo === 'recoger') return `🥡 ${destino.nombre || 'Para llevar'}`
  return destino.mesa ? `Mesa ${destino.mesa}` : (destino.nombre || 'Mesa')
}

// Frecuentes por dispositivo (lo que más se vende en ESTA caja), sin leer nada del servidor.
function useFrecuentes(localId) {
  const KEY = `appetic_caja_frecuentes_${localId}`
  const [cuenta, setCuenta] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } })
  const sumar = useCallback(lineas => setCuenta(c => {
    const n = { ...c }
    for (const l of lineas) n[l.producto.id] = (n[l.producto.id] || 0) + l.cantidad
    try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* nada */ }
    return n
  }), [KEY])
  return [cuenta, sumar]
}

export default function CajaVender({ local, productos, api, cuentasApi, demo, usuario, porCobrar, onVenta, modo = 'caja' }) {
  const esMesero = modo === 'mesero'
  const conCocina = usaCocina(local)
  // 🔒 Cuentas por mesa: solo Empresario (guía «Blindaje», respuesta del 3-nov). Los demás dejan la
  // cuenta «para llevar» a nombre de alguien.
  const conMesas = tiene(local, 'mesas')
  const esPC = useEsEscritorio()
  const por = useMemo(() => ({ email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }), [usuario])
  const idsMenu = useMemo(() => new Set(productos.map(p => p.id)), [productos])

  // ── Carritos por cuenta (sobreviven si se cambia de pantalla o se cierra la app) ──
  const KEY = `appetic_${modo}_${local.id}`
  const [guardado, setGuardado] = useState(() => {
    try {
      const g = JSON.parse(localStorage.getItem(KEY) || '{}')
      // Fuera lo que ya no está en el menú, o cuya variante ya no existe (quedaría en $0).
      const vale = it => idsMenu.has(it.producto?.id)
        && (!it.seleccion?.varianteId || (it.producto.variantes || []).some(v => v.id === it.seleccion.varianteId))
      const carts = Object.fromEntries(Object.entries(g.carts || {}).map(([k, l]) => [k, (l || []).filter(vale)]))
      return { carts, nuevas: g.nuevas || [] }
    } catch { return { carts: {}, nuevas: [] } }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(guardado)) } catch { /* nada */ } }, [KEY, guardado])
  const [sel, setSel] = useState('rapida')
  const lineas = guardado.carts[sel] || []
  const setLineas = fn => setGuardado(g => ({ ...g, carts: { ...g.carts, [sel]: typeof fn === 'function' ? fn(g.carts[sel] || []) : fn } }))

  // ── Fichas: lo por cobrar, agrupado por mesa; + las cuentas abiertas que aún no mandan nada ──
  const [domis, setDomis] = useState({})
  const pedidos = useMemo(() => pedidosDe(local.id, { demo }), [local.id, demo])
  useEffect(() => pedidos.escucharDomicilios(l => setDomis(Object.fromEntries(l.map(p => [p.id, p.estado]))), () => {}), [pedidos])

  const hoy0 = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }, [])
  // ¿En qué va cada comanda? y ¿ya se puede cobrar?
  const etapa = useCallback(c => {
    if (c.destino?.tipo === 'domicilio' && c.pedidoId) {
      const e = domis[c.pedidoId]
      if (e === 'listo') return { fin: false, txt: '🛵 Esperando al domiciliario' }
      if (e === 'en-camino') return { fin: false, txt: '🛵 En camino' }
      if (c.estado === 'activa' && conCocina) return { fin: false, txt: '🔥 En cocina' }
      return { fin: true, txt: '✅ Entregado' }
    }
    if (c.estado === 'activa' && conCocina) {
      const vivos = itemsVivos(c), hechos = vivos.filter(it => it.hecho).length
      return { fin: false, txt: hechos ? `🔥 En cocina · ${hechos} de ${vivos.length}` : '🔥 En cocina' }
    }
    return { fin: true, txt: '✅ Lista para cobrar' }
  }, [domis, conCocina])

  const grupos = useMemo(() => {
    const m = new Map()
    for (const c of porCobrar || []) {
      const k = claveDe(c)
      if (!m.has(k)) m.set(k, { key: k, destino: c.destino, comandas: [] })
      m.get(k).comandas.push(c)
    }
    for (const n of guardado.nuevas) if (!m.has(n.key)) m.set(n.key, { key: n.key, destino: n.destino, comandas: [], nueva: true })
    return [...m.values()].map(g => {
      const etapas = g.comandas.map(etapa)
      return {
        ...g,
        color: colorDe(g.key, g.destino),
        total: g.comandas.reduce((s, c) => s + totalComanda(c), 0),
        listo: etapas.every(e => e.fin),
        vieja: g.comandas.some(c => (ms(c.creadaEn) || Date.now()) < hoy0),
      }
    })
  }, [porCobrar, guardado.nuevas, etapa, hoy0])

  // Si la ficha seleccionada desaparece (se cobró en otro dispositivo), se vuelve a Rápida.
  useEffect(() => {
    if (sel !== 'rapida' && porCobrar && !grupos.some(g => g.key === sel)) setSel('rapida')
  }, [grupos, sel, porCobrar])

  const grupo = grupos.find(g => g.key === sel) || null
  const totalNuevo = lineas.reduce((s, it) => s + precioItem(it), 0)
  const unidades = lineas.reduce((s, it) => s + it.cantidad, 0)
  const totalTicket = (grupo?.total || 0) + totalNuevo

  // ── Catálogo ──
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(null)
  const [frec, sumarFrec] = useFrecuentes(local.id)
  const disponibles = useMemo(() => productos.filter(p => p.disponible !== false), [productos])
  const categorias = useMemo(() => (local.categorias || []).filter(c => disponibles.some(p => p.categoria === c.id)), [local.categorias, disponibles])
  const frecuentes = useMemo(() => disponibles.filter(p => frec[p.id]).sort((a, b) => frec[b.id] - frec[a.id]).slice(0, 8), [disponibles, frec])
  const pestanas = useMemo(() => [
    ...(frecuentes.length ? [{ id: 'frec', label: '⭐ Frecuentes' }] : []),
    ...categorias.map(c => ({ id: c.id, label: `${c.emoji ? `${c.emoji} ` : ''}${c.nombre}` })),
  ], [frecuentes.length, categorias])
  const pestana = pestanas.find(t => t.id === cat) || pestanas[0]
  const resultados = useMemo(() => {
    const t = normalizar(q)
    return t ? disponibles.filter(p => normalizar(`${p.nombre} ${p.descripcion || ''}`).includes(t)) : null
  }, [q, disponibles])
  const visibles = resultados
    || (pestana?.id === 'frec' ? frecuentes : disponibles.filter(p => p.categoria === pestana?.id).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)))

  const [abierto, setAbierto] = useState(null)   // producto con opciones
  const cantidadDe = id => lineas.filter(it => it.producto.id === id).reduce((s, it) => s + it.cantidad, 0)
  function tocar(p) {
    if (tieneOpciones(p)) { setAbierto(p); return }
    if (esMesero) avisarDemo('mesero-plato')
    setLineas(c => {
      const i = c.findIndex(it => it.producto.id === p.id && !it.comentario && !Object.keys(it.seleccion || {}).length)
      if (i >= 0) return c.map((it, j) => j === i ? { ...it, cantidad: it.cantidad + 1 } : it)
      return [...c, { uid: uid(), producto: p, seleccion: {}, cantidad: 1, comentario: '' }]
    })
  }
  function menos(p) {
    setLineas(c => {
      const i = c.map(it => it.producto.id).lastIndexOf(p.id)
      if (i < 0) return c
      return c[i].cantidad > 1 ? c.map((it, j) => j === i ? { ...it, cantidad: it.cantidad - 1 } : it) : c.filter((_, j) => j !== i)
    })
  }
  const cambiarLinea = (id, cambios) => setLineas(c => c.map(it => it.uid === id ? { ...it, ...cambios } : it).filter(it => it.cantidad > 0))
  // Si ya hay una línea idéntica (mismo plato, mismas opciones, sin nota), se suma ahí.
  function agregarDesdeModal({ producto, seleccion, cantidad, notas }) {
    const firma = JSON.stringify(seleccion || {})
    setLineas(c => {
      const i = notas ? -1 : c.findIndex(it => it.producto.id === producto.id && !it.comentario && JSON.stringify(it.seleccion || {}) === firma)
      if (i >= 0) return c.map((it, j) => j === i ? { ...it, cantidad: it.cantidad + cantidad } : it)
      return [...c, { uid: uid(), producto, seleccion, cantidad, comentario: notas || '' }]
    })
    setAbierto(null)
    if (esMesero) avisarDemo('mesero-plato')
  }

  // ── Avisos ──
  const [toast, setToast] = useState('')
  const toastT = useRef(null)
  const avisar = t => { setToast(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(''), 3200) }
  const [error, setError] = useState('')
  // El turno que se acaba de dar: se muestra en grande para decírselo al cliente.
  const [turnoDado, setTurnoDado] = useState(null)

  // ── Mandar (a cocina o a «por cobrar») ──
  const [enviando, setEnviando] = useState(false)
  const idRef = useRef(null)   // mismo id en los reintentos: nunca queda una comanda repetida
  async function crearComanda(destino, lista) {
    if (!idRef.current) idRef.current = nuevoIdComanda(api)
    const id = idRef.current
    const origen = esMesero ? 'mesero' : 'caja'
    // 🔔 Para llevar con «Pedidos listos» prendidos: número de turno del día (S17).
    const turno = llevaTurno(local, destino, origen) ? await api.tomarTurno(id) : null
    await api.crear({ id, destino, items: itemsDeComanda(lista), creadaPor: por, origen, entregada: !conCocina, turno })
    idRef.current = null
    return { id, turno }
  }
  async function mandar(destino) {
    const dest = destino || grupo?.destino
    if (!lineas.length || !dest || enviando) return
    setEnviando(true); setError('')
    try {
      const lista = lineas
      const { id, turno } = await crearComanda(dest, lista)
      sumarFrec(lista)
      setGuardado(g => {
        const carts = { ...g.carts, [sel]: [] }
        return { carts, nuevas: g.nuevas.filter(n => n.key !== sel) }
      })
      setSel(claveMesa(dest) || `c:${id}`)
      if (turno) setTurnoDado({ turno, nombre: dest.nombre || '' })
      else avisar(conCocina ? `✓ Enviada a cocina · ${etiquetaDestino(dest)}` : `✓ ${etiquetaDestino(dest)} queda por cobrar`)
      avisarDemo('comanda-mesero')
    } catch {
      setError('No se envió. Revisa el internet y vuelve a intentar: no se va a repetir.')
    } finally { setEnviando(false) }
  }

  // ── Comandas atascadas: «Ya salió» (la cocina no la marcó) o cancelarla ──
  const [cancelando, setCancelando] = useState(null)
  async function yaSalio(c) {
    try {
      await api.entregar(c)
      if (c.pedidoId) pedidos.cambiarEstado(c.pedidoId, 'listo').catch(() => {})
    } catch { setError('No se pudo marcar. Revisa el internet.') }
  }
  async function cancelarComanda(c) {
    setCancelando(null)
    try {
      await api.cancelar(c, por)
      if (c.pedidoId) pedidos.cambiarEstado(c.pedidoId, 'rechazado').catch(() => {})
      avisar(`Comanda de ${etiquetaDestino(c.destino)} cancelada`)
    } catch { setError('No se pudo cancelar. Revisa el internet.') }
  }

  // ── Cobrar ──
  const [cobro, setCobro] = useState(null)   // { comandas, conLineas, titulo }
  // La comanda que este cobro ya mandó a la cocina. Si después falla guardar la venta, el reintento
  // usa ESA y no manda otra (antes cada intento dejaba una comanda repetida en la cocina).
  const comandaDelCobro = useRef(null)
  function abrirCobro(soloComanda = null) {
    comandaDelCobro.current = null
    if (soloComanda) { setCobro({ comandas: [soloComanda], conLineas: false, titulo: etiquetaDestino(soloComanda.destino) }); return }
    if (!lineas.length && !grupo?.comandas.length) return
    if (grupo && !grupo.listo) return
    setCobro({ comandas: grupo?.comandas || [], conLineas: true, titulo: grupo ? etiquetaDestino(grupo.destino) : 'Venta rápida' })
  }
  const totalCobro = cobro ? cobro.comandas.reduce((s, c) => s + totalComanda(c), 0) + (cobro.conLineas ? totalNuevo : 0) : 0
  const sugerida = cobro?.comandas.find(c => c.pagoSugerido)?.pagoSugerido

  async function confirmarCobro(datos) {
    const lista = cobro.conLineas ? lineas : []
    const comandas = [...cobro.comandas]
    // Lo nuevo, si hay cocina, también tiene que llegarle (ya pagado).
    // (crearComanda devuelve { id, turno }: antes se guardaba el objeto entero como id y la venta
    // fallaba con «No se pudo guardar» en todo local con cocina — reporte del 3-nov.)
    let turno = null
    if (lista.length && conCocina) {
      const destino = grupo?.destino || { tipo: 'llevar', mesa: null, nombre: null }
      if (!comandaDelCobro.current) comandaDelCobro.current = await crearComanda(destino, lista)
      comandas.push({ id: comandaDelCobro.current.id })
      turno = comandaDelCobro.current.turno
    }
    const items = [
      ...comandas.filter(c => c.items).flatMap(c => itemsVivos(c).map(it => ({ productoId: it.productoId, nombre: it.nombre, cantidad: it.cantidad, precio: it.precio, opciones: it.opciones }))),
      ...cobro.comandas.filter(c => c.envio > 0).map(c => ({ productoId: '_envio', nombre: 'Envío del domicilio', cantidad: 1, precio: c.envio })),
      ...itemsDeComanda(lista).map(it => ({ productoId: it.productoId, nombre: it.nombre, cantidad: it.cantidad, precio: it.precio, opciones: it.opciones })),
    ]
    const destino = cobro.comandas[0]?.destino || grupo?.destino || null
    await cuentasApi.registrarVenta({
      origen: destino?.tipo === 'mesa' ? 'mesa' : cobro.comandas.length ? 'comanda' : 'caja',
      comandas, items, destino, mesa: destino?.mesa || null,
      ...datos,
    }, por, local)
    if (lista.length) sumarFrec(lista)
    if (cobro.conLineas) setGuardado(g => ({ carts: { ...g.carts, [sel]: [] }, nuevas: g.nuevas.filter(n => n.key !== sel) }))
    const neto = totalCobro - (datos.descuento?.valor || 0)
    comandaDelCobro.current = null
    if (turno) setTurnoDado({ turno, nombre: grupo?.destino?.nombre || '' })
    else avisar(`✓ ${cobro.titulo}: venta de ${cop(neto)} registrada`)
    avisarDemo('cobrada')
    onVenta?.()
    setCobro(null)
    if (cobro.conLineas) setSel('rapida')
  }

  // ── ＋ Mesa / dejar en una mesa ──
  const [abrirCuenta, setAbrirCuenta] = useState(null)   // 'nueva' | 'dejar'
  function elegirDestino(destino) {
    const modo = abrirCuenta
    setAbrirCuenta(null)
    const k = claveMesa(destino)
    if (modo === 'dejar') {
      // Lo de Rápida pasa a esa cuenta y se manda.
      if (k && grupos.some(g => g.key === k)) {
        setGuardado(g => ({ ...g, carts: { ...g.carts, [k]: [...(g.carts[k] || []), ...lineas], rapida: [] } }))
        setSel(k)
        return
      }
      mandar(destino)
      return
    }
    // Ya existe esa mesa: se selecciona. Si no, nace una cuenta vacía con ese destino.
    if (k && grupos.some(g => g.key === k)) { setSel(k); return }
    const key = k || `n:${uid()}`
    setGuardado(g => ({ ...g, nuevas: [...g.nuevas, { key, destino }] }))
    setSel(key)
  }
  function cerrarNueva() {
    setGuardado(g => ({ carts: { ...g.carts, [sel]: [] }, nuevas: g.nuevas.filter(n => n.key !== sel) }))
    setSel('rapida')
  }

  // ── Atajos de teclado (PC) ──
  const buscarRef = useRef(null)
  const [info, setInfo] = useState(null)        // «¿Qué lleva?» de un plato
  const hayModal = !!(abierto || cobro || abrirCuenta || info)
  const enviar = () => { if (!lineas.length) return; if (grupo) mandar(); else setAbrirCuenta('dejar') }
  const accion = useRef({}); accion.current = { abrirCobro: esMesero ? enviar : abrirCobro, tocar, resultados, hayModal }
  useEffect(() => {
    if (!esPC) return
    const k = e => {
      const a = accion.current
      if (a.hayModal) return
      const enCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)
      if (e.key === 'F2') { e.preventDefault(); a.abrirCobro(); return }
      if (e.key === 'Escape') { setQ(''); buscarRef.current?.blur(); return }
      if (enCampo && e.target !== buscarRef.current) return
      if (e.key === 'Enter' && e.target === buscarRef.current && a.resultados?.length) {
        e.preventDefault(); a.tocar(a.resultados[0]); setQ(''); return
      }
      if (!enCampo && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\S/.test(e.key)) {
        buscarRef.current?.focus()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [esPC])

  // ── Piezas ──
  const [verTicket, setVerTicket] = useState(false)
  const selColor = grupo?.color || 'var(--cm-mesa)'
  const nombreSel = grupo ? etiquetaDestino(grupo.destino) : esMesero ? 'Pedido nuevo' : 'Venta rápida'
  const puedeCobrar = (lineas.length || grupo?.comandas.length) && (!grupo || grupo.listo) && !enviando
  const textoCobrar = grupo && !grupo.listo ? 'Se cobra al terminar'
    : `Cobrar ${(lineas.length || grupo?.comandas.length) ? cop(totalTicket) : ''}`

  const Ficha = p => {
    const n = cantidadDe(p.id)
    return (
      <div key={p.id} className={`pv-plato${n ? ' on' : ''}`} role="button" tabIndex={0}
        onClick={() => tocar(p)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocar(p) } }}>
        <span className="pv-plato-nombre">{p.nombre}</span>
        <span className="pv-plato-precio">{tieneOpciones(p) && p.variantes?.length ? 'desde ' : ''}{precioDesde(p)}{tieneOpciones(p) ? ' ›' : ''}</span>
        {p.descripcion && (
          <button type="button" className="pv-plato-info" aria-label={`¿Qué lleva ${p.nombre}?`} title="¿Qué lleva?"
            onClick={e => { e.stopPropagation(); setInfo(p) }}><span aria-hidden="true">i</span></button>
        )}
        {n > 0 && <span className="pv-plato-n">{n}</span>}
        {n > 0 && (
          <button type="button" className="pv-plato-menos" aria-label={`Quitar ${p.nombre}`}
            onClick={e => { e.stopPropagation(); menos(p) }}>−</button>
        )}
      </div>
    )
  }

  // Se llama como función (no como <Ticket />): así sus campos no pierden el foco al escribir.
  const ticket = () => (
    <div className="pv-ticket-in">
      <div className="pv-ticket-head">
        <div style={{ minWidth: 0 }}>
          <small>{grupo ? (grupo.comandas.length ? 'Por cobrar' : 'Cuenta abierta') : 'Sin mesa'}</small>
          <b>{nombreSel}</b>
        </div>
        {grupo?.nueva && !grupo.comandas.length && <button type="button" className="pv-link peligro" onClick={cerrarNueva}>Cerrar</button>}
      </div>

      {grupo?.comandas.map(c => {
        const e = etapa(c)
        const desde = ms(c.creadaEn)
        const otroDia = desde && desde < hoy0
        return (
          <div key={c.id} className={`pv-ya${e.fin ? ' fin' : ''}`}>
            <div className="pv-ya-cab">
              <span>{e.txt}{otroDia ? <small className="pv-otro-dia"> · {new Date(desde).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</small> : null}</span>
              {!esMesero && grupo.comandas.length > 1 && e.fin && <button type="button" className="pv-link" onClick={() => abrirCobro(c)}>Cobrar solo esta</button>}
            </div>
            {itemsVivos(c).map(it => (
              <div className="pv-linea ya" key={it.uid}>
                <div className="pv-linea-nombre">{it.cantidad}× {it.nombre}{it.opciones ? <small>{it.opciones}</small> : null}</div>
                <div className="pv-linea-sub">{cop(it.precio)}</div>
              </div>
            ))}
            {c.envio > 0 && <div className="pv-linea ya"><div className="pv-linea-nombre">Envío</div><div className="pv-linea-sub">{cop(c.envio)}</div></div>}
            {cancelando === c.id ? (
              <div className="pv-ya-acc seguro">
                <span>¿Cancelar esta comanda? No se cobra.</span>
                <button type="button" className="pv-link" onClick={() => setCancelando(null)}>No</button>
                <button type="button" className="pv-link peligro" onClick={() => cancelarComanda(c)}>Sí, cancelar</button>
              </div>
            ) : (
              <div className="pv-ya-acc">
                {c.estado === 'activa' && !e.fin && <button type="button" className="pv-link" onClick={() => yaSalio(c)}>✓ Ya salió de cocina</button>}
                <button type="button" className="pv-link peligro" onClick={() => setCancelando(c.id)}>Cancelar comanda</button>
              </div>
            )}
          </div>
        )
      })}

      {lineas.length === 0
        ? (!grupo?.comandas.length && <p className="pv-vacio">Toca los productos para anotarlos.</p>)
        : (
          <div className="pv-lineas">
            {grupo?.comandas.length > 0 && <p className="pv-nuevo-tit">Para agregar</p>}
            {lineas.map(it => (
              <div className="pv-linea" key={it.uid}>
                <div className="pv-linea-nombre">
                  {it.producto.nombre}
                  <small>{resumenSeleccion(it.producto, it.seleccion) || `${cop(precioItem({ ...it, cantidad: 1 }))} c/u`}</small>
                  {conCocina && (
                    <input className="pv-com" placeholder="💬 Nota para cocina" maxLength={140}
                      value={it.comentario || ''} onChange={e => cambiarLinea(it.uid, { comentario: e.target.value })} />
                  )}
                </div>
                <div className="pv-linea-cant">
                  <button type="button" aria-label="Quitar uno" onClick={() => cambiarLinea(it.uid, { cantidad: it.cantidad - 1 })}>−</button>
                  <b>{it.cantidad}</b>
                  <button type="button" aria-label="Agregar uno" onClick={() => cambiarLinea(it.uid, { cantidad: it.cantidad + 1 })}>+</button>
                </div>
                <div className="pv-linea-sub">{cop(precioItem(it))}</div>
              </div>
            ))}
          </div>
        )}

      <div className="pv-total"><span>Total</span><b>{cop(totalTicket)}</b></div>
      {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
      {esMesero ? (
        <button type="button" className="pv-cobrar" disabled={!lineas.length || enviando} onClick={enviar}>
          {enviando ? 'Enviando…' : !lineas.length ? 'Toca los productos'
            : grupo ? `${conCocina ? '🔥 Enviar a cocina' : 'Anotar'} · ${etiquetaDestino(grupo.destino)}`
              : `${conCocina ? '🔥 Enviar a cocina' : 'Anotar en una cuenta'} · ${cop(totalNuevo)}`}
        </button>
      ) : (
        <>
          {grupo && lineas.length > 0 && (
            <button type="button" className="pv-mandar" disabled={enviando} onClick={() => mandar()}>
              {enviando ? 'Enviando…' : conCocina ? `🔥 Mandar a cocina · +${cop(totalNuevo)}` : `Agregar a la cuenta · +${cop(totalNuevo)}`}
            </button>
          )}
          <button type="button" className="pv-cobrar cj-cobrar" disabled={!puedeCobrar} onClick={() => abrirCobro()}>{textoCobrar}</button>
        </>
      )}
      <div className="pv-ticket-acc">
        {lineas.length > 0 && <button type="button" className="pv-link" onClick={() => setLineas([])}>Vaciar</button>}
        {!esMesero && !grupo && lineas.length > 0 && (
          <button type="button" className="pv-link" onClick={() => setAbrirCuenta('dejar')}>
            {conCocina ? 'Mandar y cobrar después' : conMesas ? 'Dejar en una mesa' : 'Dejar para cobrar después'}
          </button>
        )}
      </div>
      {esPC && <small className="pv-atajos">Escribe para buscar · Enter agrega · F2 {esMesero ? 'envía' : 'cobra'} · Esc limpia</small>}
    </div>
  )

  return (
    <div className="pv-vender" style={{ '--sel': selColor }}>

      <nav className="pv-cuentas" aria-label="Cuentas abiertas">
        <button type="button" className={`pv-cuenta${sel === 'rapida' ? ' on' : ''}`} onClick={() => setSel('rapida')}>
          <b>{esMesero ? '⚡ Nuevo' : '⚡ Rápida'}</b>
          <small>{(guardado.carts.rapida || []).length ? cop((guardado.carts.rapida || []).reduce((s, it) => s + precioItem(it), 0)) : 'sin mesa'}</small>
        </button>
        {grupos.map(g => (
          <button type="button" key={g.key} style={{ '--mesa': g.color }}
            className={`pv-cuenta mesa${sel === g.key ? ' on' : ''}${g.listo && g.comandas.length ? ' lista' : ''}${g.vieja ? ' vieja' : ''}`}
            onClick={() => setSel(g.key)} title={g.vieja ? 'Tiene comandas de días anteriores sin cobrar' : undefined}>
            <b><i className="pv-cuenta-punto" aria-hidden="true" />{etiquetaCorta(g.destino)}</b>
            <small>{g.comandas.length ? `${cop(g.total)}${g.listo ? ' · lista' : ''}` : 'abierta'}{g.vieja ? ' · de otro día' : ''}</small>
          </button>
        ))}
        <button type="button" className="pv-cuenta nueva" onClick={() => setAbrirCuenta('nueva')}>
          <b>{conMesas ? '＋ Mesa' : '＋ Cuenta'}</b>
          <small>abrir cuenta</small>
        </button>
      </nav>

      <div className="pv-main">
        <section className="pv-menu">
          {!esPC && lineas.length > 0 && (
            <div className="pv-pedido" aria-label="Lo que se va pidiendo">
              <ul>
                {lineas.map(it => (
                  <li className="pv-pedido-fila" key={it.uid}>
                    <span className="pv-pedido-paso">
                      <button type="button" aria-label="Quitar uno" onClick={() => cambiarLinea(it.uid, { cantidad: it.cantidad - 1 })}>−</button>
                      <b className="pv-pedido-n">{it.cantidad}</b>
                      <button type="button" className="mas" aria-label="Agregar uno" onClick={() => cambiarLinea(it.uid, { cantidad: it.cantidad + 1 })}>+</button>
                    </span>
                    <span className="pv-pedido-nombre">{it.producto.nombre}</span>
                    <span className="pv-pedido-puntos" aria-hidden="true" />
                    <span className="pv-pedido-valor">{cop(precioItem(it))}</span>
                  </li>
                ))}
              </ul>
              <div className="pv-pedido-total"><span>{unidades} producto{unidades === 1 ? '' : 's'}</span><b>{cop(totalNuevo)}</b></div>
            </div>
          )}

          <div className="pv-buscar">
            <span aria-hidden="true">⌕</span>
            <input ref={buscarRef} type="text" placeholder="Buscar producto…" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar producto" />
            {q && <button type="button" aria-label="Limpiar" onClick={() => setQ('')}>✕</button>}
          </div>

          {!resultados && pestanas.length > 1 && (
            <div className="pv-tabs" role="tablist" aria-label="Categorías">
              {pestanas.map(t => (
                <button type="button" role="tab" key={t.id} aria-selected={pestana?.id === t.id}
                  className={pestana?.id === t.id ? 'on' : ''} onClick={() => setCat(t.id)}>{t.label}</button>
              ))}
            </div>
          )}

          {disponibles.length === 0 ? <p className="pv-vacio">Todavía no hay productos en el catálogo. Agrégalos en Configuración → Catálogo.</p>
            : resultados && !resultados.length ? <p className="pv-vacio">Nada coincide con «{q}».</p>
              : <div className="pv-grid">{visibles.map(Ficha)}</div>}
        </section>

        <aside className="pv-ticket">{ticket()}</aside>
      </div>

      {!esPC && (
        <div className="pv-barra">
          <button type="button" className="pv-barra-info" onClick={() => setVerTicket(true)} aria-label="Ver la cuenta">
            <small>{nombreSel}{lineas.length ? ` · ${unidades} producto${unidades === 1 ? '' : 's'}` : ''}</small>
            <b>{cop(totalTicket)}</b>
          </button>
          <button type="button" className="pv-barra-ver" onClick={() => setVerTicket(true)}>Ver</button>
          {esMesero
            ? <button type="button" className="pv-cobrar" disabled={!lineas.length || enviando} onClick={enviar}>{conCocina ? 'Enviar' : 'Anotar'}</button>
            : <button type="button" className="pv-cobrar" disabled={!puedeCobrar} onClick={() => abrirCobro()}>Cobrar</button>}
        </div>
      )}
      {verTicket && !esPC && (
        <div className="pv-hoja-fondo" onClick={() => setVerTicket(false)}>
          <div className="pv-hoja" onClick={e => e.stopPropagation()} role="dialog" aria-label="Cuenta">
            <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={() => setVerTicket(false)}>✕</button>
            {ticket()}
          </div>
        </div>
      )}

      {abierto && (abierto.modo === 'pasos'
        ? <ProductWizard key={abierto.id} producto={abierto} onCerrar={() => setAbierto(null)} onAgregar={agregarDesdeModal} />
        : <ProductModal key={abierto.id} producto={abierto} compacto textoNotas={conCocina ? 'Nota para cocina' : 'Nota'} onCerrar={() => setAbierto(null)} onAgregar={agregarDesdeModal} />)}

      {abrirCuenta && <AbrirCuenta local={local} conMesas={conMesas} modo={abrirCuenta} conCocina={conCocina} onCerrar={() => setAbrirCuenta(null)} onElegir={elegirDestino} />}

      {cobro && (
        <Cobro
          local={local} titulo={cobro.titulo} total={totalCobro} sugerida={sugerida}
          detalle={cobro.comandas.length > 1 ? `${cobro.comandas.length} comandas${cobro.conLineas && lineas.length ? ' + lo nuevo' : ''}` : null}
          onCerrar={() => setCobro(null)} onConfirmar={confirmarCobro}
        />
      )}

      {info && (
        <div className="pv-hoja-fondo centro" onClick={() => setInfo(null)}>
          <div className="pv-hoja pv-detalle" role="dialog" aria-modal="true" aria-label={`¿Qué lleva ${info.nombre}?`} onClick={e => e.stopPropagation()}>
            <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={() => setInfo(null)}>✕</button>
            <h2>{info.nombre}</h2>
            <p className="pv-nuevo-tit">¿Qué lleva?</p>
            <p>{info.descripcion}</p>
            <button type="button" className="pv-cobrar" onClick={() => { const p = info; setInfo(null); tocar(p) }}>
              {tieneOpciones(info) ? 'Elegir opciones y agregar' : `+ Agregar · ${precioDesde(info)}`}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="pv-toast" role="status">{toast}</div>}
      {turnoDado && (
        <div className="pv-turno-capa" role="dialog" aria-label="Turno del pedido" onClick={() => setTurnoDado(null)}>
          <div className="pv-turno">
            <small>Dile al cliente su turno</small>
            <b>{turnoDado.turno}</b>
            {turnoDado.nombre && <span>{turnoDado.nombre}</span>}
            <p>Cuando la cocina lo despache, sale en el TV.</p>
            <button className="btn btn-primary" onClick={() => setTurnoDado(null)}>Listo</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ＋ Mesa: número por teclado, otro nombre o para llevar.
function AbrirCuenta({ local, conMesas, modo, conCocina, onCerrar, onElegir }) {
  const [tipo, setTipo] = useState(conMesas ? 'mesa' : 'llevar')
  const tipos = conMesas ? [['mesa', '🪑 Mesa'], ['nombre', '✏️ Nombre'], ['llevar', '🥡 Para llevar']] : [['llevar', '🥡 Para llevar']]
  const [mesa, setMesa] = useState('')
  const [nombre, setNombre] = useState('')
  const destino = tipo === 'llevar' ? { tipo: 'llevar', mesa: null, nombre: nombre.trim() || null }
    : tipo === 'nombre' ? { tipo: 'mesa', mesa: null, nombre: nombre.trim() || null }
      : { tipo: 'mesa', mesa: mesa || null, nombre: null }
  const listo = tipo === 'llevar' || (tipo === 'mesa' ? !!mesa : !!nombre.trim())
  return (
    <div className="pv-hoja-fondo centro" onClick={onCerrar}>
      <div className="pv-hoja pv-abrir" role="dialog" aria-modal="true" aria-label="Abrir cuenta" onClick={e => e.stopPropagation()}>
        <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={onCerrar}>✕</button>
        <h2>{modo === 'dejar' ? (conCocina ? '¿Para dónde va?' : '¿A qué cuenta?') : 'Abrir cuenta'}</h2>
        <div className="cb-mini pv-abrir-tipo" role="radiogroup">
          {tipos.map(([v, t]) => (
            <button key={v} role="radio" aria-checked={tipo === v} className={tipo === v ? 'on' : ''} onClick={() => setTipo(v)}>{t}</button>
          ))}
        </div>
        {tipo === 'mesa'
          ? <Teclado valor={mesa} onCambio={setMesa} />
          : <input className="cb-motivo" autoFocus maxLength={30} placeholder={tipo === 'llevar' ? 'Nombre del cliente (opcional)' : 'Ej: Barra, Terraza, Don Carlos'} value={nombre} onChange={e => setNombre(e.target.value)} />}
        {!conMesas && <Candado local={local} funcion="mesas" compacto titulo="Las cuentas por mesa" />}
        <button type="button" className="pv-cobrar" disabled={!listo} onClick={() => onElegir(destino)}>
          {!listo ? 'Elige la mesa' : modo === 'dejar' && conCocina ? `Mandar a cocina · ${etiquetaDestino(destino)}` : `Listo · ${etiquetaDestino(destino)}`}
        </button>
      </div>
    </div>
  )
}
