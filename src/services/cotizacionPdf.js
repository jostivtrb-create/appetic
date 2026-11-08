// 🧾 EL PDF DE LA COTIZACIÓN (guía «Paquetes de Appetic» D22.4, D27, D32, D33). Lo arma el
// superadmin al tocar «Enviar cotización»: se descarga y se adjunta a mano en el chat del cliente.
// jsPDF se carga solo al usarlo (no pesa en la app). Sin emojis: las letras del PDF no los tienen.
import { PAQUETES } from '../utils/paquetes'

const NARANJA = [224, 105, 42], AZUL = [11, 31, 68], GRIS = [92, 115, 153], CLARO = [244, 246, 251]
const cop = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO')
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const fechaLarga = ymd => { const [a, m, d] = String(ymd || '').split('-').map(Number); return a ? `${d} de ${MESES[m - 1]} de ${a}` : '—' }
const hoyYmd = () => new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10)

async function logo() {
  try {
    const b = await (await fetch('/icons/icon-192.png')).blob()
    return await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(null); r.readAsDataURL(b) })
  } catch { return null }
}

export const nombreArchivoCot = s => `Cotizacion-Appetic-${s.numero || s.id}-${String(s.local || '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}.pdf`

// s = la solicitud guardada (numero, local, dueno, celular, paquetes, total, promo, venceDia, creadaEn).
export async function descargarCotizacionPdf(s) {
  const doc = await armarCotizacionPdf(s)
  doc.save(nombreArchivoCot(s))
}

// El documento sin descargar (sirve también para verlo o probarlo).
export async function armarCotizacionPdf(s) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 16
  let y = 0
  const salto = alto => { if (y + alto > H - 22) { pie(); doc.addPage(); y = M } }
  function pie() {
    doc.setDrawColor(227, 232, 242); doc.line(M, H - 16, W - M, H - 16)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GRIS)
    doc.text('Appetic es un producto de Swiftfly Solutions · Bogotá · WhatsApp 320 843 5143 · switflysolutions.com/appetic', W / 2, H - 10, { align: 'center' })
  }

  // Cabecera
  doc.setFillColor(...AZUL); doc.rect(0, 0, W, 38, 'F')
  doc.setFillColor(...NARANJA); doc.rect(0, 38, W, 2.2, 'F')
  const img = await logo()
  if (img) doc.addImage(img, 'PNG', M, 9, 20, 20)
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.text('Appetic', M + (img ? 25 : 0), 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.text('Tu negocio de comida, en una sola app', M + (img ? 25 : 0), 27)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(246, 164, 92)
  doc.text('COTIZACIÓN', W - M, 16, { align: 'right' })
  doc.setFontSize(16); doc.setTextColor(255, 255, 255)
  doc.text(s.numero || '—', W - M, 24, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text(`Válida hasta el ${fechaLarga(s.venceDia)}`, W - M, 30, { align: 'right' })
  y = 52

  // Para quién
  doc.setTextColor(...GRIS); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.text('PREPARADA PARA', M, y)
  doc.setTextColor(...AZUL); doc.setFontSize(17); doc.text(s.local || 'Tu negocio', M, y + 8)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...GRIS)
  doc.text([s.dueno, s.celular && `WhatsApp ${s.celular}`, `Fecha: ${fechaLarga(hoyYmd())}`].filter(Boolean).join('   ·   '), M, y + 15)
  y += 26

  // Paquetes
  doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5)
  doc.text('Lo que incluye tu plan', M, y); y += 6
  for (const p of PAQUETES.filter(x => (s.paquetes || []).includes(x.id))) {
    const items = p.incluye.map(i => `${i.t}${i.pronto ? ' (próximamente)' : ''}`)
    const filas = Math.ceil(items.length / 2)
    const alto = 15 + filas * 5.6 + 3
    salto(alto)
    doc.setFillColor(...CLARO); doc.roundedRect(M, y, W - 2 * M, alto, 3, 3, 'F')
    doc.setFillColor(...NARANJA); doc.roundedRect(M, y, 2.2, alto, 1, 1, 'F')
    doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
    doc.text(p.nombre, M + 7, y + 7)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS)
    doc.text(p.resumen, M + 7, y + 12)
    doc.setFontSize(9.2); doc.setTextColor(40, 52, 80)
    items.forEach((t, k) => {
      const col = k % 2, fila = Math.floor(k / 2)
      const x = M + 7 + col * ((W - 2 * M - 14) / 2 + 4), yy = y + 18.5 + fila * 5.6
      doc.setTextColor(...NARANJA); doc.text('•', x, yy)
      doc.setTextColor(40, 52, 80); doc.text(doc.splitTextToSize(t, (W - 2 * M - 14) / 2 - 4)[0], x + 3, yy)
    })
    y += alto + 4
  }

  // Total
  salto(40)
  y += 2
  doc.setFillColor(...AZUL); doc.roundedRect(M, y, W - 2 * M, 24, 4, 4, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('Total al mes', M + 8, y + 10)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(200, 214, 240)
  doc.text('Pesos colombianos. Sin comisión por pedido.', M + 8, y + 16)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(246, 164, 92)
  doc.text(cop(s.total), W - M - 8, y + 15.5, { align: 'right' })
  y += 30
  if (s.promo) {
    doc.setFillColor(255, 241, 232); doc.roundedRect(M, y, W - 2 * M, 10, 3, 3, 'F')
    doc.setTextColor(194, 65, 12); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5)
    doc.text(`Promoción: ${s.promo} (planes que empiecen hasta el 31 de diciembre de 2026).`, W / 2, y + 6.5, { align: 'center' })
    y += 15
  }

  // Condiciones
  salto(34)
  const conds = [
    ['0% comisión', 'Cada peso del pedido es tuyo.'],
    ['Sin contratos', 'Mes a mes. Dejas de pagar y se apaga.'],
    ['Pagas al final', 'El día que te lo entregamos funcionando.'],
    ['Nada que comprar', 'Celular, tablet y el televisor que ya tienes.'],
  ]
  const cw = (W - 2 * M - 9) / 4
  conds.forEach(([t, d], k) => {
    const x = M + k * (cw + 3)
    doc.setDrawColor(227, 232, 242); doc.roundedRect(x, y, cw, 22, 3, 3, 'S')
    doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.text(t, x + 4, y + 7)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRIS); doc.text(doc.splitTextToSize(d, cw - 8), x + 4, y + 12)
  })
  y += 30
  salto(18)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...AZUL)
  doc.text(doc.splitTextToSize('Nosotros montamos tu menú con tu carta, tus fotos y tus precios, y te lo entregamos andando. Si quieres, te visitamos y te explicamos todo el sistema en persona.', W - 2 * M), M, y)
  pie()
  return doc
}
