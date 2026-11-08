import { useEffect, useState } from 'react'
import { useEsEscritorio } from '../../utils/useEsEscritorio'
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

// 📱 En el celular NO hay burbujas que se deslizan (al usuario nunca le han gustado, 8-nov): la lista
// del lado se ve entera, como los Ajustes del celular, y al tocar una opción se ENTRA a esa parte en
// pantalla completa con «‹ Volver». El botón atrás del celular también vuelve a la lista.
// En el PC no cambia nada: lista a la izquierda y trabajo a la derecha.
export function useEntrar() {
  const esPC = useEsEscritorio()
  const [abierto, setAbierto] = useState(false)
  useEffect(() => {
    if (!abierto || esPC) return
    const alVolver = () => setAbierto(false)
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [abierto, esPC])
  function abrir() {
    if (esPC) return
    try { window.history.pushState({ ...(window.history.state || {}), ppEntrar: 1 }, '') } catch { /* nada */ }
    setAbierto(true)
    window.scrollTo({ top: 0 })
  }
  function volver() {
    if (window.history.state?.ppEntrar) window.history.back()
    else setAbierto(false)
    window.scrollTo({ top: 0 })
  }
  return { esPC, abierto: !esPC && abierto, abrir, volver }
}

// R4 · Dos columnas: el lado (pegado al bajar) y el trabajo. Con `entrar` (useEntrar), en el celular
// se ve O la lista O el detalle, con la barra «‹ Volver · <titulo>».
export function PanelCuerpo({ lado, children, entrar, titulo }) {
  const movil = entrar && !entrar.esPC && lado
  return (
    <div className={`pp-cuerpo${lado ? '' : ' solo'}${movil ? (entrar.abierto ? ' movil-detalle' : ' movil-lista') : ''}`}>
      {lado && (!movil || !entrar.abierto) && <div className="pp-lado">{lado}</div>}
      {(!movil || entrar.abierto) && (
        <div className="pp-trabajo">
          {movil && (
            <div className="pp-volver">
              <button type="button" onClick={entrar.volver}>‹ Volver</button>
              {titulo && <b>{titulo}</b>}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

// La lista del lado, por grupos. Ítem: { id, icono, nombre, nota?, n?, tono? ('ok'|'aviso'|'off') }
// En el celular es la lista entera tipo «Ajustes» (con flecha ›) y se entra al detalle (useEntrar).
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
                  <span className="pp-nav-flecha" aria-hidden="true">›</span>
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

// R8 · Barra flotante «Guardar cambios». `sinGuardar`: hay cambios; `estado`: '' | 'guardando' | 'ok' | 'error';
// `problema`: texto que impide guardar (se muestra y deshabilita el botón).
export function PanelGuardar({ sinGuardar, estado, problema, onGuardar }) {
  if (!sinGuardar && estado !== 'ok' && estado !== 'error') return null
  const ok = estado === 'ok' && !sinGuardar
  return (
    <div className={`pp-guardar${ok ? ' ok' : ''}`} role="status">
      <span>{ok ? '✓ Cambios guardados' : estado === 'error' ? 'No se pudo guardar. Revisa el internet.' : 'Tienes cambios sin guardar'}
        {problema && !ok && <small>{problema}</small>}</span>
      {!ok && <button className="btn btn-primary" onClick={onGuardar} disabled={estado === 'guardando' || !!problema}>{estado === 'guardando' ? 'Guardando…' : 'Guardar cambios'}</button>}
    </div>
  )
}
