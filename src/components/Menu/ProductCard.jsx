import { cop, rangoPrecio } from '../../utils/money'
import ImagenApp from '../Imagen/ImagenApp'
import './ProductCard.css'

export default function ProductCard({ producto, onPedir }) {
  const agotado = producto.disponible === false
  // Con variantes mostramos el rango COMPLETO ("entre $19.000 - $65.000") en vez del
  // viejo "desde $19.000": el cliente ve de una hasta dónde puede llegar el plato.
  const { min, max, rango } = rangoPrecio(producto)

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
            {rango
              ? <>
                  <span className="pcard-desde">entre </span>
                  {cop(min)} <span className="pcard-guion">-</span> {cop(max)}
                </>
              : cop(min)}
          </span>
          {/* Tocar la tarjeta abre el panel de detalle (ver más grande + Agregar).
              Un chip discreto "Ver" invita a tocar, sin prometer que agrega directo. */}
          {!agotado && <span className="pcard-add">Ver</span>}
        </div>
      </div>

      <div className="pcard-media">
        <ImagenApp className="pcard-img" src={producto.foto} alt={producto.nombre} />
        {agotado && <span className="pcard-badge-agotado">Agotado</span>}
      </div>
    </button>
  )
}
