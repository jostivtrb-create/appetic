// 👑 Operaciones de superadmin (solo jostivtrb@gmail.com, ver firestore.rules):
// listar todos los locales, sus dueños, etiquetas y prioridad, y su PLAN Y PAGO (guía «Planes en la app»).
import {
  collection, getDocs, doc, updateDoc, writeBatch, Timestamp, serverTimestamp, deleteField, query, orderBy,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { calcularCorte, calcularPago, hoyBogota, DIAS_MONTAJE, paquetesDe, nombresPaquetes } from '../utils/plan'
import { limpiarPaquetes, cotizar } from '../utils/paquetes'

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
// 📦 Desde la fase B se cobran y se cambian PAQUETES (guía «Paquetes de Appetic»): `suscripcion.paquetes`.
// El campo viejo `plan` se deja como está (solo lo leen los locales que aún no tienen paquetes).
export async function registrarPago(local, { paquetes, promo, monto, nota = '' }) {
  const ids = limpiarPaquetes(paquetes)
  const c = calcularPago(local, { paquetes: ids, promo })
  const sus = { ...(local.suscripcion || {}), paquetes: ids, estado: 'activo', pagadoHasta: c.hasta }
  delete sus.bajarA
  const corte = calcularCorte(sus)
  const b = writeBatch(db)
  b.set(doc(collection(db, 'pagos')), {
    localId: local.id, nombre: local.nombre || local.slug, slug: local.slug,
    tipo: 'pago', paquetes: ids, alMes: cotizar(ids).total, promo, meses: c.meses, monto: Number(monto) || 0,
    fecha: hoyBogota(), desde: c.desde, hasta: c.hasta, nota, en: serverTimestamp(),
  })
  b.update(doc(db, 'locales', local.id), {
    'suscripcion.paquetes': ids, 'suscripcion.estado': 'activo', 'suscripcion.pagadoHasta': c.hasta,
    'suscripcion.corteEn': ts(corte), 'suscripcion.bajarA': deleteField(), 'suscripcion.activa': deleteField(),
  })
  await b.commit()
  return { ...sus, corteEn: ts(corte) }
}

// Cambia los paquetes YA. Si se cobra diferencia (sumó paquetes con el pago vigente), queda en el historial.
export async function cambiarPaquetes(local, paquetes, monto = 0) {
  const ids = limpiarPaquetes(paquetes)
  const b = writeBatch(db)
  if (Number(monto) > 0) {
    b.set(doc(collection(db, 'pagos')), {
      localId: local.id, nombre: local.nombre || local.slug, slug: local.slug,
      tipo: 'diferencia', paquetes: ids, desdePaquetes: paquetesDe(local), monto: Number(monto),
      fecha: hoyBogota(), desde: hoyBogota(), hasta: local.suscripcion?.pagadoHasta || null,
      nota: `Pasa de ${nombresPaquetes(paquetesDe(local))} a ${nombresPaquetes(ids)}`, en: serverTimestamp(),
    })
  }
  b.update(doc(db, 'locales', local.id), { 'suscripcion.paquetes': ids, 'suscripcion.bajarA': deleteField() })
  await b.commit()
  const { bajarA: _, ...sus } = local.suscripcion || {}
  return { ...sus, paquetes: ids }
}
// Programa (o cancela con null) quitar paquetes desde el próximo pago: no se devuelve plata.
export async function programarBajada(local, paquetes) {
  const ids = paquetes ? limpiarPaquetes(paquetes) : null
  await updateDoc(doc(db, 'locales', local.id), { 'suscripcion.bajarA': ids || deleteField() })
  const sus = { ...(local.suscripcion || {}) }
  if (ids) sus.bajarA = ids; else delete sus.bajarA
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
  if (!sus.plan && !Array.isArray(sus.paquetes)) { sus.paquetes = paquetesDe(local); cambios['suscripcion.paquetes'] = sus.paquetes }
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
