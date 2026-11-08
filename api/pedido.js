// 🧾 POST /api/pedido — guía «Blindaje de Appetic» D1–D4 · D7.
//
// Todo lo que el CLIENTE manda a la base pasa por aquí: el pedido de la app (domicilio y recoger,
// el que va al WhatsApp) y la comanda que pide la mesa desde su QR. El precio, el envío, el nombre
// de los platos y las opciones se rehacen con el menú de HOY (api/_lib/precios.js); del navegador
// solo se toma QUÉ eligió. Las reglas de Firestore ya no dejan al cliente escribir eso directo.
//
//   body: { tipo: 'pedido' | 'mesa', localId, id, dispositivo, items: [{ uid, productoId, cantidad, seleccion, notas, precio }],
//           pedido: { codigo, entrega, cliente, pago, notas, domicilio, domicilioAConvenir, linkComanda }   ← tipo 'pedido'
//           mesa, nombre                                                                              ← tipo 'mesa' }
//
//   200 { ok, subtotal, domicilio, total, turno? }
//   409 { cambios: [...], productos: { id: producto | null }, domicilio? }  ← el carrito se actualiza y se avisa (D2)
//   4xx { error, motivo }                                                   ← cerrado, sin plan, límite…
import { conAdmin, cuerpo, ipDe, revisarAppCheck } from './_lib/admin.js'
import { recalcular } from './_lib/precios.js'
import { permitir, LIMITES } from './_lib/limites.js'
import { almuerzoDeHoy, ahoraBogota, fechaBogota, MENU_DEL_DIA_ID } from '../src/utils/menuDelDia.js'
import { calcularDomicilio } from '../src/utils/delivery.js'
import { estadoPago, tiene } from '../src/utils/plan.js'
import { estaAbierto } from '../src/utils/horario.js'
import { categoriasApagadas } from '../src/utils/categorias.js'
import { llevaTurno, siguienteTurno } from '../src/utils/turnos.js'
import { armarPedido, publicoDe } from '../src/utils/pedidoDoc.js'

const DIAS_VIDA = 2 // los pedidos se auto-borran (TTL), igual que services/pedidos.js
const LIMITE = { error: 'Espera un momento antes de volver a pedir', motivo: 'limite' }
const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/
const texto = (v, max) => String(v ?? '').trim().slice(0, max)
const CAMPO_ENTREGA = { domicilio: 'domicilios', recoger: 'recoger', mesa: 'mesaQR' } // espejo de services/stats.js

// Los productos que pidió, como están hoy. El almuerzo del día se arma igual que en el menú
// (con la franja ignorada: quien lo metió al carrito a las 2:59 no se queda sin almuerzo a las 3:01).
async function productosDe(localRef, local, ids, contexto) {
  const unicos = [...new Set(ids.filter(id => id && id !== MENU_DEL_DIA_ID))].slice(0, 60)
  const snaps = unicos.length ? await localRef.firestore.getAll(...unicos.map(id => localRef.collection('productos').doc(id))) : []
  const productos = {}
  for (const s of snaps) if (s.exists) productos[s.id] = { id: s.id, ...s.data() }
  // ⏸️ Categoría pausada o fuera de su horario (guía «Editar el catálogo» S16): se rechaza como agotado.
  const apagadas = categoriasApagadas(local)
  for (const p of Object.values(productos)) if (apagadas.has(p.categoria)) p.disponible = false
  if (ids.includes(MENU_DEL_DIA_ID)) {
    const almuerzo = almuerzoDeHoy(local.menuDelDia, ahoraBogota({ contexto, ignorarFranja: true }))
    if (almuerzo) productos[MENU_DEL_DIA_ID] = almuerzo
  }
  return productos
}

// Lo que el carrito necesita para ponerse al día: el producto nuevo, o null si ya no existe.
const frescos = (cambios, productos) => Object.fromEntries(cambios.map(c => [c.productoId, productos[c.productoId] || null]))

