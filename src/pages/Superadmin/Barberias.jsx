// 💈 BarberIA dentro del superadmin de Appetic (guía de la Plataforma BarberIA, D3 y D5): las
// barberías, sus dueños y su suscripción, y crear una nueva al aprobar una solicitud BI-…
import { useEffect, useState } from 'react'
import {
  BARBERIA_URL, listarBarberias, crearBarberia, cambiarAdminsBarberia, cambiarSuscripcionBarberia, aSlug,
} from '../../services/barberia'

// Precio: cada sede es un plan de $39.900 con 1 barbero incluido + $10.000 por cada barbero adicional
// (BarberIA/src/lib/plan.js).
const mensualidad = (n, s = 1) => s * 39900 + (Math.max(s, n) - s) * 10000
const cop = (n) => `$${Math.round(n).toLocaleString('es-CO')}`
const correoOk = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)

function Nueva({ prefill, onCreada }) {
  const [f, setF] = useState({ nombre: '', slug: '', dueno: '', socio: '', whatsapp: '', barberos: 1, sedes: 1, solicitudId: null })
  const [slugTocado, setSlugTocado] = useState(false)
  const [estado, setEstado] = useState('') // '' | 'guardando' | mensaje de error
  const [prefillVisto, setPrefillVisto] = useState(null)

  // Al tocar «Crear su barbería» en una solicitud, el formulario llega lleno.
  if (prefill && prefill !== prefillVisto) {
    setPrefillVisto(prefill)
    setF({ nombre: prefill.nombre || '', slug: aSlug(prefill.nombre), dueno: '', socio: '', whatsapp: prefill.whatsapp || '', barberos: prefill.barberos || 1, sedes: prefill.sedes || 1, solicitudId: prefill.solicitudId || null })
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
      const r = await crearBarberia({ nombre: f.nombre.trim(), slug, admins, whatsapp: f.whatsapp, barberos: f.barberos, sedes: f.sedes, solicitudId: f.solicitudId })
      setEstado('')
      setF({ nombre: '', slug: '', dueno: '', socio: '', whatsapp: '', barberos: 1, sedes: 1, solicitudId: null })
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
      <label className="sa-bi-vence"><span>Sedes que paga</span>
        <input type="number" min={1} max={20} value={f.sedes} onChange={(e) => setF({ ...f, sedes: Math.max(1, Number(e.target.value) || 1) })} /></label>
      <label className="sa-bi-vence"><span>Barberos que paga</span>
        <input type="number" min={1} max={50} value={f.barberos} onChange={(e) => setF({ ...f, barberos: Math.max(1, Number(e.target.value) || 1) })} />
        <b>{cop(mensualidad(f.barberos, f.sedes))}/mes</b></label>
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
  const [pagados, setPagados] = useState(b.suscripcion?.barberos || 1)
  const [sedes, setSedes] = useState(b.suscripcion?.sedes || 1)
  const activa = b.suscripcion?.activa !== false
  const cambiado = admins.map((x) => x.trim().toLowerCase()).filter(Boolean).join('|') !== b.admins.join('|')

  async function guardarAdmins() {
    const lista = [...new Set(admins.map((x) => x.trim().toLowerCase()).filter(Boolean))]
    if (!lista.length || !lista.every(correoOk)) return setMsg('Al menos un correo válido.')
    setMsg('…')
    try { await cambiarAdminsBarberia(b.slug, lista); setMsg('✓'); onCambio({ admins: lista }) } catch (e) { setMsg(e.message) }
  }
  async function suscripcion(nueva, fecha = vence, barberos = pagados, s = sedes) {
    setMsg('…')
    try { await cambiarSuscripcionBarberia(b.slug, nueva, fecha || null, barberos, s); onCambio({ suscripcion: { ...b.suscripcion, activa: nueva, vence: fecha || undefined, barberos, sedes: s } }); setMsg('') } catch (e) { setMsg(e.message) }
  }

  return (
    <li className="sa-item">
      <div className="sa-item-main">
        <div className="sa-item-logo">{b.logo ? <img src={b.logo} alt="" /> : <span>💈</span>}</div>
        <div className="sa-item-info"><strong>{b.nombre}</strong><span>/{b.slug} · {b.sedes ?? 1} {b.sedes === 1 || b.sedes == null ? 'sede' : 'sedes'} · {b.barberos} {b.barberos === 1 ? 'barbero' : 'barberos'}</span></div>
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
        <span>Sedes que paga</span>
        <input type="number" min={1} max={20} value={sedes} onChange={(e) => setSedes(Math.max(1, Number(e.target.value) || 1))} onBlur={() => sedes !== (b.suscripcion?.sedes || 1) && suscripcion(activa, vence, pagados, sedes)} />
      </label>
      <label className="sa-bi-vence">
        <span>Barberos que paga</span>
        <input type="number" min={1} max={50} value={pagados} onChange={(e) => setPagados(Math.max(1, Number(e.target.value) || 1))} onBlur={() => pagados !== (b.suscripcion?.barberos || 1) && suscripcion(activa, vence, pagados)} />
        <b>{cop(mensualidad(pagados, sedes))}/mes</b>
      </label>
      {(b.barberos > Math.max(pagados, sedes) || (b.sedes || 1) > sedes) && <p className="sa-admin-hint warn">Tiene {b.sedes || 1} {(b.sedes || 1) === 1 ? 'sede' : 'sedes'} y {b.barberos} barberos activos, y paga {sedes} {sedes === 1 ? 'sede' : 'sedes'} y {pagados} barberos: debería pagar {cop(mensualidad(Math.max(b.barberos, pagados), Math.max(b.sedes || 1, sedes)))}.</p>}
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
