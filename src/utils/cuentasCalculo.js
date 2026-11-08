// 💰 Cálculos de las cuentas del negocio, sin Firebase (guía «Cuentas del negocio»).
// Los usan services/cuentas.js (los dos motores) y el reinicio de la demo en el servidor (api/demo.js).
import { jornadaDe, horaDe, mesDe } from './jornada.js'
import { limpiarConsumo } from './inventario.js'

// ─────────────────────────────── Deltas (comunes a los dos motores) ───────────────────────────────

// Clave segura para un mapa de Firestore (sin puntos, barras ni nada raro).
export const clavePlato = it => String(it.productoId || it.nombre || 'x').replace(/[^\w-]/g, '_').slice(0, 60) || 'x'
export const sumaPagos = pagos => (pagos || []).reduce((s, p) => s + (Number(p.monto) || 0), 0)

// Lo que una venta le suma (s = 1) o le resta (s = -1) al resumen de su día y de su mes.
export function deltaVenta(v, s) {
  const d = {
    ventas: s * (v.total || 0), nVentas: s,
    descuentos: s * (v.descuento?.valor || 0), propinas: s * (v.propina?.valor || 0),
    porCuenta: {}, porPlato: {}, porHora: { [String(v.hora ?? 0)]: s * (v.total || 0) },
    // Cuántas ventas de cada tipo (mesa · llevar · recoger · domicilio · caja): el «movimiento».
    porTipo: { [v.destino?.tipo || 'caja']: s },
  }
  for (const p of v.pagos || []) d.porCuenta[p.cuenta] = (d.porCuenta[p.cuenta] || 0) + s * (Number(p.monto) || 0)
  for (const it of v.items || []) {
    const k = clavePlato(it)
    const prev = d.porPlato[k] || { n: 0, monto: 0, nombre: it.nombre }
    d.porPlato[k] = { n: prev.n + s * (it.cantidad || 1), monto: prev.monto + s * (it.precio || 0), nombre: it.nombre }
  }
  return d
}

// Lo que una venta mueve en los saldos: lo pagado + la propina, cada cosa en su cuenta.
export function saldosVenta(v, s) {
  const d = {}
  for (const p of v.pagos || []) d[p.cuenta] = (d[p.cuenta] || 0) + s * (Number(p.monto) || 0)
  if (v.propina?.valor) d[v.propina.cuenta] = (d[v.propina.cuenta] || 0) + s * v.propina.valor
  return d
}

export const CAMPO_MOV = { gasto: 'gastos', nomina: 'nomina', retiro: 'retiros', ingreso: 'ingresos' }
export const SIGNO_SALDO = { gasto: -1, nomina: -1, retiro: -1, ingreso: 1, traslado: -1 }

export function deltaMovimiento(m, s) {
  const campo = CAMPO_MOV[m.tipo]
  return campo ? { [campo]: s * m.monto } : {}
}
export function saldosMovimiento(m, s) {
  const d = { [m.cuenta]: s * SIGNO_SALDO[m.tipo] * m.monto }
  if (m.tipo === 'traslado' && m.cuentaDestino) d[m.cuentaDestino] = (d[m.cuentaDestino] || 0) + s * m.monto
  return d
}

// Cambio de medio de pago: se quita lo viejo y se pone lo nuevo, solo en porCuenta y saldos.
export function deltaCambioPago(antes, despues) {
  const res = { porCuenta: {} }
  for (const p of antes.pagos || []) res.porCuenta[p.cuenta] = (res.porCuenta[p.cuenta] || 0) - p.monto
  for (const p of despues.pagos || []) res.porCuenta[p.cuenta] = (res.porCuenta[p.cuenta] || 0) + p.monto
  return res
}
export function saldosCambioPago(antes, despues) {
  const a = saldosVenta(antes, -1), b = saldosVenta(despues, 1)
  for (const [k, n] of Object.entries(b)) a[k] = (a[k] || 0) + n
  return a
}