async function sumarStats(db, FieldValue, localId, monto, entrega) {
  const dia = fechaBogota()
  const campo = CAMPO_ENTREGA[entrega]
  const campos = { pedidos: FieldValue.increment(1), monto: FieldValue.increment(monto), ...(campo ? { [campo]: FieldValue.increment(1) } : {}) }
  const stats = db.collection('locales').doc(localId).collection('stats')
  await Promise.all([
    stats.doc('total').set(campos, { merge: true }),
    stats.doc(`d_${dia}`).set({ fecha: dia, ...campos }, { merge: true }),
  ]).catch(e => console.warn('pedido: stats', e?.message || e))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' })
  const f = await conAdmin(res)
  if (!f) return
  const { getFirestore, FieldValue, Timestamp } = f
  try {
    const ac = await revisarAppCheck(f, req)
    if (ac.bloquear) return res.status(401).json({ error: 'App no verificada', motivo: 'appcheck' })

    const b = cuerpo(req)
    const tipo = b.tipo === 'mesa' ? 'mesa' : 'pedido'
    const localId = texto(b.localId, 80)
    const id = texto(b.id, 40)
    if (!localId || !ID_VALIDO.test(id)) return res.status(400).json({ error: 'Faltan datos', motivo: 'datos' })

    const db = getFirestore()
    const localRef = db.collection('locales').doc(localId)
    const localSnap = await localRef.get()
    if (!localSnap.exists) return res.status(404).json({ error: 'No existe el local', motivo: 'datos' })
    const local = { id: localId, ...localSnap.data() }
    if (estadoPago(local).estado === 'cortado') return res.status(403).json({ error: 'Local fuera de servicio', motivo: 'cortado' })
    if (!local.esDemo && !estaAbierto(local.horario)) return res.status(403).json({ error: 'El local está cerrado', motivo: 'cerrado' })

    // 🚦 Límite de envíos (D4 · S8). El id del celular lo pone la app; la conexión respalda. Se
    // cuenta justo antes de guardar: un «el precio cambió» o un reintento del mismo pedido no gastan.
    const ip = ipDe(req)
    const cel = texto(b.dispositivo, 60) || ip
    const limitar = tipo === 'mesa'
      ? async () => (await permitir(db, f, `qr:${localId}:${Math.trunc(Number(b.mesa))}:${cel}`, LIMITES.qrCelular))
          && (await permitir(db, f, `qrip:${localId}:${ip}`, LIMITES.qrConexion))
      : () => permitir(db, f, `p:${localId}:${cel}:${ip}`, LIMITES.pedidoCelular)
    const ctx = { res, db, FieldValue, Timestamp, local, localRef, id, b, limitar }

    if (tipo === 'mesa') return await comandaDeMesa(ctx)
    return await pedidoDeApp(ctx)
  } catch (err) {
    console.error('pedido:', err)
    return res.status(500).json({ error: 'Error interno', motivo: 'error' })
  }
}

// ─────────────────────────── Pedido de la app (WhatsApp) ───────────────────────────
async function pedidoDeApp({ res, db, FieldValue, Timestamp, local, localRef, id, b, limitar }) {
  const p = b.pedido || {}
  const entrega = p.entrega === 'domicilio' ? 'domicilio' : 'recoger'
  if (entrega === 'domicilio' && !(local.domicilio?.activo && tiene(local, 'domicilios'))) {
    return res.status(403).json({ error: 'Este local no tiene domicilios', motivo: 'sin-domicilio' })
  }
  const lineas = Array.isArray(b.items) ? b.items : []

  // Locales con menú externo (La Gran Esquina): su carta no vive aquí y su caja cobra con sus
  // precios (guía S11). Se guarda como llega, marcado sin verificar.
  const externo = !!local.menuExterno
  let r
  if (externo) {
    const items = lineas.slice(0, 60).map((l, i) => ({
      uid: texto(l.uid, 60) || `p${i}`, productoId: texto(l.productoId, 120), nombre: texto(l.nombre, 80) || 'Producto',
      cantidad: Math.max(1, Math.min(99, Math.trunc(Number(l.cantidad)) || 1)), opciones: texto(l.opciones, 300),
      seleccion: {}, notas: texto(l.notas, 200), descripcion: '', precio: Math.max(0, Math.trunc(Number(l.precio)) || 0),
    }))
    r = { items, cambios: [], subtotal: items.reduce((s, it) => s + it.precio, 0) }
  } else {
    const productos = await productosDe(localRef, local, lineas.map(l => String(l?.productoId || '')), 'llevar')
    r = recalcular(lineas, productos)
    if (r.error) return res.status(400).json({ error: 'Pedido vacío o muy grande', motivo: r.error })
    if (r.cambios.length) return res.status(409).json({ cambios: r.cambios, productos: frescos(r.cambios, productos) })
  }

  // 🛵 El envío también lo pone el servidor (D3). Sin ubicación: «a convenir», como hoy.
  let domicilio = 0
  let aConvenir = false
  if (entrega === 'domicilio') {
    const c = p.cliente?.coord
    const coord = c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng)) ? { lat: Number(c.lat), lng: Number(c.lng) } : null
    if (!coord) aConvenir = true
    else {
      const d = calcularDomicilio(local, coord)
      if (!d.ok) return res.status(409).json({ cambios: [], productos: {}, domicilio: { ok: false, motivo: d.motivo } })
      domicilio = d.costo
      const antes = Number(p.domicilio?.costo)
      if (!p.domicilioAConvenir && Number.isFinite(antes) && antes !== domicilio) {
        return res.status(409).json({ cambios: [], productos: {}, domicilio: { ok: true, costo: domicilio, antes } })
      }
    }
  }

  const ref = localRef.collection('pedidos').doc(id)
  const pub = localRef.collection('pedidosPublicos').doc(id)
  const pago = p.pago || {}
  const datos = armarPedido(local, {
    lineas: r.items,
    entrega,
    cliente: {
      nombre: texto(p.cliente?.nombre, 60), telefono: texto(p.cliente?.telefono, 20),
      direccion: texto(p.cliente?.direccion, 200), coord: entrega === 'domicilio' ? (p.cliente?.coord || null) : null,
    },
    notas: texto(p.notas, 300),
    subtotal: r.subtotal,
    domicilio: { costo: domicilio },
    domicilioAConvenir: aConvenir,
    pago: { id: texto(pago.id, 40) || null, nombre: texto(pago.nombre, 40), tipo: texto(pago.tipo, 20), cashAmount: Math.max(0, Math.trunc(Number(pago.cashAmount)) || 0) },
    total: r.subtotal + domicilio,
  }, texto(p.codigo, 20))
  if (externo) datos.precioSinVerificar = true
  if (p.linkComanda) datos.linkComanda = texto(p.linkComanda, 200)

  if (!(await ref.get()).exists && !(await limitar())) return res.status(429).json(LIMITE)
  const ttl = Timestamp.fromMillis(Date.now() + DIAS_VIDA * 86400000)
  // create() falla si ya existe: un reintento del mismo pedido no lo duplica ni lo pisa.
  const nuevo = await db.runTransaction(async tx => {
    if ((await tx.get(ref)).exists) return false
    tx.create(ref, { ...datos, createdAt: FieldValue.serverTimestamp(), ttl })
    tx.create(pub, { ...publicoDe(datos), createdAt: FieldValue.serverTimestamp(), ttl })
    return true
  })
  if (nuevo) await sumarStats(db, FieldValue, local.id, datos.total, entrega)
  return res.status(200).json({ ok: true, subtotal: r.subtotal, domicilio, domicilioAConvenir: aConvenir, total: datos.total })
}

