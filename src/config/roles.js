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
