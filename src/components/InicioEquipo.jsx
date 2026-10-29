import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../contexts/AdminContext'
import { esSuperadmin } from '../config/roles'

// 🧑‍🍳 El INICIO del equipo es su pantalla de trabajo: si un mesero, cocina o domiciliario (que no
// es dueño) abre la app o el link del menú de SU local, cae directo en su panel.
// Solo al ENTRAR (primera página de la visita, o justo después de iniciar sesión ahí): si desde
// adentro toca «Ver menú» o «Buscar locales», se le deja ir.
const ORDEN = ['mesero', 'cocina', 'domiciliario']

export default function InicioEquipo() {
  const { user } = useAuth()
  const { equipo, esDueno, cargando } = useAdmin()
  const location = useLocation()
  const navigate = useNavigate()
  const decidido = useRef(false)

  useEffect(() => {
    if (decidido.current || cargando || !user) return
    if (esDueno || esSuperadmin(user.email)) { decidido.current = true; return }
    if (!equipo.length) return // sus roles aún no cargan (o no es del equipo)
    decidido.current = true
    if (location.key !== 'default') return // ya venía navegando dentro de la app
    const seg = location.pathname.split('/')[1]
    const params = new URLSearchParams(location.search)
    const ordenados = [...equipo].sort((a, b) => ORDEN.indexOf(a.rol) - ORDEN.indexOf(b.rol))
    const destino = location.pathname === '/'
      ? ordenados[0]
      : (location.pathname === `/${seg}` && !params.has('mesa') ? ordenados.find(e => e.local.slug === seg) : null)
    if (destino) navigate(`/${destino.local.slug}/admin`, { replace: true })
  }, [cargando, user, equipo, esDueno, location, navigate])

  return null
}
