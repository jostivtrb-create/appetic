import { useMemo, useState } from 'react'
import { cop } from '../../utils/money'
import { maxDelGrupo, precioUnitario, recortarPorVariante, validarSeleccion } from '../../utils/price'
import './ProductModal.css'

export default function ProductModal({ producto, onCerrar, onAgregar }) {
  const [varianteId, setVarianteId] = useState(producto.variantes?.length ? producto.variantes[0].id : null)
  const [grupos, setGrupos] = useState({}) // { grupoId: [opcionId, ...] }
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState('')
  const [intentado, setIntentado] = useState(false)
  const [avisoRecorte, setAvisoRecorte] = useState('')

  const seleccion = useMemo(() => ({ varianteId, grupos }), [varianteId, grupos])
  const unitario = precioUnitario(producto, seleccion)
  const error = validarSeleccion(producto, seleccion)

  function toggleOpcion(grupo, opcId) {
    const max = maxDelGrupo(grupo, varianteId)
    setGrupos(prev => {
      const actuales = prev[grupo.id] || []
      const yaEsta = actuales.includes(opcId)
      let nuevas
      // Con tope 1 se comporta como radio (reemplaza); con tope mayor, se suman
      // hasta llenar. Mandamos por el TOPE y no por grupo.tipo: la misma pizza es
      // "elige 1" en personal y "elige hasta 3" en familiar.
      if (max <= 1) {
        nuevas = [opcId]
      } else {
        if (yaEsta) nuevas = actuales.filter(id => id !== opcId)
        else {
          if (actuales.length >= max) return prev // tope alcanzado
          nuevas = [...actuales, opcId]
        }
      }
      return { ...prev, [grupo.id]: nuevas }
    })
  }

  // Cambiar de tamaño puede encoger el tope (familiar 3 sabores → personal 1):
  // recortamos lo que ya no cabe y se lo decimos, en vez de dejarlo en un estado
  // inválido que solo se descubre al pulsar "Agregar".
  function elegirVariante(id) {
    setVarianteId(id)
    const { grupos: recortados, cambio } = recortarPorVariante(producto, grupos, id)
    if (cambio) {
      setGrupos(recortados)
      setAvisoRecorte('Ese tamaño lleva menos opciones: dejamos las primeras que elegiste.')
    } else {
      setAvisoRecorte('')
    }
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
                    <input type="radio" name="variante" checked={varianteId === v.id} onChange={() => elegirVariante(v.id)} />
                  </span>
                </label>
              ))}
              {avisoRecorte && <p className="pm-group-aviso">{avisoRecorte}</p>}
            </section>
          )}

          {/* Grupos de opciones (combos / adicionales) */}
          {(producto.gruposOpciones || []).map(grupo => {
            const elegidas = grupos[grupo.id] || []
            // Tope según el TAMAÑO elegido (la familiar puede llevar más sabores).
            const max = maxDelGrupo(grupo, varianteId)
            const lleno = elegidas.length >= max
            return (
              <section key={grupo.id} className="pm-group">
                <div className="pm-group-head">
                  <h3>{grupo.nombre}</h3>
                  {(grupo.min ?? 0) > 0
                    ? <span className="pm-req">Obligatorio</span>
                    : <span className="pm-opt-hint">Opcional</span>}
                </div>
                {max > 1 && max < 99 && (
                  <p className="pm-group-sub" aria-live="polite">
                    Elige hasta {max} · llevas {elegidas.length}
                  </p>
                )}
                {grupo.opciones.map(opc => {
                  const sel = elegidas.includes(opc.id)
                  // Con el cupo lleno, las que NO están elegidas se apagan: se ve por qué
                  // no responden, en vez de que el toque no haga nada sin explicación.
                  const bloqueada = max > 1 && lleno && !sel
                  return (
                    <label key={opc.id} className={`pm-opt ${sel ? 'pm-opt-sel' : ''} ${bloqueada ? 'pm-opt-bloq' : ''}`}>
                      <span className="pm-opt-nombre">{opc.nombre}</span>
                      <span className="pm-opt-right">
                        {opc.precioExtra > 0 && <span className="pm-opt-precio">+{cop(opc.precioExtra)}</span>}
                        <input
                          type={max <= 1 ? 'radio' : 'checkbox'}
                          name={grupo.id}
                          checked={sel}
                          disabled={bloqueada}
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
