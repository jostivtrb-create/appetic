import { useMemo, useState } from 'react'
import { cop } from '../../utils/money'
import { precioUnitario, validarSeleccion } from '../../utils/price'
import './ProductWizard.css'

// 🪄 Armador por PASOS para productos con `modo: 'pasos'` (ej. "arma tu perro").
// Cada grupo de opciones es un paso a pantalla completa con tarjetas de foto;
// el último paso es el resumen. Devuelve la misma forma `seleccion` que el modal
// normal, así que el carrito y el checkout no cambian.
export default function ProductWizard({ producto, onCerrar, onAgregar }) {
  const [varianteId, setVarianteId] = useState(producto.variantes?.length ? producto.variantes[0].id : null)
  const [grupos, setGrupos] = useState({}) // { grupoId: [opcionId, ...] }
  const [paso, setPaso] = useState(0)

  // Pasos: (variante si existe) → cada grupo → resumen
  const pasos = useMemo(() => {
    const arr = []
    if (producto.variantes?.length) arr.push({ tipo: 'variante' })
    for (const g of producto.gruposOpciones || []) arr.push({ tipo: 'grupo', grupo: g })
    arr.push({ tipo: 'resumen' })
    return arr
  }, [producto])

  const seleccion = useMemo(() => ({ varianteId, grupos }), [varianteId, grupos])
  const unitario = precioUnitario(producto, seleccion)
  const total = pasos.length
  const actual = pasos[paso]
  const esUltimo = actual?.tipo === 'resumen'

  function toggleOpcion(grupo, opcId) {
    setGrupos(prev => {
      const actuales = prev[grupo.id] || []
      const yaEsta = actuales.includes(opcId)
      let nuevas
      if (grupo.tipo === 'unica') {
        nuevas = [opcId]
      } else {
        if (yaEsta) nuevas = actuales.filter(id => id !== opcId)
        else {
          if (actuales.length >= (grupo.max ?? 99)) return prev
          nuevas = [...actuales, opcId]
        }
      }
      return { ...prev, [grupo.id]: nuevas }
    })
  }

  // ¿Puede avanzar del paso actual? (respeta el mínimo del grupo)
  const errorPaso = (() => {
    if (actual?.tipo === 'grupo') {
      const g = actual.grupo
      const n = (grupos[g.id] || []).length
      if (n < (g.min ?? 0)) return `Elige al menos ${g.min}`
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
    if (validarSeleccion(producto, seleccion)) return
    // Cada perro se arma individual (cantidad 1); si quiere otro, lo arma de nuevo.
    onAgregar({ producto, seleccion, cantidad: 1, notas: '' })
  }

  // Detalle del resumen: variante elegida + grupos con sus opciones elegidas.
  const varianteElegida = producto.variantes?.find(v => v.id === varianteId)
  const gruposConSeleccion = useMemo(() => (
    (producto.gruposOpciones || []).map(g => ({
      id: g.id, nombre: g.nombre, emoji: g.emoji,
      elegidas: (grupos[g.id] || []).map(id => g.opciones.find(o => o.id === id)).filter(Boolean),
    })).filter(g => g.elegidas.length > 0)
  ), [producto, grupos])
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
                    onClick={() => setVarianteId(v.id)}
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
              onToggle={toggleOpcion}
            />
          )}

          {/* Paso resumen — detalle vertical de lo que armó */}
          {esUltimo && (
            <>
              <h2 className="pw-titulo">{producto.emoji || '✅'} Tu perro está listo</h2>
              <p className="pw-sub">Revisa y agrégalo a tu orden.</p>
              <div className="pw-resumen">
                <div className="pw-resumen-top">
                  <strong className="pw-resumen-nombre">{producto.nombre}</strong>
                  <span className="pw-resumen-precio">{cop(unitario)}</span>
                </div>

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
                    <span className="pw-resumen-grupo-titulo">{g.emoji} {g.nombre} · {g.elegidas.length}</span>
                    <ul className="pw-resumen-lista">
                      {g.elegidas.map(o => (
                        <li key={o.id}>{o.emoji ? `${o.emoji} ` : ''}{o.nombre}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                {!hayDetalle && (
                  <p className="pw-resumen-vacio">Sencillo, sin toppings ni salsas.</p>
                )}
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
            <button className="btn btn-primary pw-next" onClick={agregar}>
              Agregar a mi orden · {cop(unitario)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Un paso de grupo: cuadrícula de tarjetas con foto + contador vivo ---
function PasoGrupo({ grupo, elegidas, onToggle }) {
  return (
    <>
      <h2 className="pw-titulo">{grupo.emoji} {grupo.nombre}</h2>
      {grupo.subtitulo && <p className="pw-sub">{grupo.subtitulo}</p>}
      <div className="pw-contador" aria-live="polite">
        {elegidas.length > 0
          ? `${elegidas.length} elegido${elegidas.length > 1 ? 's' : ''} ✓`
          : 'Toca para agregar'}
      </div>
      <div className="pw-grid">
        {grupo.opciones.map(opc => {
          const sel = elegidas.includes(opc.id)
          return (
            <button
              key={opc.id}
              className={`pw-card ${sel ? 'sel' : ''}`}
              onClick={() => onToggle(grupo, opc.id)}
            >
              <span className="pw-card-foto">
                <OpcionFoto opc={opc} />
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

// Foto de la opción; si falla (o no hay), muestra el emoji.
function OpcionFoto({ opc }) {
  const [fallo, setFallo] = useState(false)
  if (opc.foto && !fallo) {
    return <img src={opc.foto} alt="" loading="lazy" onError={() => setFallo(true)} />
  }
  return <span className="pw-card-emoji">{opc.emoji || '🍽️'}</span>
}
