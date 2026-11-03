// 🍲 Menú del día (el «corrientazo»), sin React ni Firebase (se prueba con `node prueba-appetic.mjs`).
//
// Guía: .mega-cuestionario/Guía para la Pantalla de TV.md (Etapa B · D21–D27, S18–S22)
//
// Vive en `local.menuDelDia`:
//   { activo, nombre, foto, franja: { desde, hasta }, precioMesa, precioLlevar,
//     partes: [{ id, nombre, emoji, activa, obligatoria, max, sePuedeQuitar, reemplazos: [txt] }],
//     semana: { lun: { [parteId]: [{ id, nombre, recargo? }] }, … },
//     hoy:      { fecha: 'AAAA-MM-DD', opciones: { [parteId]: [...] } } | null   ← cambio del mismo día
//     agotadas: { fecha: 'AAAA-MM-DD', ids: [opcionId] } | null }
//
// Cada día se convierte en un plato «armado» (`almuerzoDeHoy`) con un grupo de opciones por
// parte: así el carrito, el WhatsApp, las comandas, la caja y las cuentas no cambian (S22).

import { aMinutos, diaBogota, minutosAhoraBogota, enBogota } from './horario.js'

export const DIAS_MD = [
  { k: 'lun', c: 'Lun', full: 'Lunes' }, { k: 'mar', c: 'Mar', full: 'Martes' },
  { k: 'mie', c: 'Mié', full: 'Miércoles' }, { k: 'jue', c: 'Jue', full: 'Jueves' },
  { k: 'vie', c: 'Vie', full: 'Viernes' }, { k: 'sab', c: 'Sáb', full: 'Sábado' },
  { k: 'dom', c: 'Dom', full: 'Domingo' },
]

// Las partes del corrientazo (D25), tomadas del de La Gran Esquina. El dueño apaga las que
// no da y puede prender la última («Postre») con el nombre que quiera.
export const PARTES_BASE = [
  { id: 'sopa', nombre: 'Sopa', emoji: '🥣', activa: true, obligatoria: true, max: 1, sePuedeQuitar: true, reemplazos: ['Huevo frito', 'Más principio'] },
  { id: 'principio', nombre: 'Principio', emoji: '🫘', activa: true, obligatoria: false, max: 2, sePuedeQuitar: true, reemplazos: [] },
  { id: 'proteina', nombre: 'Proteína', emoji: '🍗', activa: true, obligatoria: true, max: 1, sePuedeQuitar: false, reemplazos: [] },
  { id: 'acompanante', nombre: 'Acompañante', emoji: '🍚', activa: true, obligatoria: false, max: 1, sePuedeQuitar: true, reemplazos: [] },
  { id: 'ensalada', nombre: 'Ensalada', emoji: '🥗', activa: true, obligatoria: false, max: 1, sePuedeQuitar: true, reemplazos: [] },
  { id: 'jugo', nombre: 'Jugo', emoji: '🥤', activa: true, obligatoria: true, max: 1, sePuedeQuitar: true, reemplazos: [] },
  { id: 'extra', nombre: 'Postre', emoji: '🍮', activa: false, obligatoria: false, max: 1, sePuedeQuitar: true, reemplazos: [] },
]

export const MENU_DEL_DIA_ID = 'menu-del-dia'
export const CATEGORIA_MD = { id: '_menu-del-dia', nombre: 'Menú del día', emoji: '🍲' }

export function menuDelDiaNuevo() {
  return {
    activo: false,
    nombre: 'Almuerzo del día',
    foto: '',
    franja: { desde: '11:30', hasta: '15:00' },
    precioMesa: 0,
    precioLlevar: 0,
    partes: PARTES_BASE.map(p => ({ ...p, reemplazos: [...p.reemplazos] })),
    semana: Object.fromEntries(DIAS_MD.map(d => [d.k, {}])),
    hoy: null,
    agotadas: null,
  }
}

// La fecha de hoy en Bogotá, 'AAAA-MM-DD'.
export function fechaBogota(ahora = new Date()) {
  return enBogota(ahora.getTime()).toISOString().slice(0, 10)   // sin Intl (ver utils/horario.js)
}

