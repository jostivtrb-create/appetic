import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { precioItem } from '../utils/price'
import { avisarDemo } from '../components/Demo/eventosDemo'

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
    avisarDemo('carrito')
  }

  function setCantidad(uid, cantidad) {
    if (cantidad <= 0) return removeItem(uid)
    setItems(prev => prev.map(it => it.uid === uid ? { ...it, cantidad } : it))
  }

  function removeItem(uid) {
    setItems(prev => prev.filter(it => it.uid !== uid))
  }

  function clear() { setItems([]) }

  // 🔄 El servidor dijo que algo cambió (guía «Blindaje» D2): el precio nuevo entra al carrito y lo
  // agotado, lo que ya no existe o lo que trae opciones que ya no valen, sale (se elige de nuevo).
  function ponerAlDia(cambios, productos = {}) {
    const porUid = new Map(cambios.map(c => [c.uid, c]))
    setItems(prev => prev.flatMap(it => {
      const c = porUid.get(it.uid)
      if (!c) return [it]
      const fresco = productos[c.productoId]
      if (c.tipo !== 'precio' || !fresco) return []
      return [{ ...it, producto: fresco }]
    }))
  }

  const totalItems = useMemo(() => items.reduce((s, it) => s + it.cantidad, 0), [items])
  const subtotal = useMemo(() => items.reduce((s, it) => s + precioItem(it), 0), [items])

  const value = { items, addItem, setCantidad, removeItem, clear, ponerAlDia, totalItems, subtotal }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
