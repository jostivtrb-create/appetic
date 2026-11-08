// 🧮 POST /api/arqueo — guarda un conteo de la caja (guía «Mejoras frente a Loggro» D17, D18 y S7).
//
// Va por el servidor porque el ESPERADO sale de locales/{id}/resumen/saldos, que el cajero no
// puede leer: así cuenta a ciegas. El servidor toma el saldo de esa cuenta en el mismo instante y
// guarda contado, esperado y diferencia. Al cajero le responde solo lo contado; al dueño, todo.
//
// Seguridad:
//   • Token de sesión de Firebase (Authorization: Bearer <idToken>).
//   • Quien llama: dueño (admins), superadmin, visitante de la demo o cajero ACTIVO del local.
//   • Local apagado por no pago → no (espejo de localVivo() en las reglas).
//   • La cuenta tiene que ser de efectivo. Con `id` fijo, un reintento no guarda dos conteos.
import { conAdmin, sesionDe, cuerpo, SUPERADMINS } from './_lib/admin.js'
import { estadoPago, tiene } from '../src/utils/plan.js'
import { jornadaDe } from '../src/utils/jornada.js'
import { limpiarConteo, sumarConteo } from '../src/utils/arqueo.js'
import { cuentasDe } from '../src/utils/cuentasDinero.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })
  const f = await conAdmin(res)
  if (!f) return
  const { getFirestore, FieldValue } = f

  try {
    const quien = await sesionDe(f, req)
    if (!quien) return res.status(401).json({ error: 'Sesión inválida' })
    const email = String(quien.email || '').toLowerCase()

    const { localId, cuenta, conteo, id } = cuerpo(req)
    if (!localId || !cuenta || !id || !/^[\w-]{6,40}$/.test(String(id))) return res.status(400).json({ error: 'Faltan datos' })

    const db = getFirestore()
    const localRef = db.collection('locales').doc(String(localId))
    const [localSnap, cajeroSnap] = await Promise.all([
      localRef.get(),
      email ? localRef.collection('equipo').doc(`cajero:${email}`).get() : null,
    ])
    if (!localSnap.exists) return res.status(404).json({ error: 'No existe' })
    const local = localSnap.data()
    const esSuper = SUPERADMINS.includes(email)
    if (estadoPago(local).estado === 'cortado' && !esSuper) return res.status(403).json({ error: 'Local fuera de servicio' })
    const admins = (local.admins || []).map(e => String(e).toLowerCase())
    const esDueno = esSuper || local.esDemo === true || (email && admins.includes(email))
    const esCajero = !!cajeroSnap?.exists && cajeroSnap.data().activo === true
    if (!esDueno && !esCajero) return res.status(403).json({ error: 'No autorizado' })
    if (!tiene(local, 'arqueo') && !esSuper) return res.status(403).json({ error: 'Contar la caja viene en el plan Empresario' })

    const c = cuentasDe(local).find(x => x.id === cuenta)
    if (!c || c.tipo !== 'efectivo') return res.status(400).json({ error: 'Esa cuenta no es de efectivo' })

    const limpio = limpiarConteo(conteo)
    const contado = sumarConteo(limpio)
    const ref = localRef.collection('arqueos').doc(String(id))
    const guardado = await db.runTransaction(async tx => {
      const ya = await tx.get(ref)
      if (ya.exists) return ya.data()
      const saldos = (await tx.get(localRef.collection('resumen').doc('saldos'))).data() || {}
      const esperado = Number(saldos[cuenta]) || 0
      const a = {
        jornada: jornadaDe(Date.now(), local.horario), en: FieldValue.serverTimestamp(),
        por: { email, nombre: String(quien.name || '').slice(0, 60) }, cuenta, conteo: limpio,
        contado, esperado, diferencia: contado - esperado, revisado: null,
      }
      tx.set(ref, a)
      return a
    })
    return res.status(200).json(esDueno
      ? { contado: guardado.contado, esperado: guardado.esperado, diferencia: guardado.diferencia }
      : { contado: guardado.contado })
  } catch (e) {
    console.error('api/arqueo', e)
    return res.status(500).json({ error: 'No se pudo guardar el conteo' })
  }
}
