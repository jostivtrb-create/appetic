import { cop } from '../../utils/money'
import { nombreMes, horaCorta } from '../../utils/jornada'
import { ms } from '../../services/comandas'
import { nombreCuenta } from '../../utils/cuentasDinero'

// ⬇️ DESCARGA DEL MES (guía «Cuentas del negocio» D17 + S22), sin librerías:
//   • Excel: un .csv con «;» y BOM, que Excel en español abre directo con tildes y columnas.
//   • PDF: una página limpia lista para «Guardar como PDF» o imprimir.
// datos = { local, mes 'AAAA-MM', resumen (m_…), ventas [], movimientos [] } (solo los válidos).

const TIPO_MOV = { gasto: 'Gasto', nomina: 'Nómina', retiro: 'Retiro', ingreso: 'Ingreso', traslado: 'Movimiento entre cuentas' }
const fecha = j => `${j.slice(8, 10)}/${j.slice(5, 7)}/${j.slice(0, 4)}`
const items = v => (v.items || []).map(it => `${it.cantidad} ${it.nombre}`).join(', ')
const pagos = v => (v.pagos || []).map(p => `${p.nombre} ${p.monto}`).join(' + ') || (v.descuento?.cortesia ? 'Cortesía' : '')
const ganancia = r => (r?.ventas || 0) - (r?.gastos || 0) - (r?.nomina || 0)
const nombreArchivo = (local, mes, ext) => `${(local.slug || 'local')}-cuentas-${mes}.${ext}`

function celda(v) {
  let t = v == null ? '' : String(v)
  // Un texto que empieza con = + - @ Excel lo ejecuta como fórmula (un gasto «=HYPERLINK(…)»):
  // se le antepone ' para que quede como texto. Los números no pasan por aquí como texto.
  if (typeof v === 'string' && /^[=+\-@]/.test(t)) t = `'${t}`
  return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

export function descargarExcel({ local, mes, resumen: r, ventas, movimientos }) {
  const filas = [
    [`${local.nombre} — Cuentas de ${nombreMes(mes)} ${mes.slice(0, 4)}`],
    [],
    ['RESUMEN'],
    ['Ventas', r.ventas || 0],
    ['Número de ventas', r.nVentas || 0],
    ['Gastos y compras', r.gastos || 0],
    ['Nómina', r.nomina || 0],
    ['Ganancia', ganancia(r)],
    ['Propinas (aparte)', r.propinas || 0],
    ['Descuentos y cortesías', r.descuentos || 0],
    [],
    ['VENTAS'],
    ['Fecha', 'Hora', 'Productos', 'Subtotal', 'Descuento', 'Total', 'Pago', 'Propina', 'Mesa', 'Atendió'],
    ...ventas.map(v => [fecha(v.jornada), horaCorta(ms(v.en)), items(v), v.subtotal, v.descuento?.valor || 0, v.total, pagos(v), v.propina?.valor || 0, v.mesa || '', v.por?.nombre || v.por?.email || '']),
    [],
    ['GASTOS, NÓMINA Y MOVIMIENTOS DE PLATA'],
    ['Fecha', 'Hora', 'Tipo', 'Concepto', 'Valor', 'Cuenta', 'Días que cubre', 'Anotó'],
    ...movimientos.map(m => [fecha(m.jornada), horaCorta(ms(m.en)), TIPO_MOV[m.tipo] || m.tipo, m.tipo === 'nomina' ? m.trabajador : m.concepto, m.monto, m.cuentaDestino ? `${nombreCuenta(local, m.cuenta)} → ${nombreCuenta(local, m.cuentaDestino)}` : nombreCuenta(local, m.cuenta), (m.dias || []).map(fecha).join(' '), m.por?.nombre || m.por?.email || '']),
  ]
  const csv = '﻿' + filas.map(f => f.map(celda).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: nombreArchivo(local, mes, 'csv') })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function descargarPdf({ local, mes, resumen: r, ventas, movimientos }, ventana = null) {
  // La ventana se abre en el toque (ventana) y aquí se llena: si se abriera después de leer los
  // datos, Safari y Chrome la bloquean.
  const w = ventana || window.open('', '_blank')
  if (!w) throw new Error('ventana-bloqueada')
  const color = local.tema?.primary || '#ED7D2B'
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(local.nombre)} · Cuentas de ${nombreMes(mes)}</title>
<style>
  *{box-sizing:border-box} body{font:13px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#2A211C;margin:28px}
  h1{font-size:22px;margin:0;color:${color}} h2{font-size:14px;margin:22px 0 6px;text-transform:uppercase;letter-spacing:.06em;color:#6E635B}
  .sub{color:#6E635B;margin:2px 0 16px} .res{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .res div{border:1px solid #EFE6D8;border-radius:10px;padding:8px 10px} .res small{display:block;color:#6E635B;font-size:11px;text-transform:uppercase}
  .res b{font-size:17px} .res .g b{color:${color}} table{width:100%;border-collapse:collapse} th,td{text-align:left;padding:5px 6px;border-bottom:1px solid #EFE6D8;vertical-align:top}
  th{font-size:11px;text-transform:uppercase;color:#6E635B} td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  .pie{margin-top:22px;color:#A89E94;font-size:11px} @media print{body{margin:12mm}}
</style></head><body>
<h1>${esc(local.nombre)}</h1><p class="sub">Cuentas de ${nombreMes(mes)} ${mes.slice(0, 4)} · ${r.nVentas || 0} ventas</p>
<div class="res">
  <div><small>Ventas</small><b>${cop(r.ventas)}</b></div><div><small>Gastos y compras</small><b>− ${cop(r.gastos)}</b></div>
  <div><small>Nómina</small><b>− ${cop(r.nomina)}</b></div><div class="g"><small>Ganancia</small><b>${cop(ganancia(r))}</b></div>
</div>
<h2>Ventas</h2>
<table><tr><th>Fecha</th><th>Productos</th><th>Pago</th><th class="n">Total</th></tr>
${ventas.map(v => `<tr><td>${fecha(v.jornada)} ${esc(horaCorta(ms(v.en)))}</td><td>${esc(items(v))}${v.mesa ? ` · Mesa ${esc(v.mesa)}` : ''}</td><td>${esc((v.pagos || []).map(p => p.nombre).join(' + ') || 'Cortesía')}</td><td class="n">${cop(v.total)}</td></tr>`).join('')}
</table>
<h2>Gastos, nómina y movimientos</h2>
<table><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th class="n">Valor</th></tr>
${movimientos.map(m => `<tr><td>${fecha(m.jornada)}</td><td>${TIPO_MOV[m.tipo] || m.tipo}</td><td>${esc(m.tipo === 'nomina' ? `${m.trabajador || ''} · ${(m.dias || []).length} días` : m.concepto)}</td><td class="n">${m.tipo === 'ingreso' ? '+' : m.tipo === 'traslado' ? '' : '−'} ${cop(m.monto)}</td></tr>`).join('')}
</table>
<p class="pie">Son las cuentas del negocio, no facturación electrónica DIAN. Hecho con Appetic.</p>
<script>setTimeout(function(){window.print()},300)</script>
</body></html>`)
  w.document.close()
}
