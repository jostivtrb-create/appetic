import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getPerfil, guardarPerfil } from '../../services/usuarios'
import './Datos.css'

// 💾 Los mismos datos que usa el checkout: se guardan SIEMPRE en el dispositivo
// (sirve a invitados) y además en el perfil si hay sesión.
const CLIENTE_KEY = 'appetic_cliente'
function leerClienteLocal() {
  try { return JSON.parse(localStorage.getItem(CLIENTE_KEY)) || null } catch { return null }
}
function guardarClienteLocal(datos) {
  try { localStorage.setItem(CLIENTE_KEY, JSON.stringify(datos)) } catch { /* nada */ }
}

// 📇 "Mis datos": nombre, teléfono y dirección para llenar el pedido solos.
export default function Datos() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState({ nombre: '', telefono: '', direccion: '' })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  // Prefill desde el dispositivo (instantáneo, también para invitados).
  useEffect(() => {
    const c = leerClienteLocal()
    if (c) setPerfil(p => ({
      nombre: p.nombre || c.nombre || '',
      telefono: p.telefono || c.telefono || '',
      direccion: p.direccion || c.direccion || '',
    }))
  }, [])

  // Prefill desde el perfil guardado (si inició sesión).
  useEffect(() => {
    if (!user) return
    let activo = true
    getPerfil(user.uid).then(p => {
      if (!activo || !p) return
      setPerfil(prev => ({
        nombre: prev.nombre || p.nombre || user.displayName || '',
        telefono: prev.telefono || p.telefono || '',
        direccion: prev.direccion || p.direccion || '',
      }))
    })
    return () => { activo = false }
  }, [user])

  async function guardar() {
    setGuardando(true)
    const datos = {
      nombre: perfil.nombre.trim(),
      telefono: perfil.telefono.trim(),
      direccion: perfil.direccion.trim(),
    }
    guardarClienteLocal(datos)
    if (user) await guardarPerfil(user.uid, datos)
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1800)
  }

  return (
    <div className="datos">
      <header className="datos-top">
        <Link to="/cuenta" className="datos-volver" aria-label="Volver a mi cuenta">‹</Link>
        <h1>Mis datos</h1>
      </header>

      <p className="datos-hint">Los usamos para llenar tu pedido automáticamente. Solo tú los ves.</p>

      <section className="datos-form">
        <label>Nombre
          <input value={perfil.nombre} onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))} placeholder="Tu nombre" />
        </label>
        <label>WhatsApp / teléfono
          <input value={perfil.telefono} inputMode="tel" onChange={e => setPerfil(p => ({ ...p, telefono: e.target.value }))} placeholder="300 000 0000" />
        </label>
        <label>Dirección habitual
          <input value={perfil.direccion} onChange={e => setPerfil(p => ({ ...p, direccion: e.target.value }))} placeholder="Cra 10 #5-23, casa azul" />
        </label>
        <button className="btn btn-primary datos-guardar" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : guardado ? 'Guardado ✓' : 'Guardar mis datos'}
        </button>
      </section>
    </div>
  )
}
