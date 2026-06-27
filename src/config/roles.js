// 👑 Roles de Appetic
// - superadmin: nosotros (control de suscripciones). Correo fijo.
// - admin de local: su correo está en local.admins[] (se detecta consultando Firestore).
// - cliente: cualquier otro usuario con sesión.

export const SUPERADMIN_EMAILS = ['jostivtrb@gmail.com']

export function esSuperadmin(email) {
  return !!email && SUPERADMIN_EMAILS.includes(String(email).toLowerCase())
}
