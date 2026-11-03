// 👑 Operaciones de superadmin (solo jostivtrb@gmail.com, ver firestore.rules):
// listar todos los locales, sus dueños, etiquetas y prioridad, y su PLAN Y PAGO (guía «Planes en la app»).
import {
  collection, getDocs, doc, updateDoc, writeBatch, Timestamp, serverTimestamp, deleteField, query, orderBy,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { calcularCorte, calcularPago, hoyBogota, nombrePlan, DIAS_MONTAJE } from '../utils/plan'

export async function listarTodosLocales() {
  const snap = await getDocs(collection(db, 'locales'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─────────────────────────────── 💳 Plan y pago ───────────────────────────────
// `corteEn` va como Timestamp: las reglas lo comparan con request.time para apagar el local solas.
const ts = ms => (ms == null ? null : Timestamp.fromMillis(ms))

// Todos los pagos (son pocos: uno por local al mes). Del más nuevo al más viejo.
export async function listarPagos() {
  const snap = await getDocs(query(collection(db, 'pagos'), orderBy('fecha', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Registra un pago normal: queda ACTIVO, con el plan del pago, y se corre «pagado hasta».
// Si había una bajada programada, este pago ya es del plan nuevo (D16) y se borra la marca.
// Devuelve la suscripción nueva (para pintarla sin volver a leer).
export async function registrarPago(local, { plan, promo, monto, nota = '' }) {
  const c = calcularPago(local, { plan, promo })
  const sus = { ...(local.suscripcion || {}), plan, estado: 'activo', pagadoHasta: c.hasta }
  delete sus.bajarA
  const corte = calcularCorte(sus)
  const b = writeBatch(db)
  b.set(doc(collection(db, 'pagos')), {
    localId: local.id, nombre: local.nombre || local.slug, slug: local.slug,
    tipo: 'pago', plan, promo, meses: c.meses, monto: Number(monto) || 0,
    fecha: hoyBogota(), desde: c.desde, hasta: c.hasta, nota, en: serverTimestamp(),
  })
  b.update(doc(db, 'locales', local.id), {
    'suscripcion.plan': plan, 'suscripcion.estado': 'activo', 'suscripcion.pagadoHasta': c.hasta,
    'suscripcion.corteEn': ts(corte), 'suscripcion.bajarA': deleteField(), 'suscripcion.activa': deleteField(),
  })
  await b.commit()
  return { ...sus, corteEn: ts(corte) }
}

// Sube de plan ya. Si hay diferencia que cobrar (pago vigente), queda en el historial (D16, S15).
export async function subirPlan(local, plan, monto = 0) {
  const b = writeBatch(db)
  if (Number(monto) > 0) {
    b.set(doc(collection(db, 'pagos')), {
      localId: local.id, nombre: local.nombre || local.slug, slug: local.slug,
      tipo: 'diferencia', plan, desdePlan: local.suscripcion?.plan || null, monto: Number(monto),
      fecha: hoyBogota(), desde: hoyBogota(), hasta: local.suscripcion?.pagadoHasta || null,
      nota: `Sube de ${nombrePlan(local.suscripcion?.plan)} a ${nombrePlan(plan)}`, en: serverTimestamp(),
    })
  }
  b.update(doc(db, 'locales', local.id), { 'suscripcion.plan': plan, 'suscripcion.bajarA': deleteField() })
  await b.commit()
  const { bajarA: _, ...sus } = local.suscripcion || {}
  return { ...sus, plan }
}

// Cambia el plan sin cobrar nada (montaje, cortesía) o programa/cancela una bajada (bajarA).
export async function setPlanSinCobro(local, plan) {
  await updateDoc(doc(db, 'locales', local.id), { 'suscripcion.plan': plan, 'suscripcion.bajarA': deleteField() })
  const { bajarA: _, ...sus } = local.suscripcion || {}
  return { ...sus, plan }
}
export async function programarBajada(local, plan) {
  await updateDoc(doc(db, 'locales', local.id), { 'suscripcion.bajarA': plan || deleteField() })
  const sus = { ...(local.suscripcion || {}) }
  if (plan) sus.bajarA = plan; else delete sus.bajarA
  return sus
}

// Estado a mano: «montaje» (7 días desde HOY, para montar y entregar) o «cortesía» (sin cobro).
export async function setEstadoLocal(local, estado) {
  const sus = { ...(local.suscripcion || {}), estado }
  const cambios = { 'suscripcion.estado': estado, 'suscripcion.activa': deleteField() }
  if (estado === 'montaje') {
    const desde = Date.now()
    sus.montajeDesde = ts(desde)
    sus.corteEn = ts(desde + DIAS_MONTAJE * 86400000)
    Object.assign(cambios, { 'suscripcion.montajeDesde': sus.montajeDesde, 'suscripcion.corteEn': sus.corteEn })
  } else if (estado === 'cortesia') {
    sus.corteEn = null
    cambios['suscripcion.corteEn'] = null
  }
  if (!sus.plan) { sus.plan = 'empresario'; cambios['suscripcion.plan'] = 'empresario' }
  await updateDoc(doc(db, 'locales', local.id), cambios)
  return sus
}

// Define los correos de los ADMINS (dueños) del local. Con esos Google entran a
// /<slug>/admin. Se admite MÁS DE UNO (ej. el dueño y su socio o el encargado):
// todos tienen exactamente los mismos permisos, no hay jerarquía entre ellos.
// Guarda los correos normalizados (minúsculas, sin espacios) y sin repetidos:
// firestore.rules compara el correo del token TAL CUAL contra `admins`, así que un
// correo con mayúsculas abriría el panel pero fallaría al guardar.
// Solo el superadmin puede hacerlo (ver firestore.rules).
export async function setAdminEmails(localId, emails) {
  const lista = (Array.isArray(emails) ? emails : [emails])
    .map(e => String(e || '').trim().toLowerCase())
    .filter(Boolean)
  await updateDoc(doc(db, 'locales', localId), { admins: [...new Set(lista)] })
}

// 🗂️ Etiquetas del local para los chips del INICIO (ids del catálogo curado
// en src/config/categoriasLocales.js). Solo el superadmin las cambia.
export async function setEtiquetas(localId, etiquetas) {
  await updateDoc(doc(db, 'locales', localId), { etiquetas: etiquetas || [] })
}

// ⭐ Prioridad comercial: el local con prioridad > 0 aparece arriba del listado
// del inicio con el badge "Recomendado" (el boost sutil del local bandera).
export async function setPrioridad(localId, prioridad) {
  await updateDoc(doc(db, 'locales', localId), { prioridad: Number(prioridad) || 0 })
}
