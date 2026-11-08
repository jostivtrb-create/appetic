// 🧮 ARQUEO de la caja (guía «Mejoras frente a Loggro» D17, D18 y S7): contar los billetes y las
// monedas cuando quieran, sin abrir ni cerrar caja (sigue D7 de «Cuentas del negocio»). El
// ESPERADO lo pone el servidor (/api/arqueo) en el instante del conteo, porque el cajero no lee
// los saldos: así cuenta a ciegas y nadie maquilla el conteo. Lo usan la app y la función de Vercel.
//
//   locales/{id}/arqueos/{id} → { jornada, en, por {email,nombre}, cuenta, conteo {'50000': 3, …},
//       contado, esperado, diferencia (contado − esperado),
//       revisado {accion 'ajustado'|'aceptado', por, en, movimientoId} | null }

export const DENOMINACIONES = [
  { valor: 100000, tipo: 'billete' },
  { valor: 50000, tipo: 'billete' },
  { valor: 20000, tipo: 'billete' },
  { valor: 10000, tipo: 'billete' },
  { valor: 5000, tipo: 'billete' },
  { valor: 2000, tipo: 'billete' },
  { valor: 1000, tipo: 'moneda' },   // billete o moneda: valen lo mismo, se cuentan juntos
  { valor: 500, tipo: 'moneda' },
  { valor: 200, tipo: 'moneda' },
  { valor: 100, tipo: 'moneda' },
  { valor: 50, tipo: 'moneda' },
]
const VALORES = new Set(DENOMINACIONES.map(d => String(d.valor)))
export const MAX_POR_DENOMINACION = 9999

// Solo denominaciones conocidas y cantidades enteras entre 1 y el tope (lo demás se descarta).
export function limpiarConteo(conteo) {
  const out = {}
  for (const [k, v] of Object.entries(conteo || {})) {
    const n = Math.floor(Number(v))
    if (VALORES.has(String(k)) && Number.isFinite(n) && n > 0) out[String(k)] = Math.min(n, MAX_POR_DENOMINACION)
  }
  return out
}

export const sumarConteo = conteo =>
  Object.entries(limpiarConteo(conteo)).reduce((s, [k, n]) => s + Number(k) * n, 0)

// El movimiento que deja el saldo igual a lo contado: sobra → «Meter», falta → «Sacar».
export function ajusteDe(arqueo) {
  const d = Number(arqueo?.diferencia) || 0
  if (!d) return null
  return { tipo: d > 0 ? 'ingreso' : 'retiro', monto: Math.abs(d), cuenta: arqueo.cuenta, concepto: 'Diferencia del arqueo' }
}
