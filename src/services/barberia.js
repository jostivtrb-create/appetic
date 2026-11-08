// 💈 Puente con BarberIA (guía de la Plataforma BarberIA, D3 y S7).
// BarberIA vive en otro proyecto de Firebase: el superadmin de Appetic no lee su base, le pide a su
// API (/api/superadmin) con el token de sesión de Appetic, que BarberIA verifica con las llaves
// públicas de Google. Así no hay que iniciar sesión dos veces ni abrir las reglas de BarberIA.
import { auth } from '../config/firebase'

export const BARBERIA_URL = import.meta.env.VITE_BARBERIA_URL || 'https://barberia-swiftfly.vercel.app'

async function llamar(cuerpo) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Sin sesión')
  const r = await fetch(`${BARBERIA_URL}/api/superadmin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(cuerpo),
  })
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`)
  return datos
}

export const listarBarberias = () => llamar({ accion: 'listar' }).then((d) => d.barberias)
export const crearBarberia = (b) => llamar({ accion: 'crear', ...b })
export const cambiarAdminsBarberia = (slug, admins) => llamar({ accion: 'admins', slug, admins })
export const cambiarSuscripcionBarberia = (slug, activa, vence, barberos) => llamar({ accion: 'suscripcion', slug, activa, vence, barberos })

/** «Barbería El Patrón #1» → «barberia-el-patron-1» (mismo criterio que BarberIA). */
export function aSlug(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}
