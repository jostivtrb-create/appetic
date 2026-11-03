// 💳 PLANES Y PAGO de cada local (guía «Planes en la app»).
//
// En locales/{id}:
//   suscripcion = { plan, estado, montajeDesde, pagadoHasta, corteEn, bajarA }
//     plan         emprendedor · comerciante · empresario (escalera: lo de uno lo traen los de arriba)
//     estado       montaje (antes del primer pago, 7 días) · activo (paga) · cortesia (muestras y demo)
//     pagadoHasta  'YYYY-MM-DD': el día que vence lo pagado
//     corteEn      el instante exacto del corte (pagadoHasta + 3 días de gracia, o montaje + 7 días).
//                  Lo leen las REGLAS para apagar el local sin depender de nadie (firestore.rules).
//     bajarA       plan más chico programado: se cobra así desde el próximo pago (D16)
//   enBuscador    lo prende el dueño (D6). Reemplaza al viejo `suscripcion.activa`.
//
// Un local sin `estado` (datos viejos, locales de desarrollo) cuenta como CORTESÍA y sin plan cuenta
// como EMPRESARIO: así nada se apaga por accidente antes de migrar.
// ⚠️ Espejo de las funciones `nivelPlan()` y `localVivo()` de firestore.rules: si cambias uno, el otro.

export const PLANES = {
  emprendedor: { id: 'emprendedor', nombre: 'Emprendedor', nivel: 1, precio: 59900, frase: 'Menú, pedidos y cuentas' },
  comerciante: { id: 'comerciante', nombre: 'Comerciante', nivel: 2, precio: 79900, frase: 'Más domicilios' },
  empresario: { id: 'empresario', nombre: 'Empresario', nivel: 3, precio: 99900, frase: 'Todo: mesas, meseros y cocina' },
}
export const LISTA_PLANES = Object.values(PLANES)

// Qué plan hace falta para cada función (lo que no está aquí lo traen todos).
const MINIMO = {
  domicilios: 'comerciante', // pedidos a domicilio, envío por distancia, afiche de domicilios
  domiciliario: 'comerciante',
  mesero: 'empresario',
  cocina: 'empresario',
  mesas: 'empresario', // QR por mesa y cuenta por mesa
}

export const DIAS_AVISO = 5
export const DIAS_GRACIA = 3
export const DIAS_MONTAJE = 7
// 2.º mes gratis: para los que empiezan hasta esta fecha (propuesta, letra pequeña).
export const PROMO_HASTA = '2026-12-31'

// Formas de pagar (propuesta, página de planes). `paga` meses que se cobran, `cubre` meses que da.
export const PROMOS = {
  mes: { id: 'mes', nombre: '1 mes', paga: 1, cubre: 1 },
  'segundo-gratis': { id: 'segundo-gratis', nombre: '1 mes + 2.º gratis', paga: 1, cubre: 2 },
  'seis-x-cinco': { id: 'seis-x-cinco', nombre: '6 meses (pagas 5)', paga: 5, cubre: 6 },
  'doce-x-diez': { id: 'doce-x-diez', nombre: '12 meses (pagas 10)', paga: 10, cubre: 12 },
}

// ── Simulación en DEV: ?plan=emprendedor&pago=gracia (pago: montaje|al-dia|por-vencer|gracia|cortado) ──
function simulado() {
  if (!import.meta.env?.DEV || typeof window === 'undefined') return {}
  try {
    const q = new URLSearchParams(window.location.search)
    for (const k of ['plan', 'pago']) {
      const v = q.get(k)
      if (v === '0') sessionStorage.removeItem(`appetic_dev_${k}`)
      else if (v) sessionStorage.setItem(`appetic_dev_${k}`, v)
    }
    return { plan: sessionStorage.getItem('appetic_dev_plan'), pago: sessionStorage.getItem('appetic_dev_pago') }
  } catch { return {} }
}

