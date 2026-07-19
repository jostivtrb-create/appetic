import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { useNavUI } from '../../contexts/NavUIContext'
import './Favoritos.css'

// ❤️ Mis favoritos: todos los locales que el cliente marcó. Requiere sesión
// (se guardan en su cuenta). Tocar uno entra a su menú — con el aviso de
// "perderás el carrito" si venías con un pedido de otro local.
export default function Favoritos() {
  const navigate = useNavigate()
  const { user, cargando, entrar } = useAuth()
  const { favoritos, toggleFavorito } = useFavoritos()
  const { irAOtroLocal } = useNavUI()

  function irALocal(fav) {
    irAOtroLocal(fav.slug, () => navigate(`/${fav.slug}`))
  }

  if (cargando) {
    return <div className="local-loading"><div className="local-spinner" /><p>Cargando…</p></div>
  }

  return (
    <div className="favs">
      <header className="favs-top">
        <Link to="/" className="favs-volver" aria-label="Volver al inicio">‹</Link>
        <h1>Mis favoritos</h1>
      </header>

      {!user ? (
        <div className="favs-vacio">
          <div className="favs-vacio-emoji">❤️</div>
          <h2>Guarda tus locales favoritos</h2>
          <p>Inicia sesión para marcar tus locales de siempre y tenerlos aquí a la mano.</p>
          <button className="btn btn-primary" onClick={entrar}>Iniciar sesión</button>
        </div>
      ) : favoritos.length === 0 ? (
        <div className="favs-vacio">
          <div className="favs-vacio-emoji">🤍</div>
          <h2>Aún no tienes favoritos</h2>
          <p>Toca el corazón ❤️ en la portada de un local para guardarlo aquí.</p>
          <Link to="/" className="btn btn-primary">Explorar locales</Link>
        </div>
      ) : (
        <ul className="favs-lista">
          {favoritos.map(f => (
            <li key={f.id} className="fav-card">
              <button className="fav-card-main" onClick={() => irALocal(f)}>
                <span className="fav-logo">
                  {f.logo ? <img src={f.logo} alt="" loading="lazy" /> : <span>🍽️</span>}
                </span>
                <strong>{f.nombre}</strong>
                <span className="fav-go">›</span>
              </button>
              <button
                className="fav-quitar"
                onClick={() => toggleFavorito(f)}
                aria-label={`Quitar ${f.nombre} de favoritos`}
                title="Quitar de favoritos"
              >❤️</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
