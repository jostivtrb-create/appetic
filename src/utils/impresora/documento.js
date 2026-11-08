// 🖨️ QUÉ se imprime (guía «Mejoras frente a Loggro» D6 y S8). Puro: arma un DOCUMENTO, una lista de
// bloques que después se pinta en la impresora térmica (escpos.js) o en el «Imprimir» del
// navegador (html.js). Así el ticket y la comanda salen iguales por cualquier camino.
//
//   { t: 'centro', texto, grande?, negrita? }   texto centrado
//   { t: 'texto',  texto, grande?, negrita? }   texto a la izquierda (se parte si no cabe)
//   { t: 'par',    izq, der, grande?, negrita? } izquierda … derecha (precio)
//   { t: 'sep' }                                  línea de guiones
//   { t: 'espacio' }                              renglón en blanco
//
// local.impresion = { activa, ancho: 58|80, comandas, ticket, encabezado, pie } (lo pone el dueño).

const pesos = n => {
  const v = Math.round(Number(n) || 0)
  return (v < 0 ? '-$' : '$') + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
const dos = n => String(n).padStart(2, '0')
// Fecha y hora de Bogotá (UTC−5 fijo, igual que utils/jornada.js).
export function fechaHora(ms) {
  const d = new Date(Number(ms) - 5 * 3600000)
  const h = d.getUTCHours()
  return `${dos(d.getUTCDate())}/${dos(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${(h % 12) || 12}:${dos(d.getUTCMinutes())} ${h < 12 ? 'a. m.' : 'p. m.'}`
}
const aMs = t => (t == null ? Date.now() : typeof t === 'number' ? t : t.toMillis ? t.toMillis() : t.seconds ? t.seconds * 1000 : Date.now())
const lineas = txt => String(txt || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4)

function destinoTxt(d, mesa) {
  if (d?.tipo === 'llevar') return d.nombre ? `Para llevar · ${d.nombre}` : 'Para llevar'
  if (d?.tipo === 'domicilio') return d.nombre ? `Domicilio · ${d.nombre}` : 'Domicilio'
  if (d?.tipo === 'recoger') return d.nombre ? `Recoger · ${d.nombre}` : 'Recoger'
  if (d?.mesa || mesa) return `Mesa ${d?.mesa || mesa}`
  return d?.nombre || ''
}

// 🧾 El ticket del cliente al cobrar. `venta` tiene la forma de cuentas/ventas (armarVenta).
export function ticketDe(venta, local, cfg = local?.impresion || {}) {
  const doc = [{ t: 'centro', texto: local?.nombre || 'Mi negocio', grande: true, negrita: true }]
  for (const l of lineas(cfg.encabezado)) doc.push({ t: 'centro', texto: l })
  doc.push({ t: 'sep' })
  doc.push({ t: 'texto', texto: fechaHora(aMs(venta.en)) })
  const dest = destinoTxt(venta.destino, venta.mesa)
  if (dest) doc.push({ t: 'texto', texto: dest })
  if (venta.por?.nombre) doc.push({ t: 'texto', texto: `Atendió: ${String(venta.por.nombre).split(' ')[0]}` })
  doc.push({ t: 'sep' })
  for (const it of venta.items || []) {
    doc.push({ t: 'par', izq: `${it.cantidad}x ${it.nombre}`, der: pesos(it.precio) })
    if (it.opciones) doc.push({ t: 'texto', texto: `   ${it.opciones}` })
  }
  doc.push({ t: 'sep' })
  if (venta.descuento?.valor > 0) {
    doc.push({ t: 'par', izq: 'Subtotal', der: pesos(venta.subtotal) })
    doc.push({ t: 'par', izq: venta.descuento.cortesia ? 'Cortesía' : 'Descuento', der: `-${pesos(venta.descuento.valor)}` })
  }
  doc.push({ t: 'par', izq: 'TOTAL', der: pesos(venta.total), grande: true, negrita: true })
  for (const p of venta.pagos || []) doc.push({ t: 'par', izq: p.nombre || 'Pago', der: pesos(p.monto) })
  const efectivo = (venta.pagos || []).filter(p => /efectivo/i.test(p.nombre || '') || p.cuenta === 'efectivo').reduce((s, p) => s + p.monto, 0)
  if (venta.recibido > 0) {
    doc.push({ t: 'par', izq: 'Recibido', der: pesos(venta.recibido) })
    const propEf = venta.propina?.valor > 0 && /efectivo/i.test(venta.propina?.nombre || '') ? venta.propina.valor : 0
    const vueltas = venta.recibido - efectivo - propEf
    if (vueltas > 0) doc.push({ t: 'par', izq: 'Vueltas', der: pesos(vueltas), negrita: true })
  }
  if (venta.propina?.valor > 0) doc.push({ t: 'par', izq: 'Propina (gracias)', der: pesos(venta.propina.valor) })
  doc.push({ t: 'sep' })
  for (const l of lineas(cfg.pie)) doc.push({ t: 'centro', texto: l })
  doc.push({ t: 'centro', texto: 'Comprobante de pago. No es factura electrónica.' })
  return doc
}

// 🍳 La comanda de la cocina. `cambio`: la reimprime porque el mesero la corrigió.
export function comandaDe(comanda, local, { cambio = false } = {}) {
  const doc = []
  if (cambio) doc.push({ t: 'centro', texto: '*** CAMBIO ***', grande: true, negrita: true })
  doc.push({ t: 'centro', texto: destinoTxt(comanda.destino).toUpperCase() || 'COMANDA', grande: true, negrita: true })
  if (comanda.turno) doc.push({ t: 'centro', texto: `Turno ${comanda.turno}`, negrita: true })
  doc.push({ t: 'texto', texto: `${fechaHora(aMs(cambio ? comanda.cambiadaEn || comanda.creadaEn : comanda.creadaEn))}${comanda.creadaPor?.nombre ? ` · ${String(comanda.creadaPor.nombre).split(' ')[0]}` : ''}` })
  doc.push({ t: 'sep' })
  for (const it of (comanda.items || []).filter(i => !i.quitado)) {
    doc.push({ t: 'texto', texto: `${it.cantidad}x ${it.nombre}`, grande: true, negrita: true })
    if (it.opciones) doc.push({ t: 'texto', texto: `   ${it.opciones}` })
    if (it.comentario) doc.push({ t: 'texto', texto: `   >> ${it.comentario}`, negrita: true })
  }
  if (comanda.nota) doc.push({ t: 'texto', texto: `Nota: ${comanda.nota}`, negrita: true })
  doc.push({ t: 'sep' })
  doc.push({ t: 'centro', texto: local?.nombre || '' })
  return doc
}

export function pruebaDe(local, cfg = local?.impresion || {}) {
  return [
    { t: 'centro', texto: local?.nombre || 'Appetic', grande: true, negrita: true },
    ...lineas(cfg.encabezado).map(l => ({ t: 'centro', texto: l })),
    { t: 'sep' },
    { t: 'texto', texto: 'Prueba de impresión ✓' },
    { t: 'texto', texto: 'Tildes: á é í ó ú ñ Ñ ¿? ¡!' },
    { t: 'par', izq: '1x Bandeja paisa', der: pesos(26000) },
    { t: 'par', izq: 'TOTAL', der: pesos(26000), grande: true, negrita: true },
    { t: 'sep' },
    { t: 'centro', texto: fechaHora(Date.now()) },
  ]
}

// Caracteres por renglón según el papel (letra normal; la grande ocupa el doble).
export const anchoEnLetras = ancho => (Number(ancho) === 80 ? 48 : 32)

// Parte un texto en renglones de `n` letras sin cortar palabras (salvo las larguísimas).
export function partir(texto, n) {
  // La sangría del comienzo («   sin cebolla») se conserva en cada renglón.
  const sangria = /^ */.exec(String(texto))[0].slice(0, Math.max(0, n - 8))
  if (sangria) return partir(String(texto).trimStart(), n - sangria.length).map(l => sangria + l)
  const out = []
  let linea = ''
  for (const palabra of String(texto).split(/\s+/).filter(Boolean)) {
    let p = palabra
    while (p.length > n) { if (linea) { out.push(linea); linea = '' } out.push(p.slice(0, n)); p = p.slice(n) }
    if (!linea) linea = p
    else if (linea.length + 1 + p.length <= n) linea += ' ' + p
    else { out.push(linea); linea = p }
  }
  if (linea || !out.length) out.push(linea)
  return out
}

// El documento como renglones de texto plano de `n` letras (lo usa ESC/POS y sirve para probar).
// Cada renglón: { texto, grande, negrita, centro }.
export function renglones(doc, n) {
  const out = []
  for (const b of doc) {
    const m = b.grande ? Math.floor(n / 2) : n
    if (b.t === 'sep') out.push({ texto: '-'.repeat(n) })
    else if (b.t === 'espacio') out.push({ texto: '' })
    else if (b.t === 'centro' || b.t === 'texto') {
      for (const l of partir(b.texto, m)) out.push({ texto: l, grande: b.grande, negrita: b.negrita, centro: b.t === 'centro' })
    } else if (b.t === 'par') {
      const der = String(b.der)
      const izq = partir(b.izq, Math.max(4, m - der.length - 1))
      izq.forEach((l, i) => {
        const fin = i === izq.length - 1
        out.push({ texto: fin ? l + ' '.repeat(Math.max(1, m - l.length - der.length)) + der : l, grande: b.grande, negrita: b.negrita })
      })
    }
  }
  return out
}
