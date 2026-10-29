import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { DEMO_SLUG } from '../../config/demo'

// 🍔 Demo para clientes (guía «Demo de clientes» D5 · D18): el link para mandar por WhatsApp,
// cuánta gente entró / tocó «Quiero esto», y el botón «Reiniciar demo».
export default function DemoTarjeta() {
  const [datos, setDatos] = useState(null)
  const [confirmar, setConfirmar] = useState(false)
  const [paso, setPaso] = useState('')
  const [copiado, setCopiado] = useState(false)
  const url = `${window.location.origin}/${DEMO_SLUG}`

  async function leer() {
    try {
      const [l, t] = await Promise.all([
        getDoc(doc(db, 'locales', DEMO_SLUG)),
        getDoc(doc(db, 'locales', DEMO_SLUG, 'stats', 'total')),
      ])
      setDatos({ existe: l.exists(), reiniciadaEn: l.data()?.reiniciadaEn?.toDate?.(), interesados: t.data()?.interesados || 0 })
    } catch { setDatos({ existe: false }) }
  }
  useEffect(() => { leer() }, [])

  async function reiniciar() {
    setConfirmar(false)
    try {
      const { reiniciarDemo } = await import('../../services/demo')
      await reiniciarDemo(setPaso)
      leer()
    } catch (e) {
      console.error('[demo] no se pudo reiniciar:', e)
      setPaso(`⚠️ No se pudo reiniciar (${e?.code || e?.message || 'error'}). Intenta de nuevo.`)
    }
  }
  async function fijar() {
    try {
      setPaso('Fijando las fotos actuales…')
      const { fijarFotosBase } = await import('../../services/demo')
      const n = await fijarFotosBase()
      setPaso(`¡Listo! ${n} fotos fijadas: «Reiniciar» ya no las borra.`)
    } catch (e) { setPaso(`⚠️ No se pudo (${e?.code || e?.message || 'error'}).`) }
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1800) } catch { /* nada */ }
  }
  const trabajando = paso && !paso.startsWith('¡') && !paso.startsWith('⚠️')

  return (
    <section className="sa-demo">
      <div className="sa-demo-cab">
        <span className="sa-demo-ico">🍔</span>
        <div>
          <strong>Demo para clientes</strong>
          <small>
            {datos === null ? 'Cargando…'
              : !datos.existe ? 'Todavía no está creada: tócale «Crear demo».'
                : `Reiniciada ${datos.reiniciadaEn ? datos.reiniciadaEn.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'} · ${datos.interesados} tocaron «Quiero esto»`}
          </small>
        </div>
      </div>
      <div className="sa-demo-acc">
        <a className="sa-demo-btn" href={`/${DEMO_SLUG}`} target="_blank" rel="noreferrer">Abrir</a>
        <button className="sa-demo-btn" onClick={copiar}>{copiado ? '✓ Copiado' : 'Copiar link'}</button>
        {datos?.existe && <button className="sa-demo-btn" disabled={trabajando} onClick={fijar} title="Después de subir fotos por el panel de la demo">📌 Fijar fotos</button>}
        <button className="sa-demo-btn sa-demo-btn-rojo" disabled={trabajando} onClick={() => setConfirmar(true)}>
          {datos && !datos.existe ? 'Crear demo' : 'Reiniciar demo'}
        </button>
      </div>
      {paso && <p className="sa-demo-paso" role="status">{paso}</p>}

      {confirmar && (
        <div className="sa-demo-velo" onClick={() => setConfirmar(false)}>
          <div className="sa-demo-confirma" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h3>¿Reiniciar la demo?</h3>
            <p>Se borra todo lo que hicieron los visitantes (pedidos, comandas, fotos, cambios de menú y colores)
              y queda como nueva, con sus comandas y su domicilio de ejemplo.</p>
            <button className="sa-demo-btn sa-demo-btn-rojo" onClick={reiniciar}>Sí, reiniciar</button>
            <button className="sa-demo-btn" onClick={() => setConfirmar(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </section>
  )
}
