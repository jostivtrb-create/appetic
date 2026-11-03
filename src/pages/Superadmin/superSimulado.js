// 🧪 Solo DEV (/superadmin?super=1): locales de muestra con planes y pagos variados para revisar la
// pantalla del superadmin sin sesión. Nunca se importa en producción (lo pide Superadmin.jsx con
// devSuper(), que vale false fuera de DEV).
import { getPreviewLocales } from '../../preview'
import { hoyBogota, sumarDias, calcularCorte } from '../../utils/plan'

export async function localesSimulados() {
  const hoy = hoyBogota()
  const ls = await getPreviewLocales()
  const casos = [
    { plan: 'empresario', estado: 'activo', pagadoHasta: sumarDias(hoy, 18) },
    { plan: 'comerciante', estado: 'activo', pagadoHasta: sumarDias(hoy, 3) },
    { plan: 'emprendedor', estado: 'activo', pagadoHasta: sumarDias(hoy, -1) },
    { plan: 'emprendedor', estado: 'montaje', montajeDesde: Date.now() - 5 * 86400000 },
    { plan: 'comerciante', estado: 'activo', pagadoHasta: sumarDias(hoy, -6) },
    { plan: 'empresario', estado: 'activo', pagadoHasta: sumarDias(hoy, 40), bajarA: 'comerciante' },
  ]
  return ls.map((l, i) => {
    const c = casos[i]
    if (!c) return { ...l, suscripcion: { plan: 'empresario', estado: 'cortesia' } }
    return { ...l, enBuscador: i % 2 === 0, suscripcion: { ...c, corteEn: calcularCorte(c) } }
  })
}

export async function pagosSimulados() {
  const ls = await getPreviewLocales()
  const hoy = hoyBogota()
  const p = (i, dias, plan, promo, monto, tipo = 'pago') => ({
    id: `p${i}`, localId: ls[i % ls.length]?.id, nombre: ls[i % ls.length]?.nombre, tipo, plan, promo, meses: 1, monto,
    fecha: sumarDias(hoy, -dias),
  })
  return [
    p(0, 2, 'empresario', 'mes', 99900), p(1, 5, 'comerciante', 'segundo-gratis', 79900),
    p(5, 20, 'empresario', 'seis-x-cinco', 499500), p(0, 33, 'empresario', 'mes', 99900),
    p(2, 40, 'emprendedor', 'mes', 59900), p(0, 12, 'empresario', null, 13300, 'diferencia'),
  ]
}
