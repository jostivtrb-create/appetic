import { useEffect, useMemo, useState } from 'react'
import ImagenApp from '../../components/Imagen/ImagenApp'
import { getCatalogoFotosExterno } from '../../services/menuExterno'
import { construirPromptImagenIA } from '../../utils/promptIA'

// 📸 Las fotos de un local cuyo MENÚ NO VIVE en Appetic (La Gran Esquina).
//
// El menú se arma en vivo desde la app del negocio —caja, cocina, inventario—
// y allá no hay fotos: es una caja, no una carta. Pero las fotos sí son cosa
// de Appetic: el dueño las genera con IA desde aquí, igual que en los demás
// locales, y quedan en `local.fotosExternas` (clave → URL). El traductor las
// pega sobre cada plato y cada opción al armar el menú.
//
// En vez del editor de productos (aquí no hay productos que editar), este
// panel lista TODO lo que puede llevar foto: el desayuno con sus opciones, los
// combos y el almuerzo con todo el inventario de la cocina, no solo lo de hoy.
export default function AdminFotosExternas({ local, onFoto, onQuitarFoto }) {
  const [secciones, setSecciones] = useState(null) // null = cargando
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [subiendo, setSubiendo] = useState(() => new Set())
  const [fallidas, setFallidas] = useState(() => new Set())
  const [avisoIA, setAvisoIA] = useState(null) // null | { prompt }
  const fotos = local.fotosExternas || {}

  useEffect(() => {
    let activo = true
    getCatalogoFotosExterno(local.menuExterno)
      .then(s => { if (activo) setSecciones(s) })
      .catch(err => { console.error('No se pudo leer el catálogo del menú externo:', err); if (activo) setError(true) })
    return () => { activo = false }
  }, [local.menuExterno])

  const q = query.trim().toLowerCase()
  const visibles = useMemo(() => {
    if (!secciones) return []
    if (!q) return secciones
    return secciones
      .map(s => ({ ...s, items: s.items.filter(it => it.nombre.toLowerCase().includes(q) || (it.detalle || '').toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0)
  }, [secciones, q])

  const total = useMemo(() => (secciones || []).reduce((n, s) => n + s.items.length, 0), [secciones])
  const conFoto = useMemo(() => (secciones || []).reduce((n, s) => n + s.items.filter(it => fotos[it.clave]).length, 0), [secciones, fotos])

  function marcar(setter, clave, on) {
    setter(prev => { const next = new Set(prev); on ? next.add(clave) : next.delete(clave); return next })
  }

  async function elegirArchivo(item, e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    marcar(setSubiendo, item.clave, true)
    marcar(setFallidas, item.clave, false)
    try {
      await onFoto(item.clave, f)
    } catch (err) {
      console.warn('No se pudo subir la foto:', err?.code || err)
      marcar(setFallidas, item.clave, true)
    } finally {
      marcar(setSubiendo, item.clave, false)
    }
  }

  async function quitar(item) {
    if (!confirm(`¿Quitar la foto de "${item.nombre}"?`)) return
    marcar(setSubiendo, item.clave, true)
    try { await onQuitarFoto(item.clave) } catch (err) { console.warn('No se pudo quitar la foto:', err?.code || err) } finally { marcar(setSubiendo, item.clave, false) }
  }

  // ✨ Igual que en el editor de productos: arma el prompt a tono con el local, lo
  // copia y abre Gemini. El dueño genera, descarga y sube con "Subir".
  function crearConIA(item) {
    const prompt = construirPromptImagenIA({
      nombre: item.nombre,
      descripcion: item.tipo === 'producto' ? (item.detalle || '') : '',
      tipo: item.tipo === 'producto' ? 'producto' : 'opcion',
      local,
    })
    try { navigator.clipboard?.writeText(prompt) } catch { /* el aviso trae "Copiar de nuevo" */ }
    window.open('https://gemini.google.com/app', '_blank', 'noopener')
    setAvisoIA({ prompt })
  }

  if (error) return <p className="ap-vacio">No pudimos leer el menú del local. Revisa la conexión e intenta de nuevo.</p>
  if (!secciones) return <p className="ap-vacio">Leyendo el menú del local…</p>

  return (
    <div className="ap afe">
      <div className="afe-intro">
        <h3 className="afe-titulo">📸 Fotos del menú</h3>
        <p className="afe-texto">
          El menú se arma solo desde la app del local; aquí solo se le ponen las fotos.
          Se suben una vez y sirven cada día que ese plato salga.
        </p>
        <p className="afe-progreso">{conFoto} de {total} con foto</p>
      </div>

      {avisoIA && (
        <div className="ap-ia-aviso">
          <button className="ap-ia-aviso-x" onClick={() => setAvisoIA(null)} aria-label="Cerrar">✕</button>
          <p className="ap-ia-aviso-tit">✨ Abrimos <strong>Gemini</strong> en otra pestaña</p>
          <ol className="ap-ia-aviso-pasos">
            <li>Pega el prompt (ya copiado) y envía.</li>
            <li>Cuando Gemini genere la imagen, <strong>descárgala</strong>.</li>
            <li>Vuelve aquí y súbela con <strong>📱 Subir</strong> en ese mismo plato.</li>
          </ol>
          <button
            type="button"
            className="ap-ia-aviso-copiar"
            onClick={() => { try { navigator.clipboard?.writeText(avisoIA.prompt) } catch {} }}
          >
            📋 Copiar el prompt de nuevo
          </button>
        </div>
      )}

      <div className="ap-buscar">
        <svg className="ap-buscar-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="ap-buscar-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar plato u opción…"
          aria-label="Buscar plato u opción"
        />
        {query && <button className="ap-buscar-clear" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">✕</button>}
      </div>

      {visibles.length === 0 && (
        <p className="ap-vacio">{q ? <>No encontramos “<strong>{query}</strong>”.</> : 'El local todavía no ha publicado su menú.'}</p>
      )}

      {visibles.map(sec => (
        <section key={sec.id} className="ap-grupo-cat">
          <div className="ap-grupo-cat-head">
            <span className="ap-grupo-cat-title afe-sec-title">
              {sec.titulo} <span className="ap-grupo-cat-count">· {sec.items.length}</span>
            </span>
          </div>
          <div className="ap-lista">
            {sec.items.map(item => {
              const url = fotos[item.clave] || ''
              const ocupado = subiendo.has(item.clave)
              const fallo = fallidas.has(item.clave)
              return (
                <div key={item.clave} className={`ap-item afe-item ${item.apagado ? 'ap-item-off' : ''}`}>
                  <div className={`ap-item-foto ${fallo ? 'afe-foto-error' : ''}`}>
                    {url ? <ImagenApp className="ap-item-foto-img" src={url} alt="" /> : <span>{item.tipo === 'producto' ? '🍽️' : '📷'}</span>}
                  </div>
                  <div className="ap-item-info">
                    <h4>{item.nombre}</h4>
                    <p className="afe-detalle">
                      {item.tipo === 'producto' ? 'Plato' : 'Opción'}{item.detalle ? ` · ${item.detalle}` : ''}
                      {item.apagado ? ' · apagado en el local' : ''}
                      {fallo ? ' · no se pudo subir, intenta de nuevo' : ''}
                    </p>
                  </div>
                  <div className="afe-acciones">
                    <label className={`afe-btn ${ocupado ? 'afe-btn-off' : ''}`} title="Subir desde el dispositivo">
                      {ocupado ? '⏳' : '📱'} <span>{ocupado ? 'Subiendo' : url ? 'Cambiar' : 'Subir'}</span>
                      <input type="file" accept="image/*" hidden disabled={ocupado} onChange={e => elegirArchivo(item, e)} />
                    </label>
                    <button type="button" className="afe-btn afe-btn-ia" onClick={() => crearConIA(item)} title="Crear foto con IA">
                      ✨ <span>IA</span>
                    </button>
                    {url && !ocupado && (
                      <button type="button" className="afe-quitar" onClick={() => quitar(item)} aria-label="Quitar foto" title="Quitar foto">✕</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
