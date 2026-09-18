import { useMemo, useState } from 'react'
import { cop } from '../../utils/money'
import { grupoAplica, maxDelGrupo, estaCompleto, precioUnitario, recortarPorVariante, validarSeleccion } from '../../utils/price'
import ImagenApp from '../Imagen/ImagenApp'
import './ProductWizard.css'

// 🪄 Armador por PASOS para productos con `modo: 'pasos'` (ej. "arma tu perro").
// Cada grupo de opciones es un paso a pantalla completa con tarjetas de foto;
// el último paso es el resumen. Devuelve la misma forma `seleccion` que el modal
// normal, así que el carrito y el checkout no cambian.
export default function ProductWizard({ producto, onCerrar, onAgregar }) {
  const [varianteId, setVarianteId] = useState(producto.variantes?.length ? producto.variantes[0].id : null)
  const [grupos, setGrupos] = useState({}) // { grupoId: [opcionId, ...] }
  // ⊘ Los pasos que el cliente dijo que NO le pongan: { grupoId: true }.
  //
  // Esto pedía dos toques: marcar "no lo lleva" y después decir cuál era. La
  // razón era el precio —la bebida puede ser un chocolate de $3.000 o un jugo
  // de $5.000, y sin saber cuál no hay qué cobrar—, pero le cargaba al cliente
  // una pregunta que él no puede contestar: no quiere bebida, no "no quiere el
  // chocolate". Preguntarle cuál no quiere es pedirle que se invente un dato.
  //
  // Ahora el chip resuelve el paso solo: cobra la opción más barata de la
  // sección —para que la cuenta cuadre, y es la que le conviene— y la marca.
  // Un toque.
  //
  // Se marca y no se calla porque del otro lado la cocinera lee "no lleva" en
  // vez de adivinar: si el renglón simplemente faltara, en la duda lo prepara.
  // Y el inventario no le baja el stock a algo que sigue en la olla.
  const [noLleva, setNoLleva] = useState({})
  const [paso, setPaso] = useState(0)
  // Indicaciones sí; cantidad NO.
  //
  // El armador mandaba `notas: ''` fijo y eso sí faltaba: un almuerzo sin poder
  // decir "sin cebolla" queda a medias.
  //
  // La cantidad se llegó a poner y hubo que quitarla. **Cada plato que se arma
  // es único**: nadie pide tres almuerzos con la misma sopa, la misma proteína
  // y el mismo jugo — los pide para tres personas, y cada una quiere lo suyo.
  // Un selector de "¿cuántos?" invita justo a lo que nadie hace, y de paso se
  // saltaría el control de porciones ("quedan 2 pechugas") de un tirón.
  //
  // Quien quiera otro lo arma otra vez. Son treinta segundos y sale como él lo
  // quiere, que es de lo que se trata.
  const [notas, setNotas] = useState('')

  const seleccion = useMemo(() => ({ varianteId, grupos, noLleva }), [varianteId, grupos, noLleva])

  // Pasos: (variante si existe) → cada grupo que APLIQUE → resumen
  //
  // Los grupos con `soloSi` aparecen y desaparecen según lo que se va
  // eligiendo: el de "¿qué quieres en vez de la sopa?" solo sale si dijo que
  // no la quiere. Por eso la lista se recalcula con cada cambio y no una vez.
  const pasos = useMemo(() => {
    const arr = []
    if (producto.variantes?.length) arr.push({ tipo: 'variante' })
    for (const g of producto.gruposOpciones || []) {
      if (grupoAplica(g, seleccion)) arr.push({ tipo: 'grupo', grupo: g })
    }
    arr.push({ tipo: 'resumen' })
    return arr
  }, [producto, seleccion])
  const unitario = precioUnitario(producto, seleccion)
  const total = pasos.length
  const actual = pasos[paso]
  const esUltimo = actual?.tipo === 'resumen'
  // Lo que falta para poder agregar (ej. "elige al menos una cosa"). Antes el
  // botón se quedaba mudo si algo no cuadraba; ahora lo dice.
  const errorFinal = esUltimo ? validarSeleccion(producto, seleccion) : null
  // ¿Ya lo armó completo? Si sí, se le rebaja — y hay que decírselo, porque un
  // precio que baja solo sin explicación se lee como un error de la app.
  const completo = estaCompleto(producto, seleccion)
  const rebaja = Number(producto?.descuentoCompleto) || 0

  function toggleOpcion(grupo, opcId) {
    // El tope manda sobre grupo.tipo: el mismo grupo es "elige 1" en un tamaño y
    // "elige hasta 3" en otro, según lo que el dueño configuró.
    const max = maxDelGrupo(grupo, varianteId)
    setGrupos(prev => {
      const actuales = prev[grupo.id] || []
      const yaEsta = actuales.includes(opcId)
      let nuevas
      if (max <= 1) {
        // Tope 1: radio. Pero si el grupo no exige nada (min 0, "elige 1 o
        // ninguno"), tocar de nuevo lo elegido lo QUITA: quien marcó huevos y
        // se arrepintió tiene que poder quedarse sin huevos, no solo cambiarlos.
        nuevas = yaEsta && (grupo.min ?? 0) < 1 ? [] : [opcId]
      } else {
        if (yaEsta) nuevas = actuales.filter(id => id !== opcId)
        else {
          if (actuales.length >= max) return prev
          nuevas = [...actuales, opcId]
        }
      }
      return { ...prev, [grupo.id]: nuevas }
    })
    // Si venía marcado "no lo lleva" y ahora escoge de verdad, la marca sobra.
    setNoLleva(prev => {
      if (!prev[grupo.id]) return prev
      const next = { ...prev }
      delete next[grupo.id]
      return next
    })
  }

  // El chip de "no lo lleva" resuelve el paso de un toque: escoge la opción más
  // barata —para que haya qué cobrar— y la marca. Volverlo a tocar deshace las
  // dos cosas y el paso queda como estaba, sin nada escogido.
  //
  // El que sí se lo lleva —el 95%— no lo toca nunca: su camino es el de
  // siempre, tocar su opción y seguir.
  function toggleNoLleva(grupo) {
    const yaEsta = !!noLleva[grupo.id]
    if (yaEsta) {
      setNoLleva(prev => { const n = { ...prev }; delete n[grupo.id]; return n })
      setGrupos(prev => ({ ...prev, [grupo.id]: [] }))
      return
    }
    const opciones = grupo.opciones || []
    if (opciones.length === 0) return
    const barata = opciones.reduce((min, o) => (
      (Number(o.precioExtra) || 0) < (Number(min.precioExtra) || 0) ? o : min
    ), opciones[0])
    setGrupos(prev => ({ ...prev, [grupo.id]: [barata.id] }))
    setNoLleva(prev => ({ ...prev, [grupo.id]: true }))
  }

  // Volver atrás y cambiar de tamaño puede encoger el tope: recortamos lo que ya no cabe.
  function elegirVariante(id) {
    setVarianteId(id)
    const { grupos: recortados, cambio } = recortarPorVariante(producto, grupos, id)
    if (cambio) setGrupos(recortados)
  }

  // ¿Puede avanzar del paso actual? (respeta el mínimo del grupo)
  const errorPaso = (() => {
    if (actual?.tipo === 'grupo') {
      const g = actual.grupo
      const n = (grupos[g.id] || []).length
      // El mínimo no puede exigir más de lo que el tamaño elegido permite.
      const min = Math.min(g.min ?? 0, maxDelGrupo(g, varianteId))
      if (n < min) return `Elige al menos ${min}`
    }
    return null
  })()

  function siguiente() {
    if (errorPaso) return
    setPaso(p => Math.min(total - 1, p + 1))
  }
  function atras() {
    setPaso(p => Math.max(0, p - 1))
  }

  function agregar() {
    if (errorFinal) return
    onAgregar({ producto, seleccion, cantidad: 1, notas: notas.trim() })
  }

  // Detalle del resumen: variante elegida + grupos con sus opciones elegidas.
  const varianteElegida = producto.variantes?.find(v => v.id === varianteId)
  const gruposConSeleccion = useMemo(() => (
    (producto.gruposOpciones || []).map(g => ({
      id: g.id, nombre: g.nombre, emoji: g.emoji,
      noLleva: !!noLleva[g.id],
      elegidas: (grupos[g.id] || []).map(id => g.opciones.find(o => o.id === id)).filter(Boolean),
    })).filter(g => g.elegidas.length > 0)
  ), [producto, grupos, noLleva])
  const hayDetalle = Boolean(varianteElegida) || gruposConSeleccion.length > 0

  return (
    <div className="pw-overlay" onClick={onCerrar}>
      <div className="pw-sheet" onClick={e => e.stopPropagation()}>
        {/* Encabezado fijo: progreso + cerrar */}
        <div className="pw-top">
          <button className="pw-close" onClick={onCerrar} aria-label="Cerrar">✕</button>
          <div className="pw-progreso">
            {pasos.map((_, i) => (
              <span key={i} className={`pw-dot ${i === paso ? 'on' : ''} ${i < paso ? 'done' : ''}`} />
            ))}
          </div>
          <span className="pw-paso-num">Paso {paso + 1} de {total}</span>
        </div>

        <div className="pw-body">
          {/* Paso variante */}
          {actual?.tipo === 'variante' && (
            <>
              <h2 className="pw-titulo">Elige una opción</h2>
              <div className="pw-grid">
                {producto.variantes.map(v => (
                  <button
                    key={v.id}
                    className={`pw-card ${varianteId === v.id ? 'sel' : ''}`}
                    onClick={() => elegirVariante(v.id)}
                  >
                    <span className="pw-card-emoji">{producto.emoji || '🍽️'}</span>
                    <span className="pw-card-nombre">{v.nombre}</span>
                    <span className="pw-card-precio">{cop(v.precio)}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Paso de grupo (toppings / salsas) */}
          {actual?.tipo === 'grupo' && (
            <PasoGrupo
              grupo={actual.grupo}
              elegidas={grupos[actual.grupo.id] || []}
              max={maxDelGrupo(actual.grupo, varianteId)}
              noLleva={!!noLleva[actual.grupo.id]}
              onToggle={toggleOpcion}
              onToggleNoLleva={() => toggleNoLleva(actual.grupo)}
            />
          )}

          {/* Paso resumen — detalle vertical de lo que armó */}
          {esUltimo && (
            <>
              <h2 className="pw-titulo">{producto.emoji || '✅'} Tu {producto.nombre?.toLowerCase() || "pedido"} está listo</h2>
              <p className="pw-sub">Revisa y agrégalo a tu orden.</p>
              <div className="pw-resumen">
                <div className="pw-resumen-top">
                  <strong className="pw-resumen-nombre">{producto.nombre}</strong>
                  <span className="pw-resumen-precio">{cop(unitario)}</span>
                </div>
                {rebaja > 0 && (
                  completo
                    ? <p className="pw-resumen-rebaja">🏷️ Completo: te rebajamos <strong>{cop(rebaja)}</strong></p>
                    : <p className="pw-resumen-rebaja">🏷️ Escógelo todo y te rebajamos {cop(rebaja)}</p>
                )}

                {varianteElegida && (
                  <div className="pw-resumen-grupo">
                    <span className="pw-resumen-grupo-titulo">Opción</span>
                    <ul className="pw-resumen-lista">
                      <li>{varianteElegida.nombre}</li>
                    </ul>
                  </div>
                )}

                {gruposConSeleccion.map(g => (
                  <div key={g.id} className="pw-resumen-grupo">
                    <span className="pw-resumen-grupo-titulo">
                      {g.emoji} {g.nombre}{g.noLleva ? '' : ` · ${g.elegidas.length}`}
                    </span>
                    <ul className="pw-resumen-lista">
                      {/* Si no lo lleva se dice ESO, no el nombre de la opción:
                          no escogió el chocolate, dijo que no quiere bebida.
                          Enseñárselo tachado es contarle una decisión que no
                          tomó. El nombre va chiquito, porque es lo que se le
                          cobra y tiene derecho a verlo. */}
                      {g.noLleva ? (
                        <li className="pw-resumen-nolleva">
                          <span className="pw-resumen-nombre-opc">No lo lleva</span>
                          {g.elegidas[0] && (
                            <span className="pw-nolleva-cobro">se cobra {g.elegidas[0].nombre.toLowerCase()}</span>
                          )}
                        </li>
                      ) : g.elegidas.map(o => (
                        <li key={o.id}>
                          <span className="pw-resumen-nombre-opc">{o.emoji ? `${o.emoji} ` : ''}{o.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {!hayDetalle && (
                  <p className="pw-resumen-vacio">Sencillo, sin toppings ni salsas.</p>
                )}
              </div>

              {/* Indicaciones para la cocina. Los atajos son los que la gente
                  pide de verdad; el que quiera otra cosa la escribe. */}
              <div className="pw-notas-bloque">
                <div className="pw-notas-head">
                  <h3>¿Algo más?</h3><span>Opcional</span>
                </div>
                <div className="pw-chips">
                  {['Sin sal', 'Sin cebolla', 'Sin tomate', 'Bien caliente', 'Aparte'].map(c => (
                    <button
                      key={c}
                      type="button"
                      className="pw-chip"
                      onClick={() => setNotas(n => n.includes(c) ? n : (n ? `${n} · ${c}` : c))}
                    >{c}</button>
                  ))}
                </div>
                <textarea
                  className="pw-notas"
                  rows={2}
                  maxLength={200}
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: sin cebolla, salsa aparte…"
                />
              </div>

            </>
          )}
        </div>

        {/* Pie: atrás / siguiente / agregar */}
        <div className="pw-footer">
          {paso > 0 && (
            <button className="pw-atras" onClick={atras}>‹ Atrás</button>
          )}
          {!esUltimo ? (
            <button className="btn btn-primary pw-next" onClick={siguiente} disabled={!!errorPaso}>
              {errorPaso || `Siguiente${pasos[paso + 1]?.grupo ? `: ${pasos[paso + 1].grupo.nombre.toLowerCase()}` : ''} ›`}
            </button>
          ) : (
            <button className="btn btn-primary pw-next" onClick={agregar} disabled={!!errorFinal}>
              {errorFinal || <>Agregar a mi orden · {cop(unitario)}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Un paso de grupo: cuadrícula de tarjetas con foto + contador vivo ---
function PasoGrupo({ grupo, elegidas, max, noLleva = false, onToggle, onToggleNoLleva }) {
  const conTope = max > 1 && max < 99
  const lleno = elegidas.length >= max
  // El chip solo sale donde el paso es obligatorio (lo marca el menú con
  // `permiteNoLleva`). Donde se puede seguir sin escoger, no llevar algo es
  // simplemente no marcarlo.
  const ofreceNoLleva = grupo.permiteNoLleva === true && typeof onToggleNoLleva === 'function'
  return (
    <>
      <h2 className="pw-titulo">{grupo.emoji} {grupo.nombre}</h2>
      {/* Con tope por tamaño, el subtítulo del grupo se queda corto ("Elige 1"):
          manda lo que permite el tamaño que eligió. */}
      {conTope
        ? <p className="pw-sub">Elige hasta {max}</p>
        : grupo.subtitulo && <p className="pw-sub">{grupo.subtitulo}</p>}
      {ofreceNoLleva && (
        <button
          type="button"
          className={`pw-nolleva ${noLleva ? 'on' : ''}`}
          aria-pressed={noLleva}
          onClick={() => onToggleNoLleva()}
        >
          {noLleva
            ? <>✓ No lleva {grupo.nombre.toLowerCase()} <span className="pw-nolleva-nota">(toca para deshacer)</span></>
            : <>⊘ No lleva {grupo.nombre.toLowerCase()} <span className="pw-nolleva-nota">(se cobra igual)</span></>}
        </button>
      )}
      <div className="pw-contador" aria-live="polite">
        {noLleva
          ? 'Listo — no te lo ponemos. Se cobra igual y la cocina lo verá marcado.'
          : elegidas.length > 0
            ? `${elegidas.length}${conTope ? ` de ${max}` : ''} elegido${elegidas.length > 1 ? 's' : ''} ✓`
            : 'Toca para agregar'}
      </div>
      <div className="pw-grid">
        {grupo.opciones.map(opc => {
          // Con "no lo lleva" puesto, la opción más barata queda escogida para
          // poder cobrar — pero el cliente no la escogió, así que no se pinta
          // como suya: se apaga la cuadrícula entera y manda el chip.
          const sel = elegidas.includes(opc.id) && !noLleva
          const bloqueada = max > 1 && lleno && !sel
          return (
            <button
              key={opc.id}
              className={`pw-card ${sel ? 'sel' : ''} ${bloqueada ? 'pw-card-bloq' : ''} ${noLleva ? 'pw-card-apagada' : ''}`}
              disabled={bloqueada}
              onClick={() => onToggle(grupo, opc.id)}
            >
              <span className="pw-card-foto">
                <ImagenApp className="pw-card-foto-img" src={opc.foto} alt="" />
                {sel && <span className="pw-card-check">✓</span>}
              </span>
              <span className="pw-card-nombre">{opc.nombre}</span>
              {opc.precioExtra > 0 && <span className="pw-card-precio">+{cop(opc.precioExtra)}</span>}
            </button>
          )
        })}
      </div>
    </>
  )
}