// El momento actual en Bogotá, como lo piden `almuerzoDeHoy` y `conMenuDelDia`.
export function ahoraBogota(extra = {}) {
  return { dia: diaBogota(), fecha: fechaBogota(), minutos: minutosAhoraBogota(), ...extra }
}

export const partesActivas = md => (md?.partes || []).filter(p => p.activa)

// Lo que se ofrece hoy: el cambio del día si es de hoy; si no, la semana tipo (D22).
export function opcionesDelDia(md, dia, fecha) {
  if (md?.hoy?.fecha === fecha && md.hoy.opciones) return md.hoy.opciones
  return md?.semana?.[dia] || {}
}

// Lo de hoy sin lo que se agotó hoy (S18). Las agotadas de otro día ya no cuentan.
export function opcionesVigentes(md, dia, fecha) {
  const base = opcionesDelDia(md, dia, fecha)
  const fuera = md?.agotadas?.fecha === fecha ? new Set(md.agotadas.ids || []) : new Set()
  const out = {}
  for (const [parte, ops] of Object.entries(base)) {
    out[parte] = (ops || []).filter(o => o && String(o.nombre || '').trim() && !fuera.has(o.id))
  }
  return out
}

// ¿Estamos dentro de la franja del almuerzo? (D23). Sin franja = todo el horario del local.
export function enFranja(md, minutos) {
  const d = md?.franja?.desde
  const h = md?.franja?.hasta
  if (!d || !h) return true
  const a = aMinutos(d)
  const b = aMinutos(h)
  if (a === b) return true
  return a < b ? (minutos >= a && minutos < b) : (minutos >= a || minutos < b)
}

// Por qué hoy no hay almuerzo, o null si sí lo hay. Lo usa el panel para explicarlo.
export function motivoSinAlmuerzo(md, { dia, fecha, minutos, ignorarFranja = false }) {
  if (!md?.activo) return 'apagado'
  if (!(Number(md.precioMesa) > 0)) return 'sin-precio'
  const ops = opcionesVigentes(md, dia, fecha)
  const falta = partesActivas(md).find(p => p.obligatoria && !(ops[p.id] || []).length)
  if (falta) return `falta:${falta.id}`
  if (!partesActivas(md).some(p => (ops[p.id] || []).length)) return 'vacio'
  if (!ignorarFranja && !enFranja(md, minutos)) return 'fuera-de-franja'
  return null
}

const minus = t => String(t || '').toLowerCase()

// «Con ajiaco, arroz, pollo o res y limonada.» — lo que se lee en la tarjeta antes de abrirla.
function loQueTrae(partes, ops) {
  const trozos = []
  for (const p of partes) {
    const lista = ops[p.id] || []
    if (!lista.length) continue
    trozos.push(lista.length === 1 ? minus(lista[0].nombre) : lista.map(o => minus(o.nombre)).join(' o '))
  }
  if (!trozos.length) return ''
  if (trozos.length === 1) return `Con ${trozos[0]}.`
  return `Con ${trozos.slice(0, -1).join(', ')} y ${trozos[trozos.length - 1]}.`
}

