// 📺 Lógica de la pantalla de TV, sin React ni Firebase (se prueba con `node prueba-appetic.mjs`).
//
// Guía: .mega-cuestionario/Guía para la Pantalla de TV.md
//
// Lo que sale en el TV vive en `local.pantalla`:
//   { transicion, categoriasOcultas: [id], anuncios: [{ id, titulo, texto, imagen, activo,
//     dias: ['lun',…] | [], desde: 'HH:MM', hasta: 'HH:MM' }] }
// y cada plato puede traer `ocultoTV: true`.

import { rangoPrecio } from './money'
import { aMinutos } from './horario'
import { categoriasApagadas } from './categorias'

// Las transiciones del plato grande (D17, S14). Todas con opacidad y desplazamiento,
// que es lo que un Smart TV barato mueve sin trabarse.
export const TRANSICIONES = [
  { id: 'desvanecer', nombre: 'Desvanecer', desc: 'Un plato se funde en el siguiente' },
  { id: 'deslizar', nombre: 'Deslizar', desc: 'El plato nuevo entra desde el lado' },
  { id: 'zoom', nombre: 'Zoom lento', desc: 'La foto se acerca despacio mientras está' },
  { id: 'cortina', nombre: 'Cortina', desc: 'El plato nuevo se descubre de abajo hacia arriba' },
  { id: 'voltear', nombre: 'Voltear', desc: 'La tarjeta gira y muestra el siguiente' },
]
export const TRANSICION_DEFECTO = 'zoom'

export function transicionDe(local) {
  const t = local?.pantalla?.transicion
  return TRANSICIONES.some(x => x.id === t) ? t : TRANSICION_DEFECTO
}

// Tiempos (ms). Una página del tablero dura lo que tarda en pasar ~3 platos grandes.
export const TIEMPOS = { plato: 7000, pagina: 16000, anuncio: 9000, paginasEntreAnuncios: 3 }

const tieneFoto = p => typeof p?.foto === 'string' && p.foto.trim() !== ''

// Los platos que el TV puede mostrar: sin agotados (D9), sin los que el dueño escondió (D4).
// Tampoco los de una categoría pausada o fuera de su horario (guía «Editar el catálogo» D12).
export function platosDelTV(local, productos = []) {
  const ocultas = new Set(local?.pantalla?.categoriasOcultas || [])
  const apagadas = categoriasApagadas(local)
  return productos.filter(p =>
    p && p.disponible !== false && !p.ocultoTV && !ocultas.has(p.categoria) && !apagadas.has(p.categoria))
}

// Las categorías del TV en el orden del menú, solo las que tienen algo. Un plato cuya
// categoría ya no existe va a «Otros» al final, para no perderlo.
export function categoriasDelTV(local, platos) {
  const cats = (local?.categorias || []).map(c => ({ ...c, platos: [] }))
  const porId = new Map(cats.map(c => [c.id, c]))
  const otros = { id: '_otros', nombre: 'Otros', emoji: '🍽️', platos: [] }
  for (const p of platos) (porId.get(p.categoria) || otros).platos.push(p)
  return [...cats, otros].filter(c => c.platos.length > 0)
}

// Parte cada categoría en páginas de `porPagina` platos (S11), repartidas parejo:
// 11 platos en páginas de 9 dan 6 + 5, no 9 + 2.
export function paginarTablero(categorias, porPagina) {
  const n = Math.max(1, porPagina | 0)
  const paginas = []
  for (const cat of categorias) {
    const total = Math.ceil(cat.platos.length / n)
    const tam = Math.ceil(cat.platos.length / total)
    for (let i = 0; i < total; i++) {
      paginas.push({
        cat,
        platos: cat.platos.slice(i * tam, (i + 1) * tam),
        pagina: i + 1,
        de: total,
      })
    }
  }
  return paginas
}

// Los platos que pasan por el lugar grande (D19): los «Nuestro fuerte» con foto. Si hay
// menos de dos, se completa con los platos con foto de la categoría en pantalla (S15),
// para no dejar el lugar vacío ni repetir el mismo plato todo el día.
// `sinFoto` son los ids cuya foto no cargó en este TV: se sacan de la cola.
export function colaGrande(platos, catActual, sinFoto = new Set()) {
  const sirve = p => tieneFoto(p) && !sinFoto.has(p.id)
  const fuertes = platos.filter(p => (p.destacado || p.esMenuDelDia) && sirve(p))
  if (fuertes.length >= 2) return fuertes
  const relleno = (catActual?.platos || []).filter(p => sirve(p) && !p.destacado)
  const cola = [...fuertes, ...relleno]
  if (cola.length > 0) return cola
  // Ni fuertes ni fotos en esta categoría: cualquier plato con foto del menú.
  return platos.filter(sirve)
}

// ¿El anuncio está vigente ahora? `dia` = 'lun'…'dom', `minutos` = minutos desde medianoche
// (los dos en hora de Bogotá). Sin días marcados = todos los días; sin horas = todo el día.
// Una franja que cruza la medianoche (20:00 a 02:00) también vale.
export function anuncioVigente(a, dia, minutos) {
  if (!a || a.activo === false) return false
  if (!String(a.titulo || '').trim() && !a.imagen) return false
  if (Array.isArray(a.dias) && a.dias.length > 0 && !a.dias.includes(dia)) return false
  if (!a.desde || !a.hasta) return true
  const d = aMinutos(a.desde)
  const h = aMinutos(a.hasta)
  if (d === h) return true
  return d < h ? (minutos >= d && minutos < h) : (minutos >= d || minutos < h)
}

export function anunciosVigentes(local, dia, minutos) {
  return (local?.pantalla?.anuncios || []).filter(a => anuncioVigente(a, dia, minutos))
}

// El precio como se lee en el tablero. Con 2 o 3 tamaños se dicen todos
// («Personal $19.000 · Familiar $65.000»); con más, el rango.
export function preciosDelPlato(p) {
  const vars = (p?.variantes || []).filter(v => Number(v.precio) > 0)
  if (vars.length >= 2 && vars.length <= 3) {
    return { tipo: 'tamanos', tamanos: vars.map(v => ({ nombre: v.nombre, precio: Number(v.precio) })) }
  }
  const r = rangoPrecio(p)
  if (r.desde) return { tipo: 'desde', precio: r.min }
  if (r.rango) return { tipo: 'rango', min: r.min, max: r.max }
  return { tipo: 'fijo', precio: r.min }
}

// La etiqueta que va sobre el plato grande.
export function etiquetaGrande(p) {
  if (p?.esMenuDelDia) return 'Almuerzo de hoy'
  if (p?.destacado) return 'Nuestro fuerte'
  return null
}
