// ➕ BIBLIOTECA DE ADICIONALES del local (guía «Editar el catálogo» D11, S13–S15).
// Sin Firebase: lo usan el panel (AdminPage / editor de producto).
//
//   local.adiciones = [{ id, nombre, precio, emoji?, foto? }]      ← Jamón, Queso, Papas, Tocino…
//
// Cada producto SIGUE guardando sus `gruposOpciones` como siempre (el menú, el TV y el servidor no
// cambian); las opciones que salen de la biblioteca llevan además `ref: <id del adicional>` con el
// nombre, el precio y la foto COPIADOS. Al cambiar un adicional en la biblioteca, la app reescribe
// esas copias en todos los productos que lo usan (`productosConCambio`).

const limpio = t => String(t || '').trim()
const clave = t => limpio(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export const adicionesDe = local => (Array.isArray(local?.adiciones) ? local.adiciones : [])

// Id ascii desde el nombre, sin repetir.
export function idAdicionNueva(nombre, existentes) {
  const base = 'a-' + (clave(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'adicional')
  const usados = new Set((existentes || []).map(a => a.id))
  let id = base, n = 2
  while (usados.has(id)) id = `${base}-${n++}`
  return id
}

// La opción de un grupo hecha desde un adicional de la biblioteca.
export function opcionDesde(ad, idOpcion) {
  return {
    id: idOpcion || ad.id, ref: ad.id, nombre: ad.nombre, precioExtra: Number(ad.precio) || 0,
    emoji: ad.emoji || '', foto: ad.foto || '',
  }
}

// ¿La copia que tiene el producto ya está igual al adicional?
const igual = (o, ad) => o.nombre === ad.nombre && (Number(o.precioExtra) || 0) === (Number(ad.precio) || 0)
  && (o.foto || '') === (ad.foto || '') && (o.emoji || '') === (ad.emoji || '')

// Productos que cambian porque cambió (o se borró) un adicional: [{ id, gruposOpciones }].
// `ad` = el adicional nuevo, o null si se borró (entonces sale de los productos).
export function productosConCambio(productos, idAdicional, ad) {
  const out = []
  for (const p of productos || []) {
    if (!Array.isArray(p.gruposOpciones)) continue
    let toca = false
    const grupos = p.gruposOpciones.map(g => {
      const ops = []
      for (const o of g.opciones || []) {
        if (o.ref !== idAdicional) { ops.push(o); continue }
        if (!ad) { toca = true; continue }
        if (igual(o, ad)) { ops.push(o); continue }
        toca = true
        ops.push({ ...o, nombre: ad.nombre, precioExtra: Number(ad.precio) || 0, foto: ad.foto || '', emoji: ad.emoji || '' })
      }
      return { ...g, opciones: ops }
    })
    if (toca) out.push({ id: p.id, gruposOpciones: grupos })
  }
  return out
}

// ¿Cuántos productos usan este adicional?
export const usosDe = (productos, idAdicional) =>
  (productos || []).filter(p => (p.gruposOpciones || []).some(g => (g.opciones || []).some(o => o.ref === idAdicional))).length

// 🔄 La primera vez (S15): arma la biblioteca con las opciones que ya tienen los productos (las que
// montamos nosotros) y las enlaza con `ref`. Mismo nombre + mismo precio = UN adicional; mismo
// nombre con otro precio = otro adicional con el MISMO nombre (en la biblioteca se distinguen por
// el precio), para no cambiarle el precio a nadie ni mostrarle «Queso (2)» al cliente.
// Devuelve null si no hay nada que pasar.
export function migrarBiblioteca(local, productos) {
  const biblioteca = adicionesDe(local).map(a => ({ ...a }))
  const porClave = new Map(biblioteca.map(a => [`${clave(a.nombre)}|${Number(a.precio) || 0}`, a]))
  const cambiados = []
  for (const p of productos || []) {
    if (!Array.isArray(p.gruposOpciones) || !p.gruposOpciones.length) continue
    let toca = false
    const grupos = p.gruposOpciones.map(g => ({
      ...g,
      opciones: (g.opciones || []).map(o => {
        if (o.ref || !limpio(o.nombre)) return o
        const k = `${clave(o.nombre)}|${Number(o.precioExtra) || 0}`
        let ad = porClave.get(k)
        if (!ad) {
          ad = {
            id: idAdicionNueva(o.nombre, biblioteca),
            nombre: limpio(o.nombre),
            precio: Number(o.precioExtra) || 0,
            ...(o.emoji ? { emoji: o.emoji } : {}),
            ...(o.foto ? { foto: o.foto } : {}),
          }
          biblioteca.push(ad)
          porClave.set(k, ad)
        }
        toca = true
        return { ...o, ref: ad.id }
      }),
    }))
    if (toca) cambiados.push({ id: p.id, gruposOpciones: grupos })
  }
  if (!cambiados.length && biblioteca.length === adicionesDe(local).length) return null
  return { adiciones: biblioteca, cambiados }
}

// Un grupo nuevo, listo para llenar (S14).
export function grupoNuevo(existentes, { nombre = 'Adiciones', obligatorio = false, max = 5 } = {}) {
  const usados = new Set((existentes || []).map(g => g.id))
  let n = (existentes?.length || 0) + 1, id = `g-${n}`
  while (usados.has(id)) id = `g-${++n}`
  return {
    id, nombre, emoji: obligatorio ? '👉' : '➕',
    tipo: obligatorio && max === 1 ? 'unica' : 'multiple',
    min: obligatorio ? 1 : 0, max,
    subtitulo: textoReglas({ min: obligatorio ? 1 : 0, max }),
    opciones: [],
  }
}

// «Opcional · hasta 5», «Elige 1», «Elige de 1 a 3».
export function textoReglas({ min = 0, max = 1 }) {
  if (!min) return max > 1 ? `Opcional · hasta ${max}` : 'Opcional'
  if (min === max) return `Elige ${max}`
  return `Elige de ${min} a ${max}`
}
