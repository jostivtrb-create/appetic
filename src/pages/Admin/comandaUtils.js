// 🧾 Utilidades compartidas entre la pantalla del Mesero y la de Comandas (cocina).
import { useEffect, useState } from 'react'

// Minutos por defecto del contador (el admin los cambia en Comandas · D18 de la guía).
export const UMBRALES_DEFECTO = { amarillo: 10, rojo: 20 }

export function umbralesDe(local) {
  const c = local?.comandasConfig || {}
  const amarillo = Number(c.minAmarillo) > 0 ? Number(c.minAmarillo) : UMBRALES_DEFECTO.amarillo
  const rojo = Number(c.minRojo) > amarillo ? Number(c.minRojo) : Math.max(UMBRALES_DEFECTO.rojo, amarillo + 1)
  return { amarillo, rojo }
}

// Verde · amarillo · rojo según cuánto lleva esperando.
export function nivelTiempo(segundos, { amarillo, rojo }) {
  const min = segundos / 60
  return min >= rojo ? 'rojo' : min >= amarillo ? 'amarillo' : 'verde'
}

// 7:05 · 1:02:30
export function minutosSeg(segundos) {
  const s = Math.max(0, Math.floor(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

// Reloj que avanza solo (un solo intervalo por pantalla).
export function useAhora(cadaMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), cadaMs)
    return () => clearInterval(t)
  }, [cadaMs])
  return ahora
}

// 🎨 Colores de MESA, PARA LLEVAR (y RECOGER) y DOMICILIO (D16, D30 + S12 de la guía):
// MESA = color principal, PARA LLEVAR = acento. Si se parecen demasiado (p. ej. naranja y rojo),
// el de llevar cae a un azul fijo para que la cocina no los confunda. Siempre va además la palabra.
export function coloresComanda(local) {
  const t = local?.tema || {}
  const mesa = t.primary || '#ED7D2B'
  let llevar = t.accent && t.accent !== mesa ? t.accent : '#1E6FD9'
  if (distancia(mesa, llevar) < 120) llevar = distancia(mesa, '#1E6FD9') >= 120 ? '#1E6FD9' : '#6A1B9A'
  // DOMICILIO (D30): su propio color, fijo y bien distinto de los otros dos.
  const domicilio = ['#6A35C9', '#0F7C8C', '#C2185B'].find(c => distancia(c, mesa) >= 120 && distancia(c, llevar) >= 120) || '#6A35C9'
  return {
    mesa, llevar, domicilio,
    vars: {
      '--cm-domi': domicilio,
      '--cm-domi-txt': textoSobre(domicilio),
      '--cm-mesa': mesa,
      '--cm-mesa-txt': textoSobre(mesa),
      '--cm-llevar': llevar,
      '--cm-llevar-txt': textoSobre(llevar),
    },
  }
}

function rgb(hex) {
  const m = String(hex || '').replace('#', '')
  if (m.length < 6) return [0, 0, 0]
  return [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16))
}
// Distancia de color "a ojo" (redmean): por debajo de ~120 dos colores se confunden de lejos.
function distancia(a, b) {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b)
  const rm = (r1 + r2) / 2
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2)
}
function textoSobre(hex) {
  const [r, g, b] = rgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#1E1712' : '#FFFFFF'
}

// «1 ítem» · «3 ítems»
export const itemsTxt = n => `${n} ${n === 1 ? 'ítem' : 'ítems'}`

// Tipo visual de una comanda en cocina: mesa · llevar (incluye RECOGER) · domicilio.
export const claseDestino = d => d?.tipo === 'domicilio' ? 'domicilio' : (d?.tipo === 'llevar' || d?.tipo === 'recoger') ? 'llevar' : 'mesa'
export const palabraDestino = d => ({ domicilio: 'DOMICILIO', recoger: 'RECOGER', llevar: 'PARA LLEVAR' }[d?.tipo] || 'MESA')
