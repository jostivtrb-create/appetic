// 📦 INVENTARIO — cálculos puros (guía «Mejoras frente a Loggro» D7, D8, D13, S6 · guía «Paquetes» D5, D13).
//
//   locales/{id}/insumos/{id}      { nombre, unidad 'g'|'ml'|'unidad', stock, minimo, costoUnit (por g, ml o unidad;
//                                    promedio ponderado de las compras), proveedorId, activo }
//   locales/{id}/recetas/{prodId}  { items: [{ insumoId, cantidad }] }   ← cuánto gasta UNA unidad del plato
//   locales/{id}/proveedores/{id}  { nombre, whatsapp, insumos: [insumoId] }
//   locales/{id}/inventarioMov/{id} { tipo 'compra'|'conteo'|'merma'|'ajuste', insumoId, nombre, cantidad (+/−),
//                                    antes, despues, monto?, motivo?, por, en }
//
// Las ventas NO dejan movimiento (serían cientos): descuentan con increment() dentro de la misma
// transacción de la venta, y la venta guarda `inventario: [{ insumoId, cantidad }]` para devolverlo
// si se elimina. Por ahora la receta es por PRODUCTO (las opciones se guardan como texto en la venta).

export const UNIDADES = {
  g: { id: 'g', nombre: 'Gramos', corta: 'g', grande: 'kg', factor: 1000 },
  ml: { id: 'ml', nombre: 'Mililitros', corta: 'ml', grande: 'L', factor: 1000 },
  unidad: { id: 'unidad', nombre: 'Unidades', corta: 'und', grande: null, factor: 1 },
}

const num = n => Number(n) || 0
const fmt = (n, dec = 2) => (Math.round(n * 10 ** dec) / 10 ** dec).toLocaleString('es-CO', { maximumFractionDigits: dec })

// 1500 g → «1,5 kg» · 300 g → «300 g» · 12 unidad → «12 und»
export function cantidadTxt(n, unidad) {
  const u = UNIDADES[unidad] || UNIDADES.unidad
  const v = num(n)
  if (u.grande && Math.abs(v) >= u.factor) return `${fmt(v / u.factor)} ${u.grande}`
  return `${fmt(v, unidad === 'unidad' ? 2 : 0)} ${u.corta}`
}

// Lo que se escribe (en kg o en g, en L o en ml) → la unidad base del insumo.
export const aBase = (valor, unidad, enGrande) => num(String(valor).replace(',', '.')) * (enGrande ? (UNIDADES[unidad]?.factor || 1) : 1)

// Precio de referencia legible: por kg, por L o por unidad.
export function costoTxt(costoUnit, unidad) {
  const u = UNIDADES[unidad] || UNIDADES.unidad
  const v = num(costoUnit) * (u.grande ? u.factor : 1)
  return `$${Math.round(v).toLocaleString('es-CO')} / ${u.grande || 'und'}`
}

// 'ok' | 'bajo' (en el mínimo o menos) | 'agotado' (0 o menos)
export function estadoInsumo(i) {
  const s = num(i?.stock)
  if (s <= 0) return 'agotado'
  if (num(i?.minimo) > 0 && s <= num(i.minimo)) return 'bajo'
  return 'ok'
}
export const porAcabarse = insumos => (insumos || []).filter(i => i.activo !== false && estadoInsumo(i) !== 'ok')

// Costo promedio ponderado tras comprar `cantidad` por `monto` (lo negativo cuenta como 0).
export function costoTrasCompra(insumo, cantidad, monto) {
  const s = Math.max(0, num(insumo?.stock)), c = num(cantidad)
  if (c <= 0) return num(insumo?.costoUnit)
  return (s * num(insumo?.costoUnit) + num(monto)) / (s + c)
}

// Costo de UNA unidad del plato según su receta.
export const costoPlato = (receta, insumosPorId) =>
  (receta?.items || []).reduce((t, r) => t + num(r.cantidad) * num(insumosPorId[r.insumoId]?.costoUnit), 0)

// Lo que gasta una venta: suma por insumo de (cantidad vendida × receta). Sin receta, nada.
export function consumoDe(items, recetasPorProducto) {
  const t = {}
  for (const it of items || []) {
    const r = recetasPorProducto[it.productoId]
    if (!r) continue
    for (const x of r.items || []) if (x.insumoId && num(x.cantidad) > 0) t[x.insumoId] = (t[x.insumoId] || 0) + num(x.cantidad) * num(it.cantidad || 1)
  }
  return Object.entries(t).map(([insumoId, cantidad]) => ({ insumoId, cantidad: Math.round(cantidad * 1000) / 1000 }))
}

// Lista limpia para guardar en la venta.
export const limpiarConsumo = l => (Array.isArray(l) ? l : [])
  .filter(x => x && typeof x.insumoId === 'string' && x.insumoId && num(x.cantidad) > 0)
  .slice(0, 80).map(x => ({ insumoId: x.insumoId, cantidad: num(x.cantidad) }))

// El mensaje para pedirle al proveedor lo que falta.
export function mensajePedido(local, proveedor, lineas) {
  const nombre = String(proveedor?.nombre || '').split(' ')[0]
  return `¡Hola${nombre ? ` ${nombre}` : ''}! Te escribo de ${local?.nombre || 'nuestro negocio'}. Necesito:\n\n${lineas.map(l => `• ${l}`).join('\n')}\n\n¿Me confirmas precio y cuándo llega? ¡Gracias!`
}
