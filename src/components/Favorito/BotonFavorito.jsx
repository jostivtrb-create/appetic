import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import './BotonFavorito.css'

// ❤️ Corazón reutilizable para guardar/quitar un local de favoritos.
// Si no hay sesión, lleva a iniciar sesión (los favoritos viven en el perfil).
export default function BotonFavorito({ local, variante = '' }) {
  const { user } = useAuth()
  const { esFavorito, toggleFavorito } = useFavoritos()
  const navigate = useNavigate()
  const activo = esFavorito(local.id)

  function click(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/cuenta'); return }
    toggleFavorito(local)
  }

  return (
    <button
      className={`fav-btn ${variante} ${activo ? 'on' : ''}`}
      onClick={click}
      aria-pressed={activo}
      aria-label={activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21.3l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.3z"
        />
      </svg>
    </button>
  )
}
