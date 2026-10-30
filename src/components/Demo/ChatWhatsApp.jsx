import './ChatWhatsApp.css'

// 💬 Simulación del chat de WhatsApp del restaurante (solo en la demo): muestra el mensaje del
// pedido TAL CUAL llega, con el formato de WhatsApp (*negrita*, _cursiva_) y sus links.
export default function ChatWhatsApp({ nombre, foto, texto }) {
  const hora = new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  return (
    <div className="wa-sim" aria-label="Así se ve el mensaje en WhatsApp">
      <div className="wa-sim-cab">
        <span className="wa-sim-atras" aria-hidden="true">‹</span>
        {foto ? <img src={foto} alt="" /> : <span className="wa-sim-avatar" aria-hidden="true">🍔</span>}
        <span className="wa-sim-nombre"><b>{nombre}</b><small>en línea</small></span>
      </div>
      <div className="wa-sim-fondo">
        <div className="wa-sim-burbuja">
          {texto.split('\n').map((linea, i) => <div key={i} className="wa-sim-linea">{linea ? formato(linea) : ' '}</div>)}
          <span className="wa-sim-hora">{hora} <span className="wa-sim-checks">✓✓</span></span>
        </div>
      </div>
    </div>
  )
}

// *negrita* · _cursiva_ · links clicables (como los pinta WhatsApp)
function formato(linea) {
  const partes = linea.split(/(\*[^*]+\*|_[^_]+_|https?:\/\/\S+)/g)
  return partes.map((p, i) => {
    if (/^\*[^*]+\*$/.test(p)) return <b key={i}>{p.slice(1, -1)}</b>
    if (/^_[^_]+_$/.test(p)) return <i key={i}>{p.slice(1, -1)}</i>
    if (/^https?:\/\//.test(p)) return <span key={i} className="wa-sim-link">{p}</span>
    return p
  })
}
