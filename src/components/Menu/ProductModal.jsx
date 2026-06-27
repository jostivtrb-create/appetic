import { useMemo, useState } from 'react'
import { cop } from '../../utils/money'
import { precioUnitario, validarSeleccion } from '../../utils/price'
import './ProductModal.css'

export default function ProductModal({ producto, onCerrar, onAgregar }) {
  const [varianteId, setVarianteId] = useState(producto.variantes?.length ? producto.variantes[0].id : null)
  const [grupos, setGrupos] = useState({}) // { grupoId: [opcionId, ...] }
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState('')
  const [intentado, setIntentado] = useState(false)

  const seleccion = useMemo(() => ({ varianteId, grupos }), [varianteId, grupos])
  const unitario = precioUnitario(producto, seleccion)
  const error = validarSeleccion(producto, seleccion)

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
          if (actuales.length >= (grupo.max ?? 99)) return prev // tope alcanzado
          nuevas = [...actuales, opcId]
        }
      }
      return { ...prev, [grupo.id]: nuevas }
    })
  }

  function handleAgregar() {
    setIntentado(true)
    if (error) return
    onAgregar({ producto, seleccion, cantidad, notas: notas.trim() })
  }

  return (
    <div className="pm-overlay" onClick={onCerrar}>
      <div className="pm-sheet" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onCerrar} aria-label="Cerrar">✕</button>

        {producto.foto && (
          <div className="pm-hero">
            <img src={producto.foto} alt={producto.nombre} />
          </div>
        )}

        <div className="pm-body">
          <h2 className="pm-nombre">{producto.nombre}</h2>
          {producto.descripcion && <p className="pm-desc">{producto.descripcion}</p>}

          {/* Variantes / tamaños */}
          {producto.variantes?.length > 0 && (
            <section className="pm-group">
              <div className="pm-group-head">
                <h3>Elige una opción</h3>
                <span className="pm-req">Obligatorio</span>
              </div>
              {producto.variantes.map(v => (
                <label key={v.id} className={`pm-opt ${varianteId === v.id ? 'pm-opt-sel' : ''}`}>
                  <span className="pm-opt-nombre">{v.nombre}</span>
                  <span className="pm-opt-right">
                    <span className="pm-opt-precio">{cop(v.precio)}</span>
                    <input type="radio" name="variante" checked={varianteId === v.id} onChange={() => setVarianteId(v.id)} />
                  </span>
                </label>
              ))}
            </section>
          )}

          {/* Grupos de opciones (combos / adicionales) */}
          {(producto.gruposOpciones || []).map(grupo => {
            const elegidas = grupos[grupo.id] || []
            return (
              <section key={grupo.id} className="pm-group">
                <div className="pm-group-head">
                  <h3>{grupo.nombre}</h3>
                  {(grupo.min ?? 0) > 0
                    ? <span className="pm-req">Obligatorio</span>
                    : <span className="pm-opt-hint">Opcional</span>}
                </div>
                {grupo.opciones.map(opc => {
                  const sel = elegidas.includes(opc.id)
                  return (
                    <label key={opc.id} className={`pm-opt ${sel ? 'pm-opt-sel' : ''}`}>
                      <span className="pm-opt-nombre">{opc.nombre}</span>
                      <span className="pm-opt-right">
                        {opc.precioExtra > 0 && <span className="pm-opt-precio">+{cop(opc.precioExtra)}</span>}
                        <input
                          type={grupo.tipo === 'unica' ? 'radio' : 'checkbox'}
                          name={grupo.id}
                          checked={sel}
                          onChange={() => toggleOpcion(grupo, opc.id)}
                        />
                      </span>
                    </label>
                  )
                })}
              </section>
            )
          })}

          {/* Indicaciones */}
          <section className="pm-group">
            <div className="pm-group-head"><h3>Indicaciones</h3><span className="pm-opt-hint">Opcional</span></div>
            <textarea
              className="pm-notas"
              placeholder="Ej: sin cebolla, salsa aparte…"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              maxLength={140}
              rows={2}
            />
          </section>

          {intentado && error && <p className="pm-error">{error}</p>}
        </div>

        {/* Barra inferior: cantidad + agregar */}
        <div className="pm-footer">
          <div className="pm-qty">
            <button onClick={() => setCantidad(c => Math.max(1, c - 1))} aria-label="Menos">−</button>
            <span>{cantidad}</span>
            <button onClick={() => setCantidad(c => c + 1)} aria-label="Más">+</button>
          </div>
          <button className="btn btn-primary pm-add" onClick={handleAgregar}>
            Agregar · {cop(unitario * cantidad)}
          </button>
        </div>
      </div>
    </div>
  )
}
