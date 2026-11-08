// 🔔 POST /api/avisar-clientes — el dueño manda un aviso a sus clientes (guía «Paquetes de Appetic»
// D9, D31: a quien marcó el local de favorito o le ha pedido, y aceptó recibirlos).
//
// Seguridad y tope:
//   • Token de sesión (Authorization: Bearer <idToken>): el dueño del local (admins) o el superadmin.
//   • Ni la demo ni un local apagado por no pago.
//   • Máximo 3 avisos por semana (lunes a domingo, hora de Bogotá), contados en una transacción en
//     locales/{id}/avisosSemana/{lunes}: dos toques a la vez no pasan el tope.
//   • Título ≤ 50 y mensaje ≤ 140 letras. Al tocarlo abre el menú del local.
// Los celulares que ya no existen (app desinstalada o permiso quitado) se borran solos.
import { conAdmin, sesionDe, cuerpo, SUPERADMINS } from './_lib/admin.js'
import { estadoPago, tiene } from '../src/utils/plan.js'
import { MAX_POR_SEMANA, TITULO_MAX, MENSAJE_MAX, semanaDe, limpiarTexto } from '../src/utils/avisosClientes.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })
  const f = await conAdmin(res)
  if (!f) return
  const { getFirestore, FieldValue, getMessaging } = f
  try {
    const quien = await sesionDe(f, req)
    if (!quien?.email) return res.status(401).json({ error: 'Sesión inválida' })
    const email = String(quien.email).toLowerCase()
    const b = cuerpo(req)
    const localId = String(b.localId || '')
    const titulo = limpiarTexto(b.titulo, TITULO_MAX), mensaje = limpiarTexto(b.mensaje, MENSAJE_MAX)
    if (!localId || !titulo || !mensaje) return res.status(400).json({ error: 'Escribe el título y el mensaje.' })

    const db = getFirestore()
    const localRef = db.collection('locales').doc(localId)
    const localSnap = await localRef.get()
    if (!localSnap.exists) return res.status(404).json({ error: 'No existe' })
    const local = localSnap.data()
    const esSuper = SUPERADMINS.includes(email)
    if (!esSuper && !(local.admins || []).map(e => String(e).toLowerCase()).includes(email)) return res.status(403).json({ error: 'No autorizado' })
    if (local.esDemo) return res.status(403).json({ error: 'En la demo los avisos no se envían de verdad.' })
    if (estadoPago(local).estado === 'cortado' && !esSuper) return res.status(403).json({ error: 'El local está apagado por pago pendiente.' })
    if (!tiene(local, 'notificaciones')) return res.status(403).json({ error: 'Tu plan no trae los avisos.' })

    // Tope semanal, en transacción.
    const semana = semanaDe()
    const contRef = localRef.collection('avisosSemana').doc(semana)
    const n = await db.runTransaction(async tx => {
      const actual = (await tx.get(contRef)).data()?.n || 0
      if (actual >= MAX_POR_SEMANA) return -1
      tx.set(contRef, { n: actual + 1 }, { merge: true })
      return actual + 1
    })
    if (n < 0) return res.status(429).json({ error: `Ya mandaste los ${MAX_POR_SEMANA} avisos de esta semana. El lunes tienes otros ${MAX_POR_SEMANA}.` })

    const subs = await localRef.collection('suscriptores').get()
    const tokens = subs.docs.map(d => d.id)
    let enviadas = 0, fallidas = 0
    const muertos = []
    for (let i = 0; i < tokens.length; i += 500) {
      const grupo = tokens.slice(i, i + 500)
      const r = await getMessaging().sendEachForMulticast({
        tokens: grupo,
        webpush: {
          notification: { title: `${local.nombre}: ${titulo}`, body: mensaje, icon: local.icono || local.logo || '/icons/icon-192.png', tag: `aviso-${localId}` },
          fcmOptions: { link: `/${local.slug || localId}` },
        },
      })
      enviadas += r.successCount; fallidas += r.failureCount
      r.responses.forEach((x, k) => { if (!x.success && /registration-token-not-registered|invalid-argument/.test(x.error?.code || '')) muertos.push(grupo[k]) })
    }
    await Promise.all(muertos.map(t => localRef.collection('suscriptores').doc(t).delete().catch(() => {})))
    await localRef.collection('avisos').add({ titulo, mensaje, semana, en: FieldValue.serverTimestamp(), por: email, enviadas, fallidas, borrados: muertos.length })
    return res.status(200).json({ ok: true, enviadas, fallidas, quedan: MAX_POR_SEMANA - n })
  } catch (err) {
    console.error('avisar-clientes:', err)
    return res.status(500).json({ error: 'No se pudo enviar. Intenta de nuevo.' })
  }
}
