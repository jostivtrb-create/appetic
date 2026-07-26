// 👑 Roles de Appetic
// - superadmin: nosotros (control de suscripciones). Correo fijo.
// - admin de local: su correo está en local.admins[] (se detecta consultando Firestore).
// - cliente: cualquier otro usuario con sesión.

export const SUPERADMIN_EMAILS = ['jostivtrb@gmail.com']

export function esSuperadmin(email) {
  return !!email && SUPERADMIN_EMAILS.includes(String(email).toLowerCase())
}

// ¿Este correo puede administrar ESTE local (entrar a /<slug>/admin y guardar)?
// El dueño (su correo en local.admins) y también el SUPERADMIN, que entra a cualquier
// local como si fuera el dueño — para dar soporte sin tener que pedirle la cuenta.
// ⚠️ Esto es solo la puerta de la interfaz; quien manda de verdad es firestore.rules,
// que concede los mismos permisos al superadmin (`esSuperadmin()`). Si cambias uno,
// cambia el otro o el panel abrirá pero los guardados fallarán con "permiso denegado".
export function puedeAdministrarLocal(email, local) {
  if (!email) return false
  if (esSuperadmin(email)) return true
  return !!local?.admins?.includes(email)
}

// 🛵 Domiciliarios GLOBALES: el superadmin mantiene UNA lista (config/domiciliarios),
// no una por local. Cualquiera en esa lista entra a /domiciliario y ve TODOS los pedidos
// a domicilio de todos los locales (busca el suyo por código). Así no hay que repetir el
// mismo domiciliario en cada local. Comparación case-insensitive.
export function esDomiciliarioGlobal(email, listaEmails) {
  if (!email) return false
  const yo = String(email).toLowerCase()
  return !!listaEmails?.some(e => String(e).toLowerCase() === yo)
}

// ¿Puede ver el panel de repartos (/domiciliario)? Un domiciliario global o el superadmin.
export function puedeVerRepartos(email, listaEmails) {
  if (!email) return false
  return esSuperadmin(email) || esDomiciliarioGlobal(email, listaEmails)
}
