// 💵 Formato de pesos colombianos: 12000 -> "$12.000"
export function cop(valor) {
  const n = Math.round(Number(valor) || 0)
  return '$' + n.toLocaleString('es-CO')
}
