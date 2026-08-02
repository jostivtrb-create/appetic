import { useCart } from '../../contexts/CartContext'
import { cop } from '../../utils/money'
import { precioItem } from '../../utils/price'
import { resumenSeleccion } from '../../utils/selectionSummary'
import './CartDrawer.css'

// 🛒 El pedido, en dos presentaciones que comparten TODO el contenido:
//
//   • modo "hoja"  (celular) — sube desde abajo sobre un fondo oscuro y se
//     cierra. Es lo que siempre ha sido y no cambia.
//   • modo "panel" (PC)      — una columna fija a la derecha, siempre visible
//     mientras se recorre el menú. Es lo que hacen Rappi, UberEats y DiDi en
//     escritorio: ahí sobra ancho y esconder el pedido tras un clic es perder
//     el hilo de lo que llevas.
//
// La lista, las cantidades y el pie son el MISMO componente en los dos casos:
// lo único que cambia es el envoltorio. Así no hay dos carritos que se puedan
// desincronizar cuando se toque la lógica de precios.
export default function CartDrawer({ abierto, onCerrar, onCheckout, modo = 'hoja' }) {
  const carrito = useCart()

  if (modo === 'panel') {
    return (
      <aside className="cd-panel" aria-label="Tu pedido">
        <div className="cd-head">
          <h2>Tu pedido</h2>
          {carrito.totalItems > 0 && (
            <span className="cd-panel-count">{carrito.totalItems}</span>
          )}
        </div>
        {/* El panel de PC está SIEMPRE a la vista, también vacío: sin una línea
            que diga qué hacer se ve como un hueco muerto en la pantalla. La
            hoja del celular solo se abre a propósito y no la necesita. */}
        <ContenidoPedido carrito={carrito} onCheckout={onCheckout} pista="Toca un plato del menú para empezar." />
      </aside>
    )
  }

  if (!abierto) return null

  return (
    <div className="cd-overlay" onClick={onCerrar}>
      <div className="cd-sheet" onClick={e => e.stopPropagation()}>
        <div className="cd-handle" />
        <div className="cd-head">
          <h2>Tu pedido</h2>
          <button className="cd-close" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <ContenidoPedido carrito={carrito} onCheckout={onCheckout} />
      </div>
    </div>
  )
}

// Lista de lo pedido + pie con el subtotal. Idéntico en hoja y en panel.
function ContenidoPedido({ carrito, onCheckout, pista }) {
  const { items, setCantidad, removeItem, subtotal, totalItems } = carrito

  if (items.length === 0) {
    return (
      <div className="cd-empty">
        <div className="cd-empty-emoji">🛒</div>
        <p>Tu carrito está vacío</p>
        {pista && <p className="cd-empty-hint">{pista}</p>}
      </div>
    )
  }

  return (
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
  )
}
