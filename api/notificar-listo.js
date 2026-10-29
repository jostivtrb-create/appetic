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
// Requiere la variable de entorno secreta FIREBASE_SERVICE_ACCOUNT en Vercel (el JSON completo de
// la llave de servicio de Firebase). Sin ella responde 503 y la app sigue funcionando igual.
// firebase-admin se carga DENTRO de la petición (no arriba del archivo): si algo falla al cargarlo,
// la función responde el motivo en vez de morir con un FUNCTION_INVOCATION_FAILED mudo.
let fa = null
async function cargar() {
  if (fa) return fa
  const [app, auth, fs, msg] = await Promise.all([
    import('firebase-admin/app'), import('firebase-admin/auth'),
    import('firebase-admin/firestore'), import('firebase-admin/messaging'),
  ])
  fa = {
    initializeApp: app.initializeApp, cert: app.cert, getApps: app.getApps,
    getAuth: auth.getAuth, getFirestore: fs.getFirestore, FieldValue: fs.FieldValue, getMessaging: msg.getMessaging,
  }
  return fa
}

const SUPERADMINS = ['jostivtrb@gmail.com'] // espejo de src/config/roles.js

function iniciar({ getApps, initializeApp, cert }) {
  if (getApps().length) return true
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return false
  initializeApp({ credential: cert(JSON.parse(raw)) })
  return true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })
  let f
  try { f = await cargar() } catch (e) {
    console.error('notificar-listo: no cargó firebase-admin', e)
    return res.status(500).json({ error: 'No cargó firebase-admin', detalle: String(e?.message || e).slice(0, 300), node: process.version })
  }
  const { getAuth, getFirestore, FieldValue, getMessaging } = f
  try {
    if (!iniciar(f)) return res.status(503).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel', node: process.version })
  } catch (e) {
    return res.status(500).json({ error: 'La llave FIREBASE_SERVICE_ACCOUNT no es válida', detalle: String(e?.message || e).slice(0, 200) })
  }

  try {
    const idToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!idToken) return res.status(401).json({ error: 'Sin sesión' })
    const quien = await getAuth().verifyIdToken(idToken).catch(() => null)
    if (!quien) return res.status(401).json({ error: 'Sesión inválida' })
    const email = String(quien.email || '').toLowerCase()

    const { localId, comandaId } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    if (!localId || !comandaId) return res.status(400).json({ error: 'Faltan datos' })

    const db = getFirestore()
    const localRef = db.collection('locales').doc(String(localId))
    const [localSnap, comandaSnap, cocinaSnap, meseroSnap] = await Promise.all([
      localRef.get(),
      localRef.collection('comandas').doc(String(comandaId)).get(),
      localRef.collection('equipo').doc(`cocina:${email}`).get(),
      localRef.collection('equipo').doc(`mesero:${email}`).get(),
    ])
    if (!localSnap.exists || !comandaSnap.exists) return res.status(404).json({ error: 'No existe' })
    const local = localSnap.data()
    const admins = (local.admins || []).map(e => String(e).toLowerCase())
    const esPersonal = SUPERADMINS.includes(email) || admins.includes(email)
      || (cocinaSnap.exists && cocinaSnap.data().activo) || (meseroSnap.exists && meseroSnap.data().activo)
    if (!esPersonal) return res.status(403).json({ error: 'No autorizado' })

    const comanda = comandaSnap.data()
    if (comanda.estado !== 'entregada') return res.status(409).json({ error: 'La comanda no está entregada' })
    const antes = comanda.notificadaEn?.toMillis?.() || 0
    if (Date.now() - antes < 2 * 60000) return res.status(200).json({ enviadas: 0, motivo: 'ya avisada' })

    // A quién: el mesero que la tomó + los admins del local.
    const destinatarios = [...new Set([String(comanda.creadaPor?.email || '').toLowerCase(), ...admins].filter(Boolean))].slice(0, 30)
    if (!destinatarios.length) return res.status(200).json({ enviadas: 0 })
    const dispSnap = await localRef.collection('dispositivos').where('email', 'in', destinatarios).get()
    const tokens = dispSnap.docs.map(d => d.id)
    await comandaSnap.ref.update({ notificadaEn: FieldValue.serverTimestamp() })
    if (!tokens.length) return res.status(200).json({ enviadas: 0 })

    const d = comanda.destino || {}
    const donde = d.tipo === 'llevar' ? `Para llevar${d.nombre ? ` · ${d.nombre}` : ''}` : (d.mesa ? `Mesa ${d.mesa}` : (d.nombre || 'Mesa'))
    const n = comanda.cantidadItems || 0
    const r = await getMessaging().sendEachForMulticast({
      tokens,
      webpush: {
        notification: {
          title: `🔔 ¡Pedido listo! ${donde}`,
          body: `${n} ${n === 1 ? 'ítem' : 'ítems'} · ${local.nombre || 'Appetic'}`,
          icon: local.icono || local.logo || '/icons/icon-192.png',
          tag: `listo-${comandaId}`,
          renotify: true,
        },
        fcmOptions: { link: `/${local.slug}/admin/mesero` },
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
