import { useCallback, useEffect, useMemo, useState } from 'react'
import { equipoDe, esCorreo } from '../../services/equipo'
import { urlWhatsApp } from '../../utils/whatsapp'
import './Equipo.css'

const TEXTOS = {
  mesero: { icono: '🧑‍🍳', titulo: 'Meseros', uno: 'mesero', boton: '👥 Meseros', ayuda: 'Entran con su correo de Google y solo ven la pantalla de Mesero.' },
  cocina: { icono: '🍳', titulo: 'Cocina', uno: 'cocina', boton: '👥 Cocina', ayuda: 'Cada tablet o celular de cocina entra con un correo de Google y solo ve la pantalla de Cocina.' },
  domiciliario: { icono: '🛵', titulo: 'Domiciliarios', uno: 'domiciliario', boton: '👥 Domiciliarios', ayuda: 'Entran con su correo de Google y solo ven el panel de Domicilios.' },
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

// La misma lista, pero dentro de la página (Configuración → Equipo), sin ventana encima.
export function EquipoEnLinea({ local, rol, demo }) {
  return <VentanaEquipo local={local} rol={rol} demo={demo} inline />
}

function VentanaEquipo({ local, rol, demo, onCerrar, inline = false }) {
  const t = TEXTOS[rol]
  const api = useMemo(() => equipoDe(local.id, { demo }), [local.id, demo])
  const [lista, setLista] = useState(null)
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [borrando, setBorrando] = useState(null)
  const [recien, setRecien] = useState('')   // correo recién agregado: se le muestra cómo avisarle

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
    try { await api.agregar(rol, c); setCorreo(''); setRecien(c); await cargar() }
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
    <Marco inline={inline} onCerrar={onCerrar} titulo={t.titulo}>
        <header className="eq-cab">
          <div>
            <h2>{t.icono} {t.titulo}</h2>
            <p>{t.ayuda}</p>
          </div>
          {!inline && <button className="eq-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>}
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
        <ComoEntra local={local} rol={rol} recien={recien} />

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
    </Marco>
  )
}

// 🔗 Cómo entra la persona: el link DIRECTO a su pantalla (no el del menú, que abre la vista de
// cliente) y que entre con Google usando el MISMO correo que se agregó aquí.
function ComoEntra({ local, rol, recien }) {
  const [copiado, setCopiado] = useState(false)
  const t = TEXTOS[rol]
  const link = `${window.location.origin}/${local.slug}/admin`
  const pantalla = rol === 'mesero' ? 'tomar pedidos' : rol === 'cocina' ? 'ver las comandas' : 'ver los domicilios'
  const mensaje = `¡Hola! Ya quedaste como ${t.uno} de ${local.nombre} en Appetic 🧡\n\n` +
    `1. Abre este link: ${link}\n2. Toca «Entrar con Google» y elige la cuenta ${recien || 'que te agregamos'}\n` +
    `3. Listo: te sale tu pantalla para ${pantalla}. Guárdala en el inicio del celular para tenerla a la mano.`
  async function copiar() {
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 1800) } catch { /* nada */ }
  }
  const enviar = () => {
    const url = urlWhatsApp('', mensaje).replace('phone=&', '')
    if (/^whatsapp:/.test(url)) window.location.href = url
    else window.open(url, '_blank', 'noopener')
  }
  return (
    <div className={`eq-como ${recien ? 'is-nuevo' : ''}`}>
      {recien
        ? <p><b>✓ Agregaste a {recien}.</b> Ahora mándale este link. Tiene que entrar con Google usando <b>ese mismo correo</b>.</p>
        : <p><b>¿Cómo entra?</b> Con este link (no el del menú) y su cuenta de Google del correo que agregaste.</p>}
      <code className="eq-como-link">{link}</code>
      <div className="eq-como-acc">
        <button className="eq-btn" onClick={copiar}>{copiado ? '✓ Copiado' : 'Copiar link'}</button>
        <button className="eq-btn eq-btn--wa" onClick={enviar}>💬 Enviar por WhatsApp</button>
      </div>
    </div>
  )
}

// Marco a nivel de módulo (identidad estable): si se definiera dentro del render, React lo
// recrearía en cada tecla y el campo de correo perdería el foco.
function Marco({ inline, onCerrar, titulo, children }) {
  if (inline) return <section className="eq-inline ac-sec">{children}</section>
  return (
    <div className="eq-velo" onClick={onCerrar}>
      <div className="eq-ventana" role="dialog" aria-modal="true" aria-label={titulo} onClick={e => e.stopPropagation()}>{children}</div>
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
