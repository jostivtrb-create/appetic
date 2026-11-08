import { useEffect, useState } from 'react'
import { contarSuscriptores, escucharAvisos, escucharSemana, enviarAviso } from '../../services/avisosClientes'
import { MAX_POR_SEMANA, TITULO_MAX, MENSAJE_MAX, semanaDe } from '../../utils/avisosClientes'

// 🔔 Difundir → Avisos a tus clientes (guía «Paquetes de Appetic» D9, D31). El dueño escribe un
// aviso corto («¡Hoy hay sancocho!») y le llega a quien marcó su local de favorito o le ha pedido y
// aceptó los avisos. Máximo 3 por semana: así nadie se cansa y los quita.
const IDEAS = ['🍲 ¡Hoy hay sancocho!', '🎉 2x1 en hamburguesas hasta las 8', '🕒 Hoy abrimos hasta tarde', '🆕 Llegó un plato nuevo']

export default function AvisosClientes({ local, demo }) {
  const [subs, setSubs] = useState(null)
  const [semana, setSemana] = useState(0)
  const [lista, setLista] = useState([])
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [estado, setEstado] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => { if (demo) { setSubs(0); return undefined } contarSuscriptores(local.id).then(setSubs).catch(() => setSubs(null)) }, [local.id, demo, estado])
  useEffect(() => (demo ? undefined : escucharSemana(local.id, semanaDe(), setSemana)), [local.id, demo])
  useEffect(() => (demo ? undefined : escucharAvisos(local.id, setLista, () => {})), [local.id, demo])
  const quedan = Math.max(0, MAX_POR_SEMANA - semana)
  const listo = titulo.trim() && mensaje.trim() && quedan > 0 && !local.esDemo && !demo

  async function enviar() {
    if (!listo || estado === 'enviando') return
    if (!window.confirm(`¿Mandar este aviso a ${subs ?? 'tus'} cliente${subs === 1 ? '' : 's'}? Te quedarían ${quedan - 1} esta semana.`)) return
    setEstado('enviando'); setMsg('')
    try {
      const r = await enviarAviso(local.id, titulo, mensaje)
      setEstado('ok'); setMsg(`✓ Enviado a ${r.enviadas} ${r.enviadas === 1 ? 'celular' : 'celulares'}.`)
      setTitulo(''); setMensaje('')
    } catch (e) { setEstado('error'); setMsg(e.message) }
  }

  return (
    <section className="ac-sec dif-avisos">
      <h3>🔔 Avisos a tus clientes</h3>
      <p className="ac-hint">
        Le llegan como notificación a quien marcó tu local de favorito o te ha pedido y aceptó recibirlos.
        {subs != null && <> Hoy son <b>{subs}</b> {subs === 1 ? 'cliente' : 'clientes'}.</>}
      </p>
      <div className="dif-avisos-cupo" aria-label={`Te quedan ${quedan} de ${MAX_POR_SEMANA} esta semana`}>
        {Array.from({ length: MAX_POR_SEMANA }, (_, i) => <i key={i} className={i < semana ? 'usado' : ''} />)}
        <span>Te {quedan === 1 ? 'queda' : 'quedan'} <b>{quedan}</b> de {MAX_POR_SEMANA} esta semana</span>
      </div>
      <div className="dif-ideas">{IDEAS.map(i => <button type="button" key={i} onClick={() => setTitulo(i.slice(0, TITULO_MAX))}>{i}</button>)}</div>
      <label className="dif-campo">Título <small>{titulo.length}/{TITULO_MAX}</small>
        <input maxLength={TITULO_MAX} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej.: ¡Hoy hay sancocho!" />
      </label>
      <label className="dif-campo">Mensaje <small>{mensaje.length}/{MENSAJE_MAX}</small>
        <textarea rows={2} maxLength={MENSAJE_MAX} value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Ej.: Desde las 12, con arroz, aguacate y arepa. ¡Pídelo por la app!" />
      </label>
      {(titulo || mensaje) && (
        <div className="dif-noti" aria-label="Así se verá">
          <span className="dif-noti-ico">{local.icono || local.logo ? <img src={local.icono || local.logo} alt="" /> : '🔔'}</span>
          <div><b>{local.nombre}: {titulo || '…'}</b><small>{mensaje || '…'}</small></div>
        </div>
      )}
      <button type="button" className="btn btn-primary" disabled={!listo || estado === 'enviando'} onClick={enviar}>
        {estado === 'enviando' ? 'Enviando…' : quedan === 0 ? 'Ya usaste los avisos de esta semana' : '🔔 Mandar aviso'}
      </button>
      {(demo || local.esDemo) && <p className="ac-hint">En la demo y en la vista previa los avisos no se envían de verdad.</p>}
      {msg && <p className={`ac-hint ${estado === 'error' ? 'warn' : ''}`}>{msg}</p>}
      {lista.length > 0 && (
        <ul className="dif-avisos-hist">
          {lista.slice(0, 5).map(a => (
            <li key={a.id}><b>{a.titulo}</b><span>{a.en?.toDate?.().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) || ''} · {a.enviadas} {a.enviadas === 1 ? 'celular' : 'celulares'}</span></li>
          ))}
        </ul>
      )}
    </section>
  )
}
