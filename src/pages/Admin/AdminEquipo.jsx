import { useCallback, useEffect, useMemo, useState } from 'react'
import { equipoDe, esCorreo } from '../../services/equipo'
import './Equipo.css'

const TEXTOS = {
  mesero: { titulo: 'Meseros', uno: 'mesero', boton: '👥 Meseros', ayuda: 'Entran con su correo de Google y solo ven la pantalla de Mesero.' },
  cocina: { titulo: 'Cocina', uno: 'cocina', boton: '👥 Cocina', ayuda: 'Cada tablet o celular de cocina entra con un correo de Google y solo ve Comandas.' },
  domiciliario: { titulo: 'Domiciliarios', uno: 'domiciliario', boton: '👥 Domiciliarios', ayuda: 'Entran con su correo de Google y solo ven el panel de Domicilios.' },
}

// 👥 Botón + ventana para que el ADMIN maneje su equipo de un rol (meseros o cocina):
// agregar por correo, ver los activos, desactivar/reactivar y eliminar.
export default function AdminEquipo({ local, rol, demo }) {
  const [abierto, setAbierto] = useState(false)
  const t = TEXTOS[rol]
  return (
    <>
      <button className="eq-abrir" onClick={() => setAbierto(true)}>{t.boton}</button>
      {abierto && <VentanaEquipo local={local} rol={rol} demo={demo} onCerrar={() => setAbierto(false)} />}
    </>
  )
}

function VentanaEquipo({ local, rol, demo, onCerrar }) {
  const t = TEXTOS[rol]
  const api = useMemo(() => equipoDe(local.id, { demo }), [local.id, demo])
  const [lista, setLista] = useState(null)
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [borrando, setBorrando] = useState(null)

  const cargar = useCallback(async () => {
    try { setLista(await api.listar(rol)) } catch { setLista([]); setError('No se pudo cargar la lista.') }
  }, [api, rol])
  useEffect(() => { cargar() }, [cargar])

  async function agregar(e) {
    e.preventDefault()
    const c = correo.trim().toLowerCase()
    if (!esCorreo(c)) { setError('Escribe un correo válido (el de Google con el que va a entrar).'); return }
    if (lista?.some(p => p.email === c)) { setError(`Ese correo ya está en ${t.titulo.toLowerCase()}.`); return }
    setOcupado(true); setError('')
    try { await api.agregar(rol, c); setCorreo(''); await cargar() }
    catch { setError('No se pudo agregar. Revisa tu conexión e intenta de nuevo.') }
    finally { setOcupado(false) }
  }
  async function alternar(p) {
    setOcupado(true)
    try { await api.setActivo(rol, p.email, !p.activo); await cargar() } finally { setOcupado(false) }
  }
  async function eliminar(p) {
    setOcupado(true)
    try { await api.eliminar(rol, p.email); setBorrando(null); await cargar() } finally { setOcupado(false) }
  }

  const activos = (lista || []).filter(p => p.activo)
  const inactivos = (lista || []).filter(p => !p.activo)

  return (
    <div className="eq-velo" onClick={onCerrar}>
      <div className="eq-ventana" role="dialog" aria-modal="true" aria-label={t.titulo} onClick={e => e.stopPropagation()}>
        <header className="eq-cab">
          <div>
            <h2>{t.titulo}</h2>
            <p>{t.ayuda}</p>
          </div>
          <button className="eq-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </header>

        <form className="eq-form" onSubmit={agregar}>
          <input
            type="email" inputMode="email" autoComplete="off" placeholder="correo@gmail.com"
            value={correo} onChange={e => { setCorreo(e.target.value); setError('') }}
            aria-label={`Correo para ${t.titulo.toLowerCase()}`}
          />
          <button className="btn btn-primary" disabled={ocupado || !correo.trim()}>+ Agregar</button>
        </form>
        {error && <p className="eq-error">{error}</p>}

        {lista === null ? <p className="eq-vacio">Cargando…</p> : (
          <>
            <h3 className="eq-sub">Activos · {activos.length}</h3>
            {activos.length === 0 && <p className="eq-vacio">Todavía no hay {t.titulo.toLowerCase()} activos.</p>}
            <ul className="eq-lista">
              {activos.map(p => (
                <Fila key={p.id} p={p} ocupado={ocupado} borrando={borrando === p.id}
                  onAlternar={() => alternar(p)} onPedirBorrar={() => setBorrando(p.id)}
                  onBorrar={() => eliminar(p)} onNoBorrar={() => setBorrando(null)} />
              ))}
            </ul>
            {inactivos.length > 0 && (
              <>
                <h3 className="eq-sub">Desactivados · {inactivos.length}</h3>
                <ul className="eq-lista">
                  {inactivos.map(p => (
                    <Fila key={p.id} p={p} ocupado={ocupado} borrando={borrando === p.id}
                      onAlternar={() => alternar(p)} onPedirBorrar={() => setBorrando(p.id)}
                      onBorrar={() => eliminar(p)} onNoBorrar={() => setBorrando(null)} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Fila({ p, ocupado, borrando, onAlternar, onPedirBorrar, onBorrar, onNoBorrar }) {
  return (
    <li className={`eq-fila ${p.activo ? '' : 'is-off'}`}>
      <span className="eq-avatar" aria-hidden="true">{p.email[0]?.toUpperCase()}</span>
      <span className="eq-correo">{p.email}</span>
      {borrando ? (
        <span className="eq-acciones">
          <span className="eq-seguro">¿Eliminar?</span>
          <button className="eq-btn eq-btn--peligro" onClick={onBorrar} disabled={ocupado}>Sí</button>
          <button className="eq-btn" onClick={onNoBorrar}>No</button>
        </span>
      ) : (
        <span className="eq-acciones">
          <button className="eq-btn" onClick={onAlternar} disabled={ocupado}>{p.activo ? 'Desactivar' : 'Activar'}</button>
          <button className="eq-btn eq-btn--quitar" onClick={onPedirBorrar} aria-label={`Eliminar ${p.email}`} title="Eliminar">🗑</button>
        </span>
      )}
    </li>
  )
}
