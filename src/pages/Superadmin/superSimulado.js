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

// 📋 Dos solicitudes de cotización inventadas (una de vendedor con GPS y fotos, una de dueño sin
// nada), para revisar la sección «Solicitudes de cotización» sin leer Firestore.
export async function solicitudesSimuladas() {
  const hace = horas => new Date(Date.now() - horas * 3600000)
  return [
    {
      id: 'sim-vendedor-1', origen: 'vendedor', vendedor: 'Camilo', local: 'Donde Doña Rosa', dueno: 'Rosa Pérez',
      celular: '300 123 4567', ciudad: 'Bogotá', barrio: 'Kennedy', tipo: 'local', plan: 'comerciante',
      notas: 'Tiene carta en cartulina, vende almuerzos y domicilios por WhatsApp. Le interesa el QR por mesa.',
      ubicacion: { lat: 4.6286, lng: -74.1507, precision: 18 },
      fotos: { lugar: '/locales/demo/banner.webp', logo: '/locales/demo/logo.webp' },
      llenadaEn: hace(3), creadaEn: hace(2.5), estado: 'nueva',
    },
    {
      id: 'sim-dueno-1', origen: 'dueno', local: 'Tráiler El Parcero', dueno: 'Andrés', celular: '3119876543',
      ciudad: 'Soacha', barrio: '', tipo: 'trailer', plan: 'no-sabe', notas: '', ubicacion: null, fotos: {},
      fotosFallidas: ['carta'], llenadaEn: null, creadaEn: hace(30), estado: 'contactada', estadoEn: hace(20),
    },
  ]
}
