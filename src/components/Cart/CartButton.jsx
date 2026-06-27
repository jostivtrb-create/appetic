import { useCart } from '../../contexts/CartContext'
import { cop } from '../../utils/money'
import './CartButton.css'

export default function CartButton({ onAbrir }) {
  const { totalItems, subtotal } = useCart()
  if (totalItems === 0) return null

  return (
    <button className="cartbtn" onClick={onAbrir}>
      <span className="cartbtn-count">{totalItems}</span>
      <span className="cartbtn-label">Ver pedido</span>
      <span className="cartbtn-total">{cop(subtotal)}</span>
    </button>
  )
}
