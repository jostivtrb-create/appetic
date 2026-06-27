import { distanciaKm } from './geo'

// 🛵 Calcula el costo de domicilio según la distancia y la config del local.
// config = { activo, maxKm, tarifas: { "0.5":2000, "1.0":2000, ... } }
// Redondea hacia arriba al intervalo de 0.5 km (igual que Krusty Burger).
export function costoDomicilio(distancia, config) {
  if (!config?.activo) return { ok: false, motivo: 'sin-domicilio' }
  if (distancia == null) return { ok: false, motivo: 'sin-ubicacion' }
  if (distancia > config.maxKm) return { ok: false, motivo: 'fuera-cobertura', distancia }

  const intervalo = Math.max(0.5, Math.ceil(distancia / 0.5) * 0.5)
  const key = intervalo.toFixed(1) // "0.5", "1.0", "1.5"...
  const tarifa = config.tarifas?.[key]
  if (tarifa == null) return { ok: false, motivo: 'sin-tarifa', distancia }

  return { ok: true, costo: Number(tarifa), distancia, intervalo }
}

// Calcula domicilio a partir de las coordenadas del local y del cliente.
export function calcularDomicilio(local, coordCliente) {
  const config = local?.domicilio
  const dist = distanciaKm(local?.ubicacion, coordCliente)
  return costoDomicilio(dist, config)
}
