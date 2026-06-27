// 📍 Distancia en línea recta entre dos coordenadas (fórmula Haversine), en km.
export function distanciaKm(a, b) {
  if (!a || !b) return null
  const R = 6371 // radio de la Tierra en km
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const lat1 = rad(a.lat)
  const lat2 = rad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function rad(deg) { return (deg * Math.PI) / 180 }

// Link de Google Maps para una coordenada (se manda al WhatsApp del local).
export function mapsUrl(coord) {
  if (!coord) return ''
  return `https://www.google.com/maps?q=${coord.lat},${coord.lng}`
}
