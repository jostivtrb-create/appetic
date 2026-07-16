// 👀 Vista previa EN VIVO de un local, sin base de datos.
//
// Permite abrir un menú en producción agregando ?preview=1 al link
// (ej. https://tu-dominio/perros-criollos?preview=1). El menú se arma desde el
// código, NO desde Firebase: sirve para revisar el diseño en el celular antes de
// "sembrar" el local de verdad. En modo preview NO se reciben pedidos reales ni
// se registran visitas.
//
// Cuando el local ya está sembrado en Firebase, el link normal (sin ?preview)
// carga los datos reales y este modo deja de hacer falta.
export async function getPreviewLocal(slug) {
  if (slug === 'perros-criollos') {
    const { PERROS_LOCAL, PERROS_PRODUCTOS } = await import('./dev/perrosCriollos')
    return { local: PERROS_LOCAL, productos: PERROS_PRODUCTOS }
  }
  if (slug === 'sabor-del-dia') {
    const { SABOR_LOCAL, SABOR_PRODUCTOS } = await import('./dev/saborDelDia')
    return { local: SABOR_LOCAL, productos: SABOR_PRODUCTOS }
  }
  if (slug === 'pilotos') {
    const { PILOTOS_LOCAL, PILOTOS_PRODUCTOS } = await import('./dev/pilotos')
    return { local: PILOTOS_LOCAL, productos: PILOTOS_PRODUCTOS }
  }
  if (slug === 'juance') {
    const { JUANCE_LOCAL, JUANCE_PRODUCTOS } = await import('./dev/juance')
    return { local: JUANCE_LOCAL, productos: JUANCE_PRODUCTOS }
  }
  return null
}
