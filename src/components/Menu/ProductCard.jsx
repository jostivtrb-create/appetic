import { cop } from '../../utils/money'
import { tieneOpciones } from '../../utils/price'
import ImagenApp from '../Imagen/ImagenApp'
import './ProductCard.css'

// Precio "desde" para mostrar en la tarjeta
function precioDesde(p) {
  if (p.variantes?.length) return Math.min(...p.variantes.map(v => Number(v.precio) || 0))
  return Number(p.precio) || 0
}

export default function ProductCard({ producto, onPedir }) {
  const agotado = producto.disponible === false
  const conOpciones = tieneOpciones(producto)

  return (
    <button
      className={`pcard ${agotado ? 'pcard-agotado' : ''} ${producto.destacado ? 'pcard-destacado' : ''}`}
      onClick={() => !agotado && onPedir(producto)}
      disabled={agotado}
    >
      <div className="pcard-info">
        {producto.destacado && <span className="pcard-fuerte">⭐ Nuestro fuerte</span>}
        <h3 className="pcard-nombre">{producto.nombre}</h3>
        {producto.descripcion && <p className="pcard-desc">{producto.descripcion}</p>}
        <div className="pcard-precio-row">
          <span className="pcard-precio">
            {producto.variantes?.length ? <span className="pcard-desde">desde </span> : null}
            {cop(precioDesde(producto))}
          </span>
          {/* Solo "Agregar +" en productos directos; los que tienen opciones
              se abren tocando la tarjeta (no hace falta botón "Personalizar"). */}
          {!agotado && !conOpciones && (
            <span className="pcard-add">Agregar +</span>
          )}
        </div>
      </div>

      <div className="pcard-media">
        <ImagenApp className="pcard-img" src={producto.foto} alt={producto.nombre} />
        {agotado && <span className="pcard-badge-agotado">Agotado</span>}
      </div>
    </button>
  )
}
