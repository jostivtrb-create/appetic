import { useCart } from '../../contexts/CartContext'
import { cop } from '../../utils/money'
import { precioItem } from '../../utils/price'
import { resumenSeleccion } from '../../utils/selectionSummary'
import './CartDrawer.css'

export default function CartDrawer({ abierto, onCerrar, onCheckout }) {
  const { items, setCantidad, removeItem, subtotal, totalItems } = useCart()
  if (!abierto) return null

  return (
    <div className="cd-overlay" onClick={onCerrar}>
      <div className="cd-sheet" onClick={e => e.stopPropagation()}>
        <div className="cd-handle" />
        <div className="cd-head">
          <h2>Tu pedido</h2>
          <button className="cd-close" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="cd-empty">
            <div className="cd-empty-emoji">🛒</div>
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            <div className="cd-items">
              {items.map(it => {
                const resumen = resumenSeleccion(it.producto, it.seleccion)
                return (
                  <div key={it.uid} className="cd-item">
                    <div className="cd-item-info">
                      <h4>{it.producto.nombre}</h4>
                      {resumen && <p className="cd-item-resumen">{resumen}</p>}
                      {it.notas && <p className="cd-item-notas">“{it.notas}”</p>}
                      <span className="cd-item-precio">{cop(precioItem(it))}</span>
                    </div>
                    <div className="cd-item-actions">
                      <div className="cd-qty">
                        <button onClick={() => setCantidad(it.uid, it.cantidad - 1)} aria-label="Menos">−</button>
                        <span>{it.cantidad}</span>
                        <button onClick={() => setCantidad(it.uid, it.cantidad + 1)} aria-label="Más">+</button>
                      </div>
                      <button className="cd-remove" onClick={() => removeItem(it.uid)}>Quitar</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cd-footer">
              <div className="cd-subtotal">
                <span>Subtotal ({totalItems})</span>
                <strong>{cop(subtotal)}</strong>
              </div>
              <p className="cd-nota-envio">El domicilio se calcula en el siguiente paso.</p>
              <button className="btn btn-primary cd-checkout" onClick={onCheckout}>
                Continuar el pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
