import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { useNavUI } from '../../contexts/NavUIContext'
import { soloLocal } from '../../utils/soloLocal'
import './Favoritos.css'

// ❤️ Mis favoritos: los locales que el cliente marcó o donde pidió (D14). Con sesión van en su
// cuenta; sin sesión, en este aparato. Tocar uno entra a su menú — con el aviso de
// "perderás el carrito" si venías con un pedido de otro local.
// 🔒 Cliente de un local que no sale en el buscador: solo ve ese local (guía «Planes en la app» D13).
export default function Favoritos() {
  const navigate = useNavigate()
  const { user, cargando, entrar, errorLogin } = useAuth()
  const { favoritos: todos, toggleFavorito } = useFavoritos()
  const encerrado = soloLocal()
  const favoritos = encerrado ? todos.filter(f => f.id === encerrado.id) : todos
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
        <Link to={encerrado ? `/${encerrado.slug}` : '/'} className="favs-volver" aria-label="Volver">‹</Link>
        <h1>Mis favoritos</h1>
      </header>

      {!user && favoritos.length === 0 ? (
        <div className="favs-vacio">
          <div className="favs-vacio-emoji">❤️</div>
          <h2>Guarda tus locales favoritos</h2>
          <p>Los locales donde pidas quedan aquí solos. Inicia sesión para tenerlos también en tus otros aparatos.</p>
          <button className="btn btn-primary" onClick={entrar}>Iniciar sesión</button>
          {errorLogin && (
            <p role="alert" style={{
              marginTop: 14, padding: '10px 12px', borderRadius: 12,
              background: 'rgba(220, 38, 38, 0.10)', border: '1px solid rgba(220, 38, 38, 0.28)',
              color: '#b91c1c', fontSize: 13.5, lineHeight: 1.45, textAlign: 'left',
            }}>⚠️ {errorLogin}</p>
          )}
        </div>
      ) : favoritos.length === 0 ? (
        <div className="favs-vacio">
          <div className="favs-vacio-emoji">🤍</div>
          <h2>Aún no tienes favoritos</h2>
          <p>Toca el corazón ❤️ en la portada de un local para guardarlo aquí.</p>
          <Link to={encerrado ? `/${encerrado.slug}` : '/'} className="btn btn-primary">{encerrado ? 'Ver el menú' : 'Explorar locales'}</Link>
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
