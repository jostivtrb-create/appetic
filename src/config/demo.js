// 🍔 Demo para clientes (guía «Demo de clientes»): constantes compartidas, sin dependencias.
export const DEMO_SLUG = 'demo'
// 💬 WhatsApp de VENTAS de Swiftfly: ahí llegan los pedidos de prueba y «Quiero esto para mi negocio».
export const WHATSAPP_VENTAS = '573208435143'
// 📈 De dónde llegan a la demo (guía «Demo de clientes» D22): el `?origen=` del link. Solo estos se
// cuentan aparte (el resto suma en «otro»): nadie llena el contador con nombres inventados.
//   prop-p2 / prop-p6 → los QR de la propuesta impresa (arriba y en la página de Cuentas).
export const ORIGENES_DEMO = ['directo', 'prop-p2', 'prop-p6', 'whatsapp', 'instagram', 'otro']
export const origenValido = o => (ORIGENES_DEMO.includes(o) ? o : (o ? 'otro' : 'directo'))
