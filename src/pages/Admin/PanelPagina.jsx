import './PanelPagina.css'

// 🧱 PIEZAS COMUNES de las pantallas del panel (guía «Diseño de pantallas del panel», R2 y R4).
// El Catálogo fue el modelo; estas piezas lo generalizan para Menú del día, Negocio, Pagos…
//
//   <PanelHero miga="Configuración" icono="🍲" titulo="Menú del día" sub="…" chips={[…]} derecha={…} />
//   <PanelCuerpo lado={<PanelLado … />}> …tarjetas de trabajo… </PanelCuerpo>
//   <PanelTarjeta icono="📅" titulo="Lunes" acciones={…}> … </PanelTarjeta>

// R2 · Encabezado grande. `chips`: [{ t: '70 productos', tono: 'ok'|'aviso'|'off'|'info' }]
export function PanelHero({ miga = 'Configuración', icono, titulo, sub, chips = [], derecha }) {
  return (
    <header className="pp-hero">
      <div className="pp-hero-txt">
        <p className="pp-miga">{miga} <span aria-hidden="true">›</span> <b>{titulo}</b></p>
        <div className="pp-hero-tit">
          <span className="pp-hero-ico" aria-hidden="true">{icono}</span>
          <div>
            <h2>{titulo}</h2>
            {sub && <p>{sub}</p>}
          </div>
        </div>
        {chips.length > 0 && (
          <ul className="pp-chips" aria-label="Resumen">
            {chips.filter(Boolean).map((c, i) => <li key={i} className={c.tono ? `t-${c.tono}` : ''}>{c.t}</li>)}
          </ul>
        )}
      </div>
      {derecha && <div className="pp-hero-der">{derecha}</div>}
    </header>
  )
}

// R4 · Dos columnas: el lado (pegado al bajar) y el trabajo.
export function PanelCuerpo({ lado, children }) {
  return (
    <div className={`pp-cuerpo${lado ? '' : ' solo'}`}>
      {lado && <div className="pp-lado">{lado}</div>}
      <div className="pp-trabajo">{children}</div>
    </div>
  )
}

// La lista del lado, por grupos. Ítem: { id, icono, nombre, nota?, n?, tono? ('ok'|'aviso'|'off') }
// En el celular se vuelve una fila de pastillas que se desliza.
export function PanelLado({ icono, titulo, grupos, sel, onSel, pie }) {
  return (
    <nav className="pp-nav" aria-label={titulo}>
      {titulo && <header className="pp-nav-cab"><span className="pp-tile" aria-hidden="true">{icono}</span><b>{titulo}</b></header>}
      {grupos.map((g, gi) => (
        <div key={g.titulo || gi} className="pp-nav-grupo">
          {g.titulo && <p className="pp-nav-tit">{g.titulo}</p>}
          <ul>
            {g.items.map(it => (
              <li key={it.id}>
                <button type="button" className={`pp-nav-item${sel === it.id ? ' on' : ''}${it.tono ? ` t-${it.tono}` : ''}`}
                  onClick={() => onSel(it.id)} aria-current={sel === it.id ? 'true' : undefined}>
                  <span className="pp-nav-ico" aria-hidden="true">{it.icono}</span>
                  <span className="pp-nav-nom">{it.nombre}{it.nota && <small>{it.nota}</small>}</span>
                  {it.n != null && <span className="pp-nav-n">{it.n}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {pie}
    </nav>
  )
}

// R5 · Tarjeta con baldosa de ícono, título, acciones a la derecha y (opcional) ayuda gris.
export function PanelTarjeta({ icono, titulo, sub, acciones, children, className = '' }) {
  return (
    <section className={`pp-card ${className}`}>
      {(titulo || acciones) && (
        <header className="pp-card-cab">
          {icono && <span className="pp-tile" aria-hidden="true">{icono}</span>}
          <div className="pp-card-tit">
            {titulo && <h3>{titulo}</h3>}
            {sub && <p>{sub}</p>}
          </div>
          {acciones && <div className="pp-card-acc">{acciones}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

// R7 · Interruptor con título y consecuencia.
export function PanelSwitch({ titulo, texto, checked, onChange, grande = false }) {
  return (
    <label className={`pp-switch${grande ? ' grande' : ''}`}>
      <span><b>{titulo}</b>{texto && <small>{texto}</small>}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  )
}
