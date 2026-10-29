// ⌨️ Teclado grande para el número de mesa.
export function Teclado({ valor, onCambio }) {
  const tecla = t => {
    if (t === '⌫') onCambio(valor.slice(0, -1))
    else if (t === 'C') onCambio('')
    else if (valor.length < 3) onCambio((valor + t).replace(/^0+/, ''))
  }
  return (
    <div className="ms-teclado">
      <div className={`ms-teclado-pantalla ${valor ? '' : 'vacia'}`}>{valor ? `Mesa ${valor}` : 'Número de mesa'}</div>
      <div className="ms-teclado-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(t => (
          <button key={t} onClick={() => tecla(t)} className={t === 'C' || t === '⌫' ? 'aux' : ''} aria-label={t === '⌫' ? 'Borrar' : t === 'C' ? 'Limpiar' : t}>{t}</button>
        ))}
      </div>
    </div>
  )
}

