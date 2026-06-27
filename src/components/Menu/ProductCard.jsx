import { useState } from 'react'
import { cop } from '../../utils/money'
import { tieneOpciones } from '../../utils/price'
import './ProductCard.css'

// Precio "desde" para mostrar en la tarjeta
function precioDesde(p) {
  if (p.variantes?.length) return Math.min(...p.variantes.map(v => Number(v.precio) || 0))
  return Number(p.precio) || 0
}

export default function ProductCard({ producto, onPedir }) {
  const [imgError, setImgError] = useState(false)
  const agotado = producto.disponible === false
  const conOpciones = tieneOpciones(producto)
  const mostrarFoto = producto.foto && !imgError

  return (
    <button
      className={`pcard ${agotado ? 'pcard-agotado' : ''}`}
      onClick={() => !agotado && onPedir(producto)}
      disabled={agotado}
    >
      <div className="pcard-info">
        <h3 className="pcard-nombre">{producto.nombre}</h3>
        {producto.descripcion && <p className="pcard-desc">{producto.descripcion}</p>}
        <div className="pcard-precio-row">
          <span className="pcard-precio">
            {producto.variantes?.length ? <span className="pcard-desde">desde </span> : null}
            {cop(precioDesde(producto))}
          </span>
          {!agotado && (
            <span className="pcard-add">{conOpciones ? 'Personalizar' : 'Agregar'} +</span>
          )}
        </div>
      </div>

      <div className="pcard-media">
        {mostrarFoto ? (
          <img className="pcard-img" src={producto.foto} alt={producto.nombre} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="pcard-img pcard-img-fallback">🍽️</div>
        )}
        {agotado && <span className="pcard-badge-agotado">Agotado</span>}
      </div>
    </button>
  )
}
