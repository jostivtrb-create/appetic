import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { precioItem } from '../utils/price'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

// Un carrito por local (D14: el carrito es individual por local).
export function CartProvider({ localId, children }) {
  const storageKey = `appetic_cart_${localId}`
  const [items, setItems] = useState([])

  // Cargar carrito guardado de este local
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setItems(raw ? JSON.parse(raw) : [])
    } catch { setItems([]) }
  }, [storageKey])

  // Guardar al cambiar
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(items)) } catch {}
  }, [items, storageKey])

  function addItem({ producto, seleccion = {}, cantidad = 1, notas = '' }) {
    const uid = `${Date.now()}-${Math.round(performance.now() * 1000) % 100000}`
    setItems(prev => [...prev, { uid, producto, seleccion, cantidad, notas }])
  }

  function setCantidad(uid, cantidad) {
    if (cantidad <= 0) return removeItem(uid)
    setItems(prev => prev.map(it => it.uid === uid ? { ...it, cantidad } : it))
  }

  function removeItem(uid) {
    setItems(prev => prev.filter(it => it.uid !== uid))
  }

  function clear() { setItems([]) }

  const totalItems = useMemo(() => items.reduce((s, it) => s + it.cantidad, 0), [items])
  const subtotal = useMemo(() => items.reduce((s, it) => s + precioItem(it), 0), [items])

  const value = { items, addItem, setCantidad, removeItem, clear, totalItems, subtotal }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
