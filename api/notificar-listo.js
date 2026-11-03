// 🔔 POST /api/notificar-listo — función de Vercel (guía «Mesero y Comandas», 1g).
//
// La cocina confirmó «entregado» → avisar con notificación del sistema (aunque la app esté
// cerrada) al MESERO que tomó la comanda y a los ADMIN del local.
//
// Se hace en Vercel y no con Cloud Functions porque esas exigen el plan pago (Blaze) de Firebase.
//
// Seguridad:
//   • Exige el token de sesión de Firebase de quien llama (Authorization: Bearer <idToken>).
//   • Quien llama tiene que ser admin, superadmin o cocina/mesero ACTIVO de ese local.
//   • La comanda tiene que existir y estar «entregada» (no se puede usar para mandar avisos al aire).
//   • Una comanda avisa una sola vez cada 2 minutos (si la cocina deshace y vuelve a entregar).
//
// Requiere la variable de entorno secreta FIREBASE_SERVICE_ACCOUNT en Vercel: la llave de servicio
// de Firebase en base64 de una línea (scripts/serviceAccount.base64.txt, ignorado por git) o el
// JSON tal cual. Sin ella responde 503 y la app sigue funcionando igual.
// La carga de firebase-admin y la llave viven en api/_lib/admin.js (compartido con /api/pedido y /api/demo).
import { conAdmin, sesionDe, SUPERADMINS } from './_lib/admin.js'
import { estadoPago, tiene } from '../src/utils/plan.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })
  const f = await conAdmin(res)
  if (!f) return
  const { getFirestore, FieldValue, getMessaging } = f

  try {
    if (!String(req.headers.authorization || '').trim()) return res.status(401).json({ error: 'Sin sesión' })
    const quien = await sesionDe(f, req)
    if (!quien) return res.status(401).json({ error: 'Sesión inválida' })
    const email = String(quien.email || '').toLowerCase()

    const { localId, comandaId } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    if (!localId || !comandaId) return res.status(400).json({ error: 'Faltan datos' })

    const db = getFirestore()
    const localRef = db.collection('locales').doc(String(localId))
    const [localSnap, comandaSnap, cocinaSnap, meseroSnap, cajeroSnap] = await Promise.all([
      localRef.get(),
      localRef.collection('comandas').doc(String(comandaId)).get(),
      localRef.collection('equipo').doc(`cocina:${email}`).get(),
      localRef.collection('equipo').doc(`mesero:${email}`).get(),
      localRef.collection('equipo').doc(`cajero:${email}`).get(),
    ])
    if (!localSnap.exists || !comandaSnap.exists) return res.status(404).json({ error: 'No existe' })
    const local = localSnap.data()
    // Un local apagado por no pago no manda avisos (espejo de localVivo() en las reglas).
    if (estadoPago(local).estado === 'cortado' && !SUPERADMINS.includes(email)) return res.status(403).json({ error: 'Local fuera de servicio' })
    const admins = (local.admins || []).map(e => String(e).toLowerCase())
    // (Solo el personal que mueve comandas puede pedir el aviso: admin, cocina, mesero o caja.)
    const activo = s => s.exists && s.data().activo
    const esPersonal = SUPERADMINS.includes(email) || admins.includes(email)
      || activo(cocinaSnap) || activo(meseroSnap) || activo(cajeroSnap)
    if (!esPersonal) return res.status(403).json({ error: 'No autorizado' })

    const comanda = comandaSnap.data()
    if (comanda.estado !== 'entregada') return res.status(409).json({ error: 'La comanda no está entregada' })
    const antes = comanda.notificadaEn?.toMillis?.() || 0
    if (Date.now() - antes < 2 * 60000) return res.status(200).json({ enviadas: 0, motivo: 'ya avisada' })

    // A quién: el mesero que la tomó + los admins del local. Si es un DOMICILIO de la app, además los
    // domiciliarios activos del local (D39: les suena cuando la cocina lo deja listo para salir).
    const esDomicilio = comanda.destino?.tipo === 'domicilio'
    let domiciliarios = []
    if (esDomicilio && tiene(local, 'domiciliario')) {
      const eq = await localRef.collection('equipo').where('rol', '==', 'domiciliario').get()
      domiciliarios = eq.docs.map(d => d.data()).filter(x => x.activo).map(x => String(x.email).toLowerCase())
    }
    // Pedido desde el QR de la mesa: nadie lo tomó, así que avisa a TODOS los meseros activos.
    if (comanda.origen === 'qr' && tiene(local, 'mesero')) {
      const eq = await localRef.collection('equipo').where('rol', '==', 'mesero').get()
      domiciliarios = [...domiciliarios, ...eq.docs.map(d => d.data()).filter(x => x.activo).map(x => String(x.email).toLowerCase())]
    }
    const destinatarios = [...new Set([...domiciliarios, String(comanda.creadaPor?.email || '').toLowerCase(), ...admins].filter(Boolean))]
    if (!destinatarios.length) return res.status(200).json({ enviadas: 0 })
    // Firestore deja buscar de a 30 correos por consulta («in»): se parte en grupos (antes se
    // cortaba en 30 y los de más no recibían nada).
    const grupos = []
    for (let i = 0; i < destinatarios.length; i += 30) grupos.push(destinatarios.slice(i, i + 30))
    const snaps = await Promise.all(grupos.map(g => localRef.collection('dispositivos').where('email', 'in', g).get()))
    const tokens = [...new Set(snaps.flatMap(s => s.docs.map(d => d.id)))]
    await comandaSnap.ref.update({ notificadaEn: FieldValue.serverTimestamp() })
    if (!tokens.length) return res.status(200).json({ enviadas: 0 })

    const d = comanda.destino || {}
    const donde = d.tipo === 'llevar' ? `Para llevar${d.nombre ? ` · ${d.nombre}` : ''}`
      : d.tipo === 'domicilio' ? `Domicilio${d.nombre ? ` · ${d.nombre}` : ''}`
        : d.tipo === 'recoger' ? `Recoger${d.nombre ? ` · ${d.nombre}` : ''}`
          : (d.mesa ? `Mesa ${d.mesa}` : (d.nombre || 'Mesa'))
    const n = comanda.cantidadItems || 0
    const r = await getMessaging().sendEachForMulticast({
      tokens,
      webpush: {
        notification: {
          title: esDomicilio ? `🛵 Domicilio listo para salir · ${comanda.codigo || ''}` : `🔔 ¡Pedido listo! ${donde}`,
          body: `${n} ${n === 1 ? 'ítem' : 'ítems'} · ${local.nombre || 'Appetic'}`,
          icon: local.icono || local.logo || '/icons/icon-192.png',
          tag: `listo-${comandaId}`,
          renotify: true,
        },
        fcmOptions: { link: `/${local.slug}/admin/${esDomicilio ? 'domicilios' : 'mesero'}` },
      },
    })

    // Limpia los celulares que ya no existen (app desinstalada, permiso quitado).
    const muertos = r.responses
      .map((x, i) => (!x.success && /registration-token-not-registered|invalid-argument/.test(x.error?.code || '')) ? tokens[i] : null)
      .filter(Boolean)
    await Promise.all(muertos.map(t => localRef.collection('dispositivos').doc(t).delete().catch(() => {})))

    return res.status(200).json({ enviadas: r.successCount, fallidas: r.failureCount })
  } catch (err) {
    console.error('notificar-listo:', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}
