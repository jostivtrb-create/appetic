import { useEffect, useMemo, useState } from 'react'
import { conMenuDelDia, ahoraBogota } from './menuDelDia'

// ⏱️ Cambia cada minuto: para lo que depende de la hora (franja del menú del día, anuncios del TV).
export function useMinuto() {
  const [m, setM] = useState(() => Math.floor(Date.now() / 60000))
  useEffect(() => {
    const t = setInterval(() => setM(Math.floor(Date.now() / 60000)), 20000)
    return () => clearInterval(t)
  }, [])
  return m
}

// 🍲 El menú con el almuerzo de hoy (utils/menuDelDia.js), recalculado cada minuto para que
// aparezca y desaparezca solo con su franja. `contexto`: 'llevar' | 'mesa' | 'personal'.
export function useConMenuDelDia(local, productos, contexto) {
  const minuto = useMinuto()
  return useMemo(
    () => conMenuDelDia(local, productos, ahoraBogota({ contexto })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [local, productos, contexto, minuto],
  )
}