export function planDe(local) {
  const sim = simulado().plan
  if (sim && PLANES[sim]) return sim
  const p = local?.suscripcion?.plan
  return PLANES[p] ? p : 'empresario'
}
export const nombrePlan = id => PLANES[id]?.nombre || id

// ¿Este local tiene esta función en su plan?
export function tiene(local, funcion) {
  const min = MINIMO[funcion]
  return !min || PLANES[planDe(local)].nivel >= PLANES[min].nivel
}
// El plan más chico que trae la función (para el candado «Disponible en el plan …»).
export const planPara = funcion => MINIMO[funcion] || 'emprendedor'

// Los roles del equipo que deja el plan.
export function rolPermitido(local, rol) {
  if (rol === 'mesero' || rol === 'cocina') return tiene(local, rol)
  if (rol === 'domiciliario') return tiene(local, 'domiciliario')
  return true
}

// ─────────────────────────────── Fechas (hora de Bogotá) ───────────────────────────────

const DIA = 86400000
// 'YYYY-MM-DD' de hoy en Bogotá (UTC-5 todo el año).
export function hoyBogota(ahora = Date.now()) {
  return new Date(ahora - 5 * 3600000).toISOString().slice(0, 10)
}
// Medianoche de Bogotá de ese día, en milisegundos.
export const msDe = fecha => Date.parse(`${fecha}T00:00:00-05:00`)
export const sumarDias = (fecha, n) => new Date(msDe(fecha) + n * DIA + 5 * 3600000).toISOString().slice(0, 10)
export const diasEntre = (desde, hasta) => Math.round((msDe(hasta) - msDe(desde)) / DIA)
// Suma meses al calendario: 31-ene + 1 mes = 28/29-feb (no se salta al 3 de marzo).
export function sumarMeses(fecha, n) {
  const [a, m, d] = fecha.split('-').map(Number)
  const total = a * 12 + (m - 1) + n
  const ano = Math.floor(total / 12), mes = total % 12
  const ultimo = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`
}
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function fechaCorta(fecha) {
  if (!fecha) return '—'
  const [a, m, d] = fecha.split('-').map(Number)
  return `${d} ${MESES[m - 1]}${a !== Number(hoyBogota().slice(0, 4)) ? ` ${a}` : ''}`
}
// Timestamp de Firestore, Date o milisegundos → milisegundos.
export const aMs = t => (t == null ? null : typeof t === 'number' ? t : t.toMillis ? t.toMillis() : t instanceof Date ? t.getTime() : t.seconds ? t.seconds * 1000 : null)

// El instante del corte según el estado (lo que se guarda en suscripcion.corteEn).
export function calcularCorte({ estado, pagadoHasta, montajeDesde }) {
  if (estado === 'activo' && pagadoHasta) return msDe(sumarDias(pagadoHasta, DIAS_GRACIA))
  if (estado === 'montaje' && montajeDesde != null) return aMs(montajeDesde) + DIAS_MONTAJE * DIA
  return null
}

// ─────────────────────────────── Estado del pago ───────────────────────────────
//
// { estado, dias, vence, corte }
//   cortesia    sin vencimiento (muestras, demo, datos viejos)
//   montaje     antes del primer pago; `dias` que quedan de los 7
//   al-dia      pago vigente
//   por-vencer  faltan DIAS_AVISO días o menos; `dias` para que venza
//   gracia      ya venció, quedan `dias` para el corte
//   cortado     apagado: menú fuera de servicio y panel con el aviso de pago
export function estadoPago(local, ahora = Date.now()) {
  const s = local?.suscripcion || {}
  const sim = simulado().pago
  if (sim) return simularEstado(sim, ahora)
  if (local?.esDemo || !s.estado || s.estado === 'cortesia') return { estado: 'cortesia' }
  const corte = aMs(s.corteEn) ?? calcularCorte(s)
  if (s.estado === 'montaje') {
    if (corte != null && ahora >= corte) return { estado: 'cortado', corte }
    return { estado: 'montaje', dias: corte == null ? DIAS_MONTAJE : Math.max(1, Math.ceil((corte - ahora) / DIA)), corte }
  }
  if (!s.pagadoHasta) return { estado: 'cortado', corte }
  if (corte != null && ahora >= corte) return { estado: 'cortado', vence: s.pagadoHasta, corte }
  const hoy = hoyBogota(ahora)
  const faltan = diasEntre(hoy, s.pagadoHasta)
  if (faltan <= 0) return { estado: 'gracia', dias: Math.max(1, DIAS_GRACIA + faltan), vence: s.pagadoHasta, corte }
  if (faltan <= DIAS_AVISO) return { estado: 'por-vencer', dias: faltan, vence: s.pagadoHasta, corte }
  return { estado: 'al-dia', dias: faltan, vence: s.pagadoHasta, corte }
}

function simularEstado(sim, ahora) {
  const hoy = hoyBogota(ahora)
  if (sim === 'montaje') return { estado: 'montaje', dias: 4 }
  if (sim === 'por-vencer') return { estado: 'por-vencer', dias: 3, vence: sumarDias(hoy, 3) }
  if (sim === 'gracia') return { estado: 'gracia', dias: 2, vence: sumarDias(hoy, -1) }
  if (sim === 'cortado') return { estado: 'cortado', vence: sumarDias(hoy, -4) }
  return { estado: 'al-dia', dias: 20, vence: sumarDias(hoy, 20) }
}

export const estaCortado = (local, ahora) => estadoPago(local, ahora).estado === 'cortado'

// ¿Sale en el buscador? Solo si el dueño lo prendió y está al día (D6, D7). En montaje nunca (D9).
// Sin `enBuscador` (datos de antes de migrar) vale el viejo `suscripcion.activa`.
export const quiereBuscador = local => !!(local?.enBuscador ?? local?.suscripcion?.activa)
export function apareceEnBuscador(local, ahora) {
  if (!quiereBuscador(local) || local?.esDemo) return false
  const e = estadoPago(local, ahora).estado
  return e !== 'cortado' && e !== 'montaje'
}

// ─────────────────────────────── Cálculos del superadmin ───────────────────────────────

export const redondear100 = n => Math.round(n / 100) * 100

// ¿Puede usar el 2.º mes gratis? Solo en su PRIMER pago y si empieza antes de PROMO_HASTA (S12).
export const puedeSegundoGratis = (pagosPrevios, hoy = hoyBogota()) => pagosPrevios === 0 && hoy <= PROMO_HASTA

// Lo que queda al registrar un pago normal.
//   Si está en montaje o ya lo cortaron, el período arranca HOY (D17); si no, sigue desde lo que vencía.
export function calcularPago(local, { plan, promo }, ahora = Date.now()) {
  const p = PROMOS[promo] || PROMOS.mes
  const e = estadoPago(local, ahora).estado
  const hoy = hoyBogota(ahora)
  const vence = local?.suscripcion?.pagadoHasta
  const desde = (e === 'al-dia' || e === 'por-vencer' || e === 'gracia') && vence ? vence : hoy
  const hasta = sumarMeses(desde, p.cubre)
  return { desde, hasta, meses: p.cubre, monto: PLANES[plan].precio * p.paga }
}

// Diferencia al SUBIR de plan a mitad de período (D16, S15): días que faltan × diferencia diaria.
export function calcularDiferencia(local, planNuevo, ahora = Date.now()) {
  const vence = local?.suscripcion?.pagadoHasta
  const dias = vence ? Math.max(0, diasEntre(hoyBogota(ahora), vence)) : 0
  const dif = PLANES[planNuevo].precio - PLANES[planDe(local)].precio
  return { dias, monto: Math.max(0, redondear100((dif / 30) * dias)) }
}
