// 🍔 /api/demo — la demo para clientes vuelve a quedar como nueva SOLA (guía «Blindaje» D5 · S12).
//
// Antes se reiniciaba a mano desde el superadmin (guía «Demo de clientes» D15). Ahora la propuesta
// manda a todos los interesados ahí, así que se reinicia:
//   • GET (tarea programada de Vercel, 3 a. m. de Bogotá) → si nadie la usa hace 30 min.
//   • POST { accion: 'entrar' } → el visitante que llega: si nadie la usa hace 30 min, la reinicia
//     antes de que la vea; si hay alguien, no la toca. Responde { reiniciada }.
//   • POST { accion: 'latido' } → «sigo aquí», cada 5 min mientras alguien la tiene abierta.
//   • POST { accion: 'reiniciar' } con la sesión del superadmin → ya, sin esperar.
// Nadie de afuera puede hacer daño con esto: sin superadmin, solo reinicia lo que nadie está usando.
//
// La actividad vive en config/demoActividad { en (ms), reiniciandoDesde (ms) } — solo el servidor.
import { conAdmin, cuerpo, sesionDe, SUPERADMINS } from './_lib/admin.js'
import { DEMO_LOCAL, DEMO_PRODUCTOS } from '../src/dev/burgerDemo.js'
import { DEMO_SLUG } from '../src/config/demo.js'
import { comandasDeEjemplo, metricasDeEjemplo, pedidoDeEjemplo } from '../src/services/demoEjemplo.js'
import { cuentasDeEjemplo } from '../src/services/cuentasEjemplo.js'
import { armarPedido, publicoDe } from '../src/utils/pedidoDoc.js'

const ID = DEMO_SLUG
const SIN_USO = 30 * 60000
// Lo que el visitante puede ensuciar (pedidosPublicos se borra con los mismos ids de pedidos).
const SUBCOLECCIONES = ['comandas', 'pedidos', 'equipo', 'productos', 'stats', 'ventas', 'movimientos', 'trabajadores', 'resumen', 'pantalla']

// La URL de Storage → su ruta («locales/demo/platos/x.webp»).
const rutaDe = url => { try { return decodeURIComponent(new URL(url).pathname.split('/o/')[1] || '') } catch { return '' } }

async function vaciar(db, nombre) {
  const col = db.collection('locales').doc(ID).collection(nombre)
  const snap = await col.get()
  const tandas = []
  for (let i = 0; i < snap.docs.length; i += 200) {
    const b = db.batch()
    snap.docs.slice(i, i + 200).forEach(d => {
      b.delete(d.ref)
      if (nombre === 'pedidos') b.delete(db.collection('locales').doc(ID).collection('pedidosPublicos').doc(d.id))
    })
    tandas.push(b.commit())
  }
  await Promise.all(tandas)
}

