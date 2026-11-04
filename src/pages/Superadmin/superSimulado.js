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

// 📋 Solicitudes inventadas para revisar la sección «Solicitudes de cotización» sin leer Firestore:
// una cotización de vendedor con GPS y fotos, una de dueño sin nada, y dos VISITAS de hoy del mismo
// vendedor (con ubicación y motivos distintos) para que el bloque «Recorridos» pinte 3 puntos.
export async function solicitudesSimuladas() {
  const hace = horas => new Date(Date.now() - horas * 3600000)
  // Las de hoy se pegan a la hora actual (si ya es tarde se corren hacia atrás) para que caigan en
  // el día de hoy de Bogotá; la cotización va en medio de las dos visitas.
  const hoyA = horas => {
    const hBogota = Number(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'America/Bogota' }))
    return hace(Math.min(horas, Math.max(hBogota - 0.2, 0.3)))
  }
  return [
    {
      id: 'sim-visita-1', registro: 'visita', origen: 'vendedor', vendedor: 'Camilo', local: 'Panadería La Espiga',
      dueno: '', celular: '', ciudad: 'Bogotá', barrio: 'Kennedy', tipo: '', plan: '', notas: '',
      motivo: 'no-estaba', motivoTexto: '',
      ubicacion: { lat: 4.6312, lng: -74.1489, precision: 12 },
      fotos: { lugar: '/locales/demo/banner.webp' },
      llenadaEn: hoyA(1), creadaEn: hoyA(1), estado: 'visita',
    },
    {
      id: 'sim-vendedor-1', registro: 'cotizacion', origen: 'vendedor', vendedor: 'Camilo', local: 'Donde Doña Rosa', dueno: 'Rosa Pérez',
      celular: '300 123 4567', ciudad: 'Bogotá', barrio: 'Kennedy', tipo: 'local', plan: 'comerciante',
      notas: 'Tiene carta en cartulina, vende almuerzos y domicilios por WhatsApp. Le interesa el QR por mesa.',
      ubicacion: { lat: 4.6286, lng: -74.1507, precision: 18 },
      fotos: { lugar: '/locales/demo/banner.webp', logo: '/locales/demo/logo.webp' },
      llenadaEn: hoyA(2), creadaEn: hoyA(1.9), estado: 'nueva',
    },
    {
      id: 'sim-visita-2', registro: 'visita', origen: 'vendedor', vendedor: 'Camilo', local: 'Asadero El Buen Pollo',
      dueno: 'Don Jairo', celular: '', ciudad: 'Bogotá', barrio: 'Kennedy', tipo: 'restaurante', plan: '',
      notas: 'Volver el sábado por la mañana, que es cuando está el dueño.',
      motivo: 'otro', motivoTexto: 'El administrador dijo que el dueño solo viene los sábados.',
      ubicacion: { lat: 4.6259, lng: -74.1531, precision: 25 },
      fotos: {},
      llenadaEn: hoyA(3), creadaEn: hoyA(3), estado: 'visita',
    },
    {
      id: 'sim-dueno-1', registro: 'cotizacion', origen: 'dueno', local: 'Tráiler El Parcero', dueno: 'Andrés', celular: '3119876543',
      ciudad: 'Soacha', barrio: '', tipo: 'trailer', plan: 'no-sabe', notas: '', ubicacion: null, fotos: {},
      fotosFallidas: ['carta'], llenadaEn: null, creadaEn: hace(30), estado: 'contactada', estadoEn: hace(20),
    },
  ]
}
