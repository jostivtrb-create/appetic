// 📦 LOS PAQUETES DE APPETIC (guía «Paquetes de Appetic»). Cada negocio arma su combo: la Base
// siempre, y encima los paquetes que use. Este archivo es la ÚNICA fuente: lo usan la app, la
// función /api/solicitud (que calcula el total) y la propuesta web (scripts/exportar-paquetes.mjs
// copia la parte pública a web/appetic/paquetes.json, SIN precios).
//
// Precios (D24, S7, D39): la Base termina en $900 y el resto son números cerrados, así que TODO
// total termina en 900. Todo junto da exacto $99.900 (el tope queda solo de seguro). El precio de
// cada paquete NUNCA se muestra: solo el total de la cotización (D25).
// `pronto` (hoy ninguno, D35: todo sale incluido): un ítem pronto se mostraría con «Próximamente» y
// un paquete pronto no se podría elegir ni se cobraría.

export const TOPE = 99900
export const DESDE = 29900
export const VALIDEZ_DIAS = 15
export const PROMO = { texto: '2.º mes gratis', hasta: '2026-12-31' }

export const PAQUETES = [
  {
    id: 'base', nombre: 'Paquete Base', icono: '🏠', precio: 29900, obligatorio: true,
    resumen: 'Tu menú digital, tu caja y tu menú en pantalla. Lo lleva todo negocio.',
    incluye: [
      { t: 'Menú digital con fotos', d: 'Nosotros montamos tu carta, tomamos las fotos y diseñamos el menú.' },
      { t: 'Pedidos por WhatsApp para recoger', d: 'El cliente arma su pedido y te llega completo.' },
      { t: 'QR, link, afiche del menú y mensaje de bienvenida', d: 'Listos para imprimir y compartir.' },
      { t: 'Menú en Pantalla', d: 'Tu menú en vivo en el televisor que ya tienes, con tus anuncios.' },
      { t: 'Horario del local y menú del día', d: 'El almuerzo de la semana, si eres restaurante.' },
      { t: 'Caja para vender y cobrar', d: 'Efectivo, Nequi o tarjeta, propinas, descuentos e historial.' },
      { t: 'Ticket en impresora térmica', d: 'Sin instalar nada.' },
      { t: 'Apareces en el buscador de Appetic', d: '' },
      { t: 'Notificaciones a tus clientes', d: 'Hasta 3 por semana, sin saturar.' },
      { t: 'Soporte por WhatsApp', d: '' },
    ],
  },
  {
    id: 'domicilios', nombre: 'Paquete Domicilios', icono: '🛵', precio: 16000,
    resumen: 'Para el negocio que tiene domiciliario.',
    incluye: [
      { t: 'Pedidos a domicilio desde tu menú', d: 'Sin comisión: cada peso es tuyo.' },
      { t: 'Cobro del envío por distancia', d: 'Tú pones la tarifa por tramos.' },
      { t: 'Panel del domiciliario', d: 'Domiciliarios sin límite.' },
      { t: 'Afiche de domicilios y publicidad con IA', d: '' },
      { t: 'Cobro con tu link de pago', d: 'El cliente paga con tu link (Bold, Wompi…) y sube el comprobante; la plata llega directo a ti.' },
    ],
  },
  {
    id: 'contabilidad', nombre: 'Paquete Contabilidad y Registro', icono: '💰', precio: 16000,
    resumen: 'Para saber cuánto ganas, sin cuaderno ni calculadora.',
    incluye: [
      { t: 'Cajeros con su propio acceso', d: '' },
      { t: 'Contar la caja', d: 'Billetes y monedas: la app te dice si sobra o falta.' },
      { t: 'Gastos, compras y saldos', d: 'Efectivo, Nequi y bancos, cada uno con su saldo.' },
      { t: 'Nómina de tu equipo', d: '' },
      { t: 'Horario de la semana del personal', d: '' },
      { t: 'Estadísticas de ventas', d: 'Por hora, por plato y por tipo de pedido.' },
      { t: 'Ganancia del día y del mes', d: '' },
      { t: 'Excel y PDF para tu contador y para facturar', d: 'No es facturación electrónica.' },
      { t: 'Datáfono conectado a la caja', d: '' },
    ],
  },
  {
    id: 'cocina', nombre: 'Paquete Cocina', icono: '👨‍🍳', precio: 13000,
    resumen: 'Las comandas llegan solas a la cocina.',
    incluye: [
      { t: 'Pantalla de cocina', d: 'Comandas en orden, con su reloj; se tacha plato por plato.' },
      { t: 'Aviso de «pedido listo»', d: 'Al mesero o al domiciliario, con sonido.' },
      { t: 'Comandas en impresora térmica', d: 'Salen solas en la cocina.' },
      { t: 'Turnos en el Menú en Pantalla', d: '' },
    ],
  },
  {
    id: 'salon', nombre: 'Paquete Servicio a la Mesa', icono: '🍽️', precio: 12000,
    resumen: 'Para el restaurante con mesas y meseros.',
    incluye: [
      { t: 'Meseros en su celular', d: 'Meseros sin límite.' },
      { t: 'QR en cada mesa', d: 'El cliente pide desde su mesa.' },
      { t: 'Cuenta por mesa', d: '' },
    ],
  },
  {
    id: 'inventario', nombre: 'Paquete Inventario', icono: '📦', precio: 13000, requiere: ['contabilidad'],
    resumen: 'Cada venta descuenta lo que gasta.',
    incluye: [
      { t: 'Inventario con recetas', d: 'Costo y ganancia de cada plato.' },
      { t: 'Descuento automático', d: 'Cada venta descuenta sus ingredientes.' },
      { t: 'Aviso de recarga', d: 'Antes de que se acabe.' },
      { t: 'Proveedores', d: 'La lista y pedirles lo que falta por WhatsApp.' },
    ],
  },
]

const POR_ID = Object.fromEntries(PAQUETES.map(p => [p.id, p]))
export const paquete = id => POR_ID[id] || null

// Los paquetes elegidos, limpios: solo los que existen y se pueden elegir, con la Base siempre y
// las dependencias (Inventario → Contabilidad) puestas. En el orden de PAQUETES.
export function limpiarPaquetes(ids) {
  const s = new Set((Array.isArray(ids) ? ids : []).filter(id => POR_ID[id] && !POR_ID[id].pronto))
  s.add('base')
  for (const id of [...s]) for (const r of POR_ID[id].requiere || []) s.add(r)
  return PAQUETES.filter(p => s.has(p.id)).map(p => p.id)
}

// { paquetes, suma, total, ahorro, promo }: total al mes con el tope (D23/D24).
export function cotizar(ids, hoy = new Date().toISOString().slice(0, 10)) {
  const paquetes = limpiarPaquetes(ids)
  const suma = paquetes.reduce((s, id) => s + POR_ID[id].precio, 0)
  const total = Math.min(suma, TOPE)
  return { paquetes, suma, total, ahorro: suma - total, promo: hoy <= PROMO.hasta ? PROMO.texto : '' }
}

// La parte pública (sin precios) para la propuesta web.
export const paquetesPublicos = () => ({
  desde: DESDE, validezDias: VALIDEZ_DIAS, promo: PROMO,
  paquetes: PAQUETES.map(({ precio, ...p }) => p), // eslint-disable-line no-unused-vars
})