// Lo mismo que hacía «Reiniciar demo» en el navegador (services/demo.js), ahora con firebase-admin.
async function reiniciar(f) {
  const { getFirestore, getStorage, FieldValue, Timestamp } = f
  const db = getFirestore()
  const base = (await db.collection('config').doc('demoBase').get()).data() || null
  const fotosBase = base?.fotos || {}
  const guardar = new Set([...Object.values(fotosBase), base?.banner, base?.logo, base?.icono].filter(Boolean).map(rutaDe).filter(Boolean))

  // Todo en paralelo: las subcolecciones y las fotos de los visitantes (menos las fijadas como base).
  await Promise.all([
    ...SUBCOLECCIONES.map(s => vaciar(db, s)),
    getStorage().bucket().getFiles({ prefix: `locales/${ID}/` })
      .then(([archivos]) => Promise.all(archivos.filter(a => !guardar.has(a.name)).map(a => a.delete().catch(() => {}))))
      .catch(e => console.warn('demo: no se pudieron borrar las fotos', e?.message || e)),
  ])

  const local = db.collection('locales').doc(ID)
  await local.set({
    ...DEMO_LOCAL,
    ...(base?.banner ? { banner: base.banner } : {}),
    ...(base?.logo ? { logo: base.logo } : {}),
    ...(base?.icono ? { icono: base.icono } : {}),
    // Versión nueva del menú: los celulares que guardaron el menú cambiado lo vuelven a leer.
    menuVersion: Date.now(),
    reiniciadaEn: FieldValue.serverTimestamp(),
  })
  const bp = db.batch()
  for (const { id, ...p } of DEMO_PRODUCTOS) bp.set(local.collection('productos').doc(id), { ...p, foto: fotosBase[id] || p.foto })

  const bc = db.batch()
  for (const [id, data] of comandasDeEjemplo(ms => Timestamp.fromMillis(ms))) bc.set(local.collection('comandas').doc(id), data)
  const ej = pedidoDeEjemplo()
  const p = armarPedido(DEMO_LOCAL, ej.pedido, ej.codigo)
  const ttl = Timestamp.fromMillis(Date.now() + 2 * 86400000)
  bc.set(local.collection('pedidos').doc(ej.id), { ...p, createdAt: FieldValue.serverTimestamp(), ttl })
  bc.set(local.collection('pedidosPublicos').doc(ej.id), { ...publicoDe(p), createdAt: FieldValue.serverTimestamp(), ttl })
  for (const [id, data] of metricasDeEjemplo()) bc.set(local.collection('stats').doc(id), data)
  await Promise.all([bp.commit(), bc.commit()])

  const cu = cuentasDeEjemplo(DEMO_LOCAL, DEMO_PRODUCTOS)
  if (cu) {
    const docs = [
      ...cu.ventas.map(({ id, en, ...v }) => ['ventas', id, { ...v, en: Timestamp.fromMillis(en) }]),
      ...cu.movimientos.map(({ id, en, ...m }) => ['movimientos', id, { ...m, en: Timestamp.fromMillis(en) }]),
      ...cu.trabajadores.map(({ id, ...t }) => ['trabajadores', id, { ...t, creadoEn: FieldValue.serverTimestamp() }]),
      ...Object.entries(cu.resumen).map(([id, r]) => ['resumen', id, r]),
    ]
    const tandas = []
    for (let i = 0; i < docs.length; i += 400) {
      const b = db.batch()
      for (const [col, id, data] of docs.slice(i, i + 400)) b.set(local.collection(col).doc(id), data)
      tandas.push(b.commit())
    }
    await Promise.all(tandas)
  }
}

// ¿Le toca reiniciarse? Toma el turno en una transacción: si dos visitantes llegan a la vez, solo
// uno reinicia. Un reinicio que se cayó a la mitad se puede retomar a los 3 minutos.
async function tomarReinicio(db, forzar) {
  const ref = db.collection('config').doc('demoActividad')
  return db.runTransaction(async tx => {
    const d = (await tx.get(ref)).data() || {}
    const ahora = Date.now()
    if (d.reiniciandoDesde && ahora - d.reiniciandoDesde < 3 * 60000) return false
    if (!forzar && d.en && ahora - d.en < SIN_USO) return false
    tx.set(ref, { reiniciandoDesde: ahora }, { merge: true })
    return true
  })
}

export default async function handler(req, res) {
  const f = await conAdmin(res)
  if (!f) return
  const db = f.getFirestore()
  const ref = db.collection('config').doc('demoActividad')
  try {
    const accion = req.method === 'GET' ? 'tarea' : String(cuerpo(req).accion || '')
    if (accion === 'latido') {
      await ref.set({ en: Date.now() }, { merge: true })
      return res.status(200).json({ ok: true })
    }
    if (!['tarea', 'entrar', 'reiniciar'].includes(accion)) return res.status(400).json({ error: 'Acción desconocida' })

    let forzar = false
    if (accion === 'reiniciar') {
      const quien = await sesionDe(f, req)
      if (!SUPERADMINS.includes(String(quien?.email || '').toLowerCase())) return res.status(403).json({ error: 'Solo el superadmin' })
      forzar = true
    }
    const toca = await tomarReinicio(db, forzar)
    if (toca) {
      try { await reiniciar(f) } finally { await ref.set({ reiniciandoDesde: 0, reiniciadaEn: Date.now() }, { merge: true }) }
    }
    // Quien entra o reinicia cuenta como actividad (la tarea de la madrugada no).
    if (accion !== 'tarea') await ref.set({ en: Date.now() }, { merge: true })
    return res.status(200).json({ ok: true, reiniciada: toca })
  } catch (err) {
    console.error('demo:', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}
