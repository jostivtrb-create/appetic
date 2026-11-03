// 🧪 CUENTAS DE EJEMPLO (guía «Cuentas del negocio» S8): para la vista previa (?preview=1) y la
// demo para clientes (/demo, «Reiniciar demo»), que Cuentas y el historial de la Caja no salgan
// vacíos. Son datos inventados pero coherentes: los resúmenes se arman con los MISMOS deltas que
// usa el motor (services/cuentas.js), así lo que dice el mes cuadra con las ventas y los gastos.
//
//   • Los últimos 20 días: ventas con platos del menú, pagos repartidos entre las cuentas, alguna
//     propina y algún descuento; gastos cada pocos días y la nómina semanal de dos personas.
//   • Los 5 meses anteriores: solo su resumen (para la gráfica), con ventas parecidas.
import { deltaVenta, saldosVenta, deltaMovimiento, saldosMovimiento, sumarEn, docsResumen } from '../utils/cuentasCalculo.js'
import { jornadaDe, horaDe, sumarDias, mesDe, mesAnterior } from '../utils/jornada.js'
import { cuentasDe } from '../utils/cuentasDinero.js'


// Pseudoaleatorio con semilla: el ejemplo sale igual cada vez.
function azar(semilla = 7) {
  let s = semilla
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

const GASTOS = [['Carne y pollo', 180000, 320000], ['Verduras y frutas', 40000, 90000], ['Gas', 45000, 45000], ['Bebidas', 90000, 160000], ['Pan y quesos', 50000, 110000], ['Empaques', 30000, 60000]]
const POR = { email: 'demo@appetic.app', nombre: 'Admin Demo' }

export function cuentasDeEjemplo(local, productos, ahora = Date.now()) {
  const r = azar(11)
  const entre = (a, b) => Math.round((a + r() * (b - a)) / 100) * 100
  const cuentas = cuentasDe(local)
  const efectivo = cuentas.find(c => c.tipo === 'efectivo') || cuentas[0]
  const otra = cuentas.find(c => c.id !== efectivo.id)
  const platos = (productos || []).filter(p => p.disponible !== false).map(p => ({
    id: p.id, nombre: p.nombre,
    precio: Number(p.precio) || Number(p.variantes?.[0]?.precio) || 0,
  })).filter(p => p.precio > 0)
  if (!platos.length) return null

  const hoy = jornadaDe(ahora, local.horario)
  const ventas = [], movimientos = []
  const trabajadores = [{ id: 'ej-ana', nombre: 'Ana', activo: true }, { id: 'ej-carlos', nombre: 'Carlos', activo: true }]
  let n = 0
  for (let d = 19; d >= 0; d--) {
    const jornada = sumarDias(hoy, -d)
    const finDe = [0, 5, 6].includes(new Date(`${jornada}T12:00:00Z`).getUTCDay())
    const cuantas = (finDe ? 16 : 10) + Math.floor(r() * 6)
    for (let k = 0; k < cuantas; k++) {
      // Hoy, solo horas que ya pasaron (si es muy temprano, de la mañana).
      const horas = d === 0 ? [7, 8, 9, 10, 11, 12, 13, 18, 19, 20].filter(h => h < horaDe(ahora)) : [12, 13, 13, 18, 19, 19, 20, 21]
      if (!horas.length) continue
      const hora = horas[Math.floor(r() * horas.length)]
      const en = Date.parse(`${jornada}T00:00:00-05:00`) + hora * 3600000 + Math.floor(r() * 60) * 60000
      if (en > ahora) continue
      const items = Array.from({ length: 1 + Math.floor(r() * 2) }, () => {
        const p = platos[Math.floor(r() * platos.length)]
        const cantidad = r() < 0.8 ? 1 : 2
        return { productoId: p.id, nombre: p.nombre, cantidad, precio: p.precio * cantidad }
      })
      const subtotal = items.reduce((s, it) => s + it.precio, 0)
      const descuento = r() < 0.06 ? { valor: Math.round(subtotal * 0.1 / 100) * 100, cortesia: false, motivo: 'Cliente frecuente' } : null
      const total = subtotal - (descuento?.valor || 0)
      const x = r()
      const pagos = x < 0.55 || !otra ? [{ cuenta: efectivo.id, nombre: efectivo.nombre, monto: total }]
        : x < 0.92 ? [{ cuenta: otra.id, nombre: otra.nombre, monto: total }]
          : [{ cuenta: efectivo.id, nombre: efectivo.nombre, monto: Math.round(total / 2 / 100) * 100 }, { cuenta: otra.id, nombre: otra.nombre, monto: total - Math.round(total / 2 / 100) * 100 }]
      const propina = r() < 0.15 ? { valor: Math.round(total * 0.1 / 100) * 100, cuenta: pagos[0].cuenta, nombre: pagos[0].nombre } : null
      const tipo = ['mesa', 'mesa', 'llevar', 'domicilio', 'caja'][Math.floor(r() * 5)]
      ventas.push({
        id: `ej-v${++n}`, jornada, hora: horaDe(en), en, por: POR, origen: tipo === 'caja' ? 'caja' : tipo === 'mesa' ? 'mesa' : 'comanda',
        comandaIds: [], mesa: tipo === 'mesa' ? String(1 + Math.floor(r() * 8)) : null,
        destino: tipo === 'caja' ? null : { tipo, mesa: null, nombre: null },
        items, subtotal, descuento, total, pagos, propina, recibido: null, estado: 'ok',
      })
    }
    if (d > 0) {
      const [concepto, a, b] = GASTOS[Math.floor(r() * GASTOS.length)]
      movimientos.push({ id: `ej-g${d}`, tipo: 'gasto', jornada, en: Date.parse(`${jornada}T15:10:00Z`), por: POR, cuenta: efectivo.id, monto: entre(a, b), concepto, estado: 'ok' })
    }
    // Nómina por quincena (el 15 y el último día del mes), como se paga en Colombia.
    const dia = Number(jornada.slice(8))
    const ultimo = sumarDias(jornada, 1).slice(8) === '01'
    if ((dia === 15 || ultimo) && d > 0) {
      const desde = dia === 15 ? 1 : 16
      const dias = Array.from({ length: dia - desde + 1 }, (_, i) => `${jornada.slice(0, 8)}${String(desde + i).padStart(2, '0')}`)
      for (const t of trabajadores) {
        movimientos.push({ id: `ej-n${d}-${t.id}`, tipo: 'nomina', jornada, en: Date.parse(`${jornada}T23:00:00Z`), por: POR, cuenta: (otra || efectivo).id, monto: t.id === 'ej-ana' ? 900000 : 750000, concepto: '', trabajadorId: t.id, trabajador: t.nombre, dias, estado: 'ok' })
      }
    }
  }
  // La base para vueltas, un retiro del dueño y una consignación al banco: Saldos se ve vivo.
  movimientos.unshift({ id: 'ej-i1', tipo: 'ingreso', jornada: sumarDias(hoy, -19), en: Date.parse(`${sumarDias(hoy, -19)}T15:00:00Z`), por: POR, cuenta: efectivo.id, monto: 400000, concepto: 'Base para vueltas', estado: 'ok' })
  if (otra) movimientos.push({ id: 'ej-t1', tipo: 'traslado', jornada: sumarDias(hoy, -4), en: Date.parse(`${sumarDias(hoy, -4)}T16:00:00Z`), por: POR, cuenta: efectivo.id, cuentaDestino: otra.id, monto: 300000, concepto: 'Consignación', estado: 'ok' })
  movimientos.push({ id: 'ej-r1', tipo: 'retiro', jornada: sumarDias(hoy, -2), en: Date.parse(`${sumarDias(hoy, -2)}T22:00:00Z`), por: POR, cuenta: efectivo.id, monto: 200000, concepto: 'Para la casa', estado: 'ok' })

  // Gastos y nómina, proporcionales a lo que vende el local (si no, un local pequeño queda en rojo):
  // los gastos suman ~30 % de las ventas.
  const vendido = ventas.reduce((t, v) => t + v.total, 0)
  const gastado = movimientos.filter(m => m.tipo === 'gasto').reduce((t, m) => t + m.monto, 0)
  for (const m of movimientos) if (m.tipo === 'gasto') m.monto = Math.max(5000, Math.round(m.monto * vendido * 0.3 / (gastado || 1) / 100) * 100)
  const venta15 = vendido / 20 * 15
  for (const m of movimientos) if (m.tipo === 'nomina') m.monto = Math.max(200000, Math.round(venta15 * (m.trabajadorId === 'ej-ana' ? 0.12 : 0.1) / 10000) * 10000)

  // Resúmenes con los mismos deltas del motor.
  const resumen = { saldos: {} }
  const sumar = (jornada, delta, saldos) => {
    for (const id of docsResumen(jornada)) resumen[id] = sumarEn(resumen[id], delta)
    resumen.saldos = sumarEn(resumen.saldos, saldos)
  }
  for (const v of ventas) sumar(v.jornada, deltaVenta(v, 1), saldosVenta(v, 1))
  for (const m of movimientos) sumar(m.jornada, deltaMovimiento(m, 1), saldosMovimiento(m, 1))

  // Meses anteriores: solo la gráfica, al ritmo diario del ejemplo detallado.
  const porDia = ventas.reduce((t, v) => t + v.total, 0) / 20
  const relleno = (clave, dias, conNomina) => {
    const v = Math.round(porDia * dias * (0.88 + r() * 0.2) / 1000) * 1000
    resumen[clave] = sumarEn(resumen[clave], {
      ventas: v, nVentas: Math.round(v / 36000), gastos: Math.round(v * (0.3 + r() * 0.06) / 1000) * 1000,
      nomina: conNomina, propinas: Math.round(v * 0.012 / 100) * 100, descuentos: 0,
    })
  }
  // El mes donde empieza el ejemplo, si quedó a medias: sus primeros días.
  const inicio = sumarDias(hoy, -19)
  if (mesDe(inicio) !== mesDe(hoy)) {
    const faltan = Number(inicio.slice(8)) - 1
    if (faltan > 0) relleno(`m_${mesDe(inicio)}`, faltan, faltan >= 15 ? Math.round(porDia * 15 * 0.22 / 10000) * 10000 : 0)
  }
  let m = mesDe(inicio)
  for (let i = 0; i < 5; i++) {
    m = mesAnterior(m)
    if (!resumen[`m_${m}`]) relleno(`m_${m}`, 30, Math.round(porDia * 30 * 0.22 / 10000) * 10000)
  }
  return { ventas, movimientos, trabajadores, resumen }
}

// Vista previa: si el motor demo de este local está vacío, lo llena con el ejemplo (una vez).
export function sembrarSiVacio(api, local, productos) {
  if (!api?._vacio?.()) return
  const ej = cuentasDeEjemplo(local, productos)
  if (ej) api._sembrar(ej)
}
