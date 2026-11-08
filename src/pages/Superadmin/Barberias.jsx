// 💈 BarberIA dentro del superadmin de Appetic (guía de la Plataforma BarberIA, D3 y D5): las
// barberías, sus dueños y su suscripción, y crear una nueva al aprobar una solicitud BI-…
import { useEffect, useState } from 'react'
import {
  BARBERIA_URL, listarBarberias, crearBarberia, cambiarAdminsBarberia, cambiarSuscripcionBarberia, aSlug,
} from '../../services/barberia'

const correoOk = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)

function Nueva({ prefill, onCreada }) {
  const [f, setF] = useState({ nombre: '', slug: '', dueno: '', socio: '', whatsapp: '', solicitudId: null })
  const [slugTocado, setSlugTocado] = useState(false)
  const [estado, setEstado] = useState('') // '' | 'guardando' | mensaje de error
  const [prefillVisto, setPrefillVisto] = useState(null)

  // Al tocar «Crear su barbería» en una solicitud, el formulario llega lleno.
  if (prefill && prefill !== prefillVisto) {
    setPrefillVisto(prefill)
    setF({ nombre: prefill.nombre || '', slug: aSlug(prefill.nombre), dueno: '', socio: '', whatsapp: prefill.whatsapp || '', solicitudId: prefill.solicitudId || null })
    setSlugTocado(false)
  }

  const slug = slugTocado ? f.slug : aSlug(f.nombre)
  async function crear(e) {
    e.preventDefault()
    const admins = [f.dueno, f.socio].map((c) => c.trim().toLowerCase()).filter(Boolean)
    if (!f.nombre.trim()) return setEstado('Escribe el nombre de la barbería.')
    if (!admins.length || !admins.every(correoOk)) return setEstado('Escribe el correo de Google del dueño.')
    setEstado('guardando')
    try {
      const r = await crearBarberia({ nombre: f.nombre.trim(), slug, admins, whatsapp: f.whatsapp, solicitudId: f.solicitudId })
      setEstado('')
      setF({ nombre: '', slug: '', dueno: '', socio: '', whatsapp: '', solicitudId: null })
      onCreada(r)
    } catch (err) { setEstado(err.message) }
  }

  return (
    <form className="sa-bi-nueva" onSubmit={crear}>
      <strong>➕ Nueva barbería</strong>
      <input placeholder="Nombre (ej. Barbería El Patrón)" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
      <label className="sa-bi-slug">
        <span>{BARBERIA_URL.replace(/^https?:\/\//, '')}/</span>
        <input value={slug} onChange={(e) => { setSlugTocado(true); setF({ ...f, slug: aSlug(e.target.value) }) }} aria-label="Link de la barbería" />
      </label>
      <input type="email" inputMode="email" autoCapitalize="none" placeholder="Correo de Google del dueño" value={f.dueno} onChange={(e) => setF({ ...f, dueno: e.target.value })} />
      <input type="email" inputMode="email" autoCapitalize="none" placeholder="Segundo correo (opcional)" value={f.socio} onChange={(e) => setF({ ...f, socio: e.target.value })} />
      <input type="tel" inputMode="tel" placeholder="WhatsApp de la barbería (opcional)" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
      {f.solicitudId && <small className="sa-sol-faint">Desde la solicitud {prefill?.numero || ''}</small>}
      {estado && estado !== 'guardando' && <p className="sa-admin-hint">{estado}</p>}
      <button className="sa-bi-crear" disabled={estado === 'guardando'}>{estado === 'guardando' ? 'Creando…' : 'Crear barbería'}</button>
    </form>
  )
}

function Item({ b, onCambio }) {
  const [admins, setAdmins] = useState([b.admins[0] || '', b.admins[1] || ''])
  const [msg, setMsg] = useState('')
  const [vence, setVence] = useState(b.suscripcion?.vence || '')
  const activa = b.suscripcion?.activa !== false
  const cambiado = admins.map((x) => x.trim().toLowerCase()).filter(Boolean).join('|') !== b.admins.join('|')

  async function guardarAdmins() {
    const lista = [...new Set(admins.map((x) => x.trim().toLowerCase()).filter(Boolean))]
    if (!lista.length || !lista.every(correoOk)) return setMsg('Al menos un correo válido.')
    setMsg('…')
    try { await cambiarAdminsBarberia(b.slug, lista); setMsg('✓'); onCambio({ admins: lista }) } catch (e) { setMsg(e.message) }
  }
  async function suscripcion(nueva, fecha = vence) {
    setMsg('…')
    try { await cambiarSuscripcionBarberia(b.slug, nueva, fecha || null); onCambio({ suscripcion: { ...b.suscripcion, activa: nueva, vence: fecha || undefined } }); setMsg('') } catch (e) { setMsg(e.message) }
  }

  return (
    <li className="sa-item">
      <div className="sa-item-main">
        <div className="sa-item-logo">{b.logo ? <img src={b.logo} alt="" /> : <span>💈</span>}</div>
        <div className="sa-item-info"><strong>{b.nombre}</strong><span>/{b.slug} · {b.barberos} {b.barberos === 1 ? 'barbero' : 'barberos'}</span></div>
        <button type="button" className={`sa-bi-estado ${activa ? 'on' : ''}`} onClick={() => suscripcion(!activa)} title="Tocar para cambiar">
          {activa ? '● Activa' : '○ Pausada'}
        </button>
      </div>
      <div className="sa-admins">
        {admins.map((valor, i) => (
          <div className="sa-admin" key={i}>
            <span className="sa-admin-ico">{i === 0 ? '👤' : '👥'}</span>
            <input className="sa-admin-input" type="email" inputMode="email" autoCapitalize="none" spellCheck="false"
              placeholder={i === 0 ? 'correo del dueño (Gmail)' : 'segundo correo (opcional)'} value={valor}
              onChange={(e) => { setAdmins(admins.map((v, j) => (j === i ? e.target.value : v))); setMsg('') }} />
            {i === 0 && <button className="sa-admin-save" onClick={guardarAdmins} disabled={!cambiado}>{msg === '✓' ? '✓' : 'Guardar'}</button>}
          </div>
        ))}
      </div>
      <label className="sa-bi-vence">
        <span>Pagada hasta</span>
        <input type="date" value={vence} onChange={(e) => { setVence(e.target.value); suscripcion(activa, e.target.value) }} />
      </label>
      {msg && msg !== '✓' && msg !== '…' && <p className="sa-admin-hint">{msg}</p>}
      <div className="sa-acciones">
        <a className="sa-accion sa-accion--editar" href={`${BARBERIA_URL}/${b.slug}/admin`} target="_blank" rel="noopener noreferrer">✏️ Panel del dueño</a>
        <a className="sa-accion" href={`${BARBERIA_URL}/${b.slug}`} target="_blank" rel="noopener noreferrer">👀 Ver barbería</a>
      </div>
    </li>
  )
}

export default function Barberias({ prefill }) {
  const [estado, setEstado] = useState('cargando')
  const [lista, setLista] = useState([])
  const [creada, setCreada] = useState(null)

  useEffect(() => {
    let vivo = true
    listarBarberias().then((l) => { if (vivo) { setLista(l); setEstado('ok') } }).catch((e) => { console.error('[barberia]', e); if (vivo) setEstado('error') })
    return () => { vivo = false }
  }, [creada])

  return (
    <section className="sa-sol" id="barberias">
      <div className="sa-sol-cab">
        <span className="sa-sol-ico">💈</span>
        <div className="sa-sol-cab-txt">
          <strong>BarberIA</strong>
          <small>{estado === 'cargando' ? 'Cargando…' : estado === 'error' ? 'No se pudo conectar con BarberIA.' : `${lista.length} ${lista.length === 1 ? 'barbería' : 'barberías'} · ${lista.filter((b) => b.suscripcion?.activa !== false).length} activas`}</small>
        </div>
      </div>
      {creada && (
        <p className="sa-admin-hint ok">
          ✓ Creada. El dueño entra con su correo a <a href={creada.admin} target="_blank" rel="noopener noreferrer">{creada.admin.replace(/^https?:\/\//, '')}</a>. Sigue con <b>/Agregar_Barberia</b> para su marca, barberos y precios.
        </p>
      )}
      <Nueva prefill={prefill} onCreada={setCreada} />
      {estado === 'ok' && (
        <ul className="sa-lista">
          {lista.map((b) => <Item key={b.slug} b={b} onCambio={(c) => setLista((ls) => ls.map((x) => (x.slug === b.slug ? { ...x, ...c } : x)))} />)}
        </ul>
      )}
    </section>
  )
}