// Dónde suma un delta: su día y su mes. Lo PRIVADO del día (nómina, retiros e ingresos del dueño)
// va a `dp_` en vez de `d_`, porque el cajero lee `d_` para su «Hoy» y no debe ver sueldos ni
// ganancias (D8/D22 · auditoría «cuentas» H4). Días viejos pueden traerlo en `d_`: se suman los dos.
export const docsResumen = (jornada, privado = false) => [`${privado ? 'dp_' : 'd_'}${jornada}`, `m_${mesDe(jornada)}`]
export const esPrivado = m => !!m && m.tipo !== 'gasto' && m.tipo !== 'traslado'

export const limpiarPagos = pagos => (pagos || []).filter(p => p.monto > 0).map(p => ({ cuenta: p.cuenta, nombre: p.nombre, monto: Math.round(p.monto) }))
// Al cambiar el pago, la propina conserva su valor: solo puede pasar a otra cuenta.
export const propinaEn = (propina, cuenta) => propina ? { ...propina, ...(cuenta ? { cuenta: cuenta.cuenta, nombre: cuenta.nombre } : {}) } : null

// Valida y completa una venta que llega de la pantalla.
export function armarVenta(datos, por, local) {
  const ahora = Date.now()
  const items = (datos.items || []).map(it => ({
    productoId: it.productoId || '', nombre: it.nombre || 'Producto',
    cantidad: it.cantidad || 1, precio: Number(it.precio) || 0,
    ...(it.opciones ? { opciones: it.opciones } : {}),
  }))
  const subtotal = items.reduce((s, it) => s + it.precio, 0)
  const desc = datos.descuento?.valor > 0
    ? { valor: Math.min(datos.descuento.valor, subtotal), cortesia: !!datos.descuento.cortesia, motivo: (datos.descuento.motivo || '').trim() }
    : null
  const total = subtotal - (desc?.valor || 0)
  const pagos = limpiarPagos(datos.pagos)
  if (total > 0 && sumaPagos(pagos) !== total) throw new Error('pagos-no-cuadran')
  const jornada = jornadaDe(ahora, local?.horario)
  return {
    jornada, hora: horaDe(ahora), por,
    origen: datos.origen || 'caja',
    comandaIds: (datos.comandas || []).map(c => c.id),
    mesa: datos.mesa || null,
    destino: datos.destino || null,
    items, subtotal, descuento: desc, total, pagos,
    propina: datos.propina?.valor > 0 ? { valor: Math.round(datos.propina.valor), cuenta: datos.propina.cuenta, nombre: datos.propina.nombre } : null,
    recibido: datos.recibido > 0 ? Math.round(datos.recibido) : null,
    // 📦 Lo que gasta del inventario (guía «Mejoras frente a Loggro» paso 4): se devuelve si se elimina.
    ...(limpiarConsumo(datos.inventario).length ? { inventario: limpiarConsumo(datos.inventario) } : {}),
    estado: 'ok',
  }
}

export function armarMovimiento(datos, por, local) {
  const ahora = Date.now()
  const monto = Math.round(Number(datos.monto) || 0)
  if (!(monto > 0)) throw new Error('monto')
  if (!CAMPO_MOV[datos.tipo] && datos.tipo !== 'traslado') throw new Error('tipo')
  return {
    tipo: datos.tipo, jornada: jornadaDe(ahora, local?.horario), por,
    // Marca para restarlo del mismo documento donde se sumó (ver docsResumen).
    ...(esPrivado(datos) ? { enPrivado: true } : {}),
    cuenta: datos.cuenta, ...(datos.cuentaDestino ? { cuentaDestino: datos.cuentaDestino } : {}),
    monto, concepto: (datos.concepto || '').trim(),
    ...(datos.trabajadorId ? { trabajadorId: datos.trabajadorId, trabajador: datos.trabajador || '' } : {}),
    ...(datos.dias?.length ? { dias: [...datos.dias].sort() } : {}),
    estado: 'ok',
  }
}

// Suma un delta a un objeto plano (los textos se copian; los números se suman).
export function sumarEn(base, delta) {
  const out = { ...(base || {}) }
  for (const [k, v] of Object.entries(delta)) {
    if (typeof v === 'number') out[k] = (out[k] || 0) + v
    else if (v && typeof v === 'object') out[k] = sumarEn(out[k], v)
    else out[k] = v
  }
  return out
}
