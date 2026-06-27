import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="local-msg">
      <div className="local-msg-emoji">🍽️</div>
      <h2>Página no encontrada</h2>
      <p>Esta dirección no existe en Appetic.</p>
      <Link to="/" className="btn btn-primary">Volver al inicio</Link>
    </div>
  )
}