// ─────────────────────────── Comanda desde el QR de la mesa ───────────────────────────
async function comandaDeMesa({ res, db, FieldValue, local, localRef, id, b, limitar }) {
  const mesas = Number(local.mesas) || 0
  const mesa = Math.trunc(Number(b.mesa))
  if (!tiene(local, 'mesas') || !(mesa >= 1 && mesa <= mesas)) return res.status(403).json({ error: 'Esta mesa no pide por QR', motivo: 'sin-mesas' })
  const nombre = texto(b.nombre, 30)
  if (nombre.length < 2) return res.status(400).json({ error: 'Falta tu nombre', motivo: 'datos' })

  const lineas = Array.isArray(b.items) ? b.items : []
  const productos = await productosDe(localRef, local, lineas.map(l => String(l?.productoId || '')), 'mesa')
  const r = recalcular(lineas, productos)
  if (r.error) return res.status(400).json({ error: 'Pedido vacío o muy grande', motivo: r.error })
  if (r.cambios.length) return res.status(409).json({ cambios: r.cambios, productos: frescos(r.cambios, productos) })

  const destino = { tipo: 'mesa', mesa: String(mesa), nombre }
  const items = r.items.map(({ notas, ...it }) => ({ ...it, comentario: notas, hecho: false }))
  const ref = localRef.collection('comandas').doc(id)
  const refTurno = localRef.collection('pantalla').doc('turno')
  // Sin pantalla de cocina nadie la va a entregar: nace entregada, lista para cobrar (como la del
  // mesero, services/comandas.js · usaCocina). Si no, quedaba «en curso» para siempre.
  const conCocina = local.usaCocina !== false && tiene(local, 'cocina')
  const conTurno = conCocina && llevaTurno(local, destino, 'qr')
  if (!(await ref.get()).exists && !(await limitar())) return res.status(429).json(LIMITE)

  // Comanda y turno en la misma transacción: el número no se salta ni se repite, y un reintento
  // devuelve el turno que ya tenía.
  const { turno, nuevo } = await db.runTransaction(async tx => {
    const ya = await tx.get(ref)
    if (ya.exists) return { turno: ya.data().turno || null, nuevo: false }
    let turno = null
    if (conTurno) {
      const fecha = fechaBogota()
      const t = await tx.get(refTurno)
      turno = siguienteTurno(t.exists ? t.data() : null, fecha)
      tx.set(refTurno, { fecha, n: turno })
    }
    tx.create(ref, {
      ...(turno ? { turno } : {}),
      destino, origen: 'qr',
      ...(conCocina
        ? { items, estado: 'activa', cerradaEn: null }
        : { items: items.map(it => ({ ...it, hecho: true })), estado: 'entregada', entregadaEn: FieldValue.serverTimestamp(), cerradaEn: FieldValue.serverTimestamp() }),
      creadaPor: { email: '', nombre: `${nombre} (desde la mesa)` },
      total: r.subtotal,
      cantidadItems: items.reduce((s, it) => s + it.cantidad, 0),
      creadaEn: FieldValue.serverTimestamp(), porCobrar: true,
    })
    return { turno, nuevo: true }
  })
  if (nuevo) await sumarStats(db, FieldValue, local.id, r.subtotal, 'mesa')
  return res.status(200).json({ ok: true, subtotal: r.subtotal, total: r.subtotal, turno })
}