// Un grupo de opciones por parte. Lo que se puede quitar sin cambiar el precio sale con el
// chip «No lleva» (D27); lo que se puede cambiar por otra cosa trae «Sin …» y, solo si lo
// eligió, el paso «En vez de …» (el mismo patrón que La Gran Esquina).
function gruposDeParte(p, lista) {
  const reemplazos = (p.reemplazos || []).map(r => String(r).trim()).filter(Boolean)
  const max = Math.max(1, Math.min(2, Number(p.max) || 1))
  const elegible = Math.min(max, lista.length)
  const grupo = {
    id: `md-${p.id}`,
    nombre: p.nombre,
    emoji: p.emoji || '',
    subtitulo: lista.length === 1 ? 'Va incluido' : elegible > 1 ? `Elige hasta ${elegible}` : 'Elige 1',
    sinFotos: true,
    tipo: elegible > 1 ? 'multiple' : 'unica',
    min: 1,
    max: elegible,
    opciones: lista.map(o => ({
      id: o.id,
      nombre: o.nombre,
      emoji: p.emoji || '',
      precioExtra: Math.max(0, Number(o.recargo) || 0),
      foto: '',
    })),
  }
  // Una sola opción (la sopa de hoy, el arroz): llega ya marcada; el cliente solo sigue, o
  // toca «Sin …» / «No lleva» si no la quiere.
  if (lista.length === 1) grupo.preelegida = [lista[0].id]
  if (reemplazos.length) {
    grupo.opciones.push({ id: `sin-${p.id}`, nombre: `Sin ${minus(p.nombre)}`, emoji: '🚫', precioExtra: 0, foto: '' })
    const cambio = {
      id: `md-${p.id}-cambio`,
      nombre: `En vez de ${minus(p.nombre)}`,
      subtitulo: '¿Qué prefieres?',
      emoji: '🔄',
      tipo: 'unica',
      min: 1,
      max: 1,
      sinFotos: true,
      soloSi: { grupo: grupo.id, opciones: [`sin-${p.id}`] },
      opciones: [
        ...reemplazos.map((r, i) => ({ id: `cambio-${p.id}-${i}`, nombre: r, emoji: '🔁', precioExtra: 0, foto: '' })),
        { id: `cambio-${p.id}-nada`, nombre: 'Nada, así está bien', emoji: '👌', precioExtra: 0, foto: '' },
      ],
    }
    return [grupo, cambio]
  }
  if (p.sePuedeQuitar) grupo.permiteNoLleva = true
  return [grupo]
}

/**
 * El almuerzo de hoy como plato armado, o null si hoy no se puede pedir.
 *
 * `contexto` decide el precio (S21): 'llevar' (pedidos por la app), 'mesa' (QR de la mesa) o
 * 'personal' (mesero y caja: si los precios difieren, el plato trae los dos como tamaños).
 */
export function almuerzoDeHoy(md, { dia, fecha, minutos, contexto = 'llevar', ignorarFranja = false }) {
  if (motivoSinAlmuerzo(md, { dia, fecha, minutos, ignorarFranja })) return null
  const ops = opcionesVigentes(md, dia, fecha)
  const partes = partesActivas(md).filter(p => (ops[p.id] || []).length)

  const mesa = Number(md.precioMesa) || 0
  const llevar = Number(md.precioLlevar) > 0 ? Number(md.precioLlevar) : mesa
  const precios = contexto === 'personal' && llevar !== mesa
    ? { precio: 0, variantes: [{ id: 'mesa', nombre: 'Para comer aquí', precio: mesa }, { id: 'llevar', nombre: 'Para llevar', precio: llevar }] }
    : { precio: contexto === 'mesa' || contexto === 'personal' ? mesa : llevar }

  return {
    id: MENU_DEL_DIA_ID,
    categoria: CATEGORIA_MD.id,
    nombre: String(md.nombre || '').trim() || 'Almuerzo del día',
    descripcion: loQueTrae(partes, ops),
    foto: md.foto || '',
    emoji: '🍲',
    disponible: true,
    destacado: true,
    esMenuDelDia: true,
    modo: 'pasos',
    ...precios,
    gruposOpciones: partes.flatMap(p => gruposDeParte(p, ops[p.id])),
  }
}

// El menú con el almuerzo de hoy puesto de primero, en su propia categoría (S19).
// Sin almuerzo hoy, devuelve lo mismo que recibió.
export function conMenuDelDia(local, productos, opciones) {
  const almuerzo = almuerzoDeHoy(local?.menuDelDia, opciones)
  if (!almuerzo) return { local, productos }
  return {
    local: { ...local, categorias: [CATEGORIA_MD, ...(local.categorias || []).filter(c => c.id !== CATEGORIA_MD.id)] },
    productos: [almuerzo, ...productos.filter(p => p.id !== MENU_DEL_DIA_ID)],
  }
}

// Id corto y estable para una opción nueva.
export const idOpcion = () => `o-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
