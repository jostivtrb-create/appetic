import { useRef, useState } from 'react'

// ✋ ARRASTRAR PARA ORDENAR (guía «Editar el catálogo» D3, D5, S11): categorías y productos.
// Con Pointer Events, así sirve igual con el mouse y con el dedo: se agarra la manija ⠿, se mueve
// sobre los demás elementos (los que tienen `data-arr="<grupo>"` y `data-id`) y al soltar se llama
// `onSoltar(idsEnElNuevoOrden)`. Mientras se arrastra, `ordenar(ids)` devuelve el orden en vivo.
//
//   const arr = useArrastre('cats', ids => guardar(ids))
//   arr.ordenar(ids).map(id => <li data-arr="cats" data-id={id}><button {...arr.manija(id, ids)}>⠿</button></li>)
export function useArrastre(grupo, onSoltar) {
  const [vivo, setVivo] = useState(null)       // ids en el orden de este momento, o null
  const [agarrado, setAgarrado] = useState(null)
  const estado = useRef(null)                   // { id, ids, inicial }

  function mover(e) {
    const st = estado.current
    if (!st) return
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(`[data-arr="${grupo}"]`)
    const sobre = el?.dataset?.id
    if (!sobre || sobre === st.id) return
    const iSobre = st.ids.indexOf(sobre)
    if (iSobre < 0) return
    const n = st.ids.filter(x => x !== st.id)
    n.splice(iSobre, 0, st.id)
    st.ids = n
    setVivo(n)
  }
  function soltar() {
    const st = estado.current
    if (!st) return
    estado.current = null
    setVivo(null)
    setAgarrado(null)
    if (st.ids.join('|') !== st.inicial) onSoltar(st.ids)
  }

  return {
    agarrado,
    ordenar: ids => vivo || ids,
    manija: (id, ids) => ({
      type: 'button',
      'aria-label': 'Arrastrar para ordenar',
      title: 'Arrastra para cambiar el orden',
      onPointerDown: e => {
        if (e.button !== undefined && e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* nada */ }
        estado.current = { id, ids: [...ids], inicial: ids.join('|') }
        setAgarrado(id)
        setVivo([...ids])
      },
      onPointerMove: mover,
      onPointerUp: soltar,
      onPointerCancel: soltar,
      onClick: e => e.stopPropagation(),
    }),
  }
}
