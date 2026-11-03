import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { escucharPantalla, ultimoGuardado } from '../../services/pantallaTV'
import {
  TIEMPOS, platosDelTV, categoriasDelTV, paginarTablero, colaGrande,
  anunciosVigentes, preciosDelPlato, etiquetaGrande, transicionDe,
} from '../../utils/pantallaTV'
import { cop } from '../../utils/money'
import { esColorOscuro } from '../../utils/theme'
import { diaBogota, minutosAhoraBogota } from '../../utils/horario'
import { useMinuto, useConMenuDelDia } from '../../utils/useMinuto'
import { CATEGORIA_MD } from '../../utils/menuDelDia'
import { listosVigentes } from '../../utils/turnos'
import { comandasDe } from '../../services/comandas'
import { estaCortado } from '../../utils/plan'
import { vigilarTV, recargarPronto } from './vigilanteTV'
import { DEMO_SLUG } from '../../config/demo'
import './PantallaTV.css'

// 🍔 En la demo para clientes el TV lleva el letrero y el recorrido (guía «Demo de clientes» D20).
// Va aparte para que un TV de verdad no cargue el código de la demo.
const DemoLetrero = lazy(() => import('../../components/Demo/DemoLetrero'))

// 📺 La pantalla de TV del local: appetic.vercel.app/<slug>/tv
// Guía: .mega-cuestionario/Guía para la Pantalla de TV.md
//
// A un lado el tablero de una categoría (las categorías se turnan) y al otro un plato grande
// que va rotando (D1). Entre páginas entran los anuncios del dueño a pantalla completa (D20).
// Un link fijo, sin sesión ni activación (D13); en vertical se acomoda sola (S9).

export default function PantallaTV(props) {
  return <RedTV recargar={!props.incrustada}><PantallaTVInterna {...props} /></RedTV>
}

function PantallaTVInterna({ slugFijo, incrustada = false }) {
  const params = useParams()
  const slug = slugFijo || params.slug
  const [datos, setDatos] = useState(() => ultimoGuardado(slug))
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
    return escucharPantalla(slug, d => { setDatos(d); setError(null) }, motivo => {
      // Con algo guardado en el aparato se sigue mostrando eso (S6).
      if (!ultimoGuardado(slug)) setError(motivo)
    })
  }, [slug])

  const tam = useTamano()
  const liviano = useModoLiviano(!!datos)
  useAguanteSolo(!incrustada)
  const deriva = useDeriva()
  // En la demo se ve en un celular o un PC, con el recorrido encima: sin pantalla completa al
  // primer toque ni puntero escondido.
  const enDemo = slug === DEMO_SLUG
  const cursorOculto = useCursorOculto(!incrustada && !enDemo)
  const avisoCompleta = usePantallaCompleta(!incrustada && !enDemo)
  // 💳 Local apagado por falta de pago: el TV lo dice y se recarga solo cada 10 min por si ya pagaron.
  const cortado = !!datos && estaCortado(datos.local)
  const [, setTic] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTic(n => n + 1), 60000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (!cortado || incrustada) return
    const t = setTimeout(() => window.location.reload(), 10 * 60000)
    return () => clearTimeout(t)
  }, [cortado, incrustada])

  if (error === 'no-existe') {
    return <Mensaje titulo="Este local no existe" texto={`Revisa el link: /${slug}/tv`} />
  }
  if (!datos) {
    return error
      ? <Mensaje titulo="No hay conexión" texto="Revisa el internet del TV. La pantalla vuelve sola." />
      : <div className="tv tv-cargando"><div className="tv-spinner" /></div>
  }

  if (cortado) {
    return <Mensaje titulo={`${datos.local.nombre} está temporalmente fuera de servicio`} texto="La pantalla vuelve sola apenas el local esté de nuevo en línea." />
  }

  return (
    <>
      <Pantalla
        local={datos.local}
        productos={datos.productos}
        tam={tam}
        clases={`${liviano ? 'tv-liviano' : ''} ${cursorOculto ? 'tv-sin-cursor' : ''} ${incrustada ? 'tv-incrustada' : ''}`}
        deriva={deriva}
        platoFoco={datos.local.esDemo ? new URLSearchParams(window.location.search).get('plato') : null}
      />
      {datos.local.esDemo && !incrustada && (
        <Suspense fallback={null}><DemoLetrero local={datos.local} vista="tv" /></Suspense>
      )}
      {avisoCompleta && <div className="tv-aviso-completa">Pulsa <b>OK</b> o toca la pantalla para verla completa</div>}
    </>
  )
}

function Pantalla({ local: localBase, productos: productosBase, tam, clases, deriva, veloz = false, platoFoco = null }) {
  // 🍲 El almuerzo de hoy entra de primero en el tablero y en el lugar grande, solo dentro de su
  // franja (D19, D23). En el local se dicen los dos precios si son distintos (mesa y llevar).
  const { local, productos } = useConMenuDelDia(localBase, productosBase, 'personal')
  const minuto = useMinuto()
  // 🔔 Pedidos listos (Etapa C): interrumpen a pantalla completa y quedan en una franja (D14).
  const { llamando, franja } = useListos(local, minuto)
  const vertical = tam.h > tam.w
  // Unidad de medida que escala con la pantalla, como si siempre fuera 16:9 (o 9:16).
  const u = vertical ? Math.min(tam.h, tam.w * 16 / 9) / 100 : Math.min(tam.w, tam.h * 16 / 9) / 100
  const transicion = transicionDe(local)

  const platos = useMemo(() => platosDelTV(local, productos), [local, productos])
  const categorias = useMemo(() => categoriasDelTV(local, platos), [local, platos])

  // Platos cuya foto no cargó en este aparato: salen del lugar grande.
  const [sinFoto, setSinFoto] = useState(() => new Set())
  const marcarSinFoto = id => setSinFoto(s => (s.has(id) ? s : new Set(s).add(id)))

  // ¿Hay algo para el lugar grande? Si no, el tablero toma toda la pantalla, en dos columnas.
  const hayGrande = useMemo(() => colaGrande(platos, null, sinFoto).length > 0, [platos, sinFoto])

  // Cuántos platos caben por página, según el alto real del tablero.
  const fila = (vertical ? 5.2 : 6.4) * u
  const listaRef = useRef(null)
  const [altoLista, setAltoLista] = useState(0)
  useEffect(() => {
    const el = listaRef.current
    if (!el) return
    const fin = observarTamano(el, () => setAltoLista(el.clientHeight))
    setAltoLista(el.clientHeight)
    return fin
  }, [hayGrande, vertical])
  const columnas = !hayGrande && !vertical ? 2 : 1
  const porPagina = Math.max(3, Math.floor((altoLista || tam.h * 0.6) / fila)) * columnas

  const paginas = useMemo(() => paginarTablero(categorias, porPagina), [categorias, porPagina])

  // ── Secuencia: páginas del tablero y, cada tanto, un anuncio a pantalla completa ──
  const [paso, setPaso] = useState({ pag: 0, anuncio: null, vueltaAnuncio: 0 })
  const anuncios = useMemo(
    () => anunciosVigentes(local, diaBogota(), minutosAhoraBogota()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [local, minuto],
  )
  useEffect(() => {
    const dura = paso.anuncio != null ? TIEMPOS.anuncio : TIEMPOS.pagina
    const t = setTimeout(() => {
      setPaso(p => {
        if (p.anuncio != null) return { ...p, anuncio: null, pag: p.pag + 1 }
        const siguiente = p.pag + 1
        if (anuncios.length > 0 && siguiente % TIEMPOS.paginasEntreAnuncios === 0) {
          return { ...p, anuncio: p.vueltaAnuncio % anuncios.length, vueltaAnuncio: p.vueltaAnuncio + 1 }
        }
        return { ...p, pag: siguiente }
      })
    }, dura)
    return () => clearTimeout(t)
  }, [paso, anuncios.length])

  // 🍔 Demo: al volver de cambiar un precio (?plato=), salta a la página donde está ese plato y lo
  // resalta, en vez de esperar a que le toque el turno (D20).
  const focoHecho = useRef(false)
  useEffect(() => {
    if (!platoFoco || focoHecho.current || !paginas.length) return
    const i = paginas.findIndex(pg => pg.platos.some(p => p.id === platoFoco))
    if (i < 0) return
    focoHecho.current = true
    setPaso({ pag: i, anuncio: null, vueltaAnuncio: 0 })
  }, [platoFoco, paginas])

  const pagina = paginas.length ? paginas[paso.pag % paginas.length] : null
  const anuncio = paso.anuncio != null ? anuncios[paso.anuncio % Math.max(1, anuncios.length)] : null

  // ── El plato grande ──
  const cola = useMemo(() => colaGrande(platos, pagina?.cat, sinFoto), [platos, pagina?.cat, sinFoto])
  const [iGrande, setIGrande] = useState(0)
  useEffect(() => {
    if (cola.length < 2) return
    const t = setInterval(() => setIGrande(i => i + 1), veloz ? TIEMPOS.plato / 2 : TIEMPOS.plato)
    return () => clearInterval(t)
  }, [cola.length, veloz])
  const grandeHecho = useRef(false)
  useEffect(() => {
    if (!platoFoco || grandeHecho.current) return
    const i = cola.findIndex(p => p.id === platoFoco)
    if (i >= 0) { grandeHecho.current = true; setIGrande(i) }
  }, [platoFoco, cola])
  const grande = cola.length ? cola[iGrande % cola.length] : null
  const siguiente = cola.length > 1 ? cola[(iGrande + 1) % cola.length] : null
  useEffect(() => { if (siguiente?.foto) new Image().src = siguiente.foto }, [siguiente?.foto])

  // Lo que se muestra al lado se va y se queda un momento mientras entra lo nuevo.
  const capas = useCapas(grande)

  const tema = local.tema || {}
  const fondo = tema.bg && esColorOscuro(tema.bg) ? tema.bg : '#17120F'
  const primario = tema.primary || '#ED7D2B'
  const acento = esColorOscuro(primario) ? (tema.accent || tema.primarySoft || '#F2A900') : primario
  const estilo = {
    '--u': `${u}px`,
    '--fila': `${fila}px`,
    '--tv-bg': fondo,
    '--tv-primario': primario,
    '--tv-sobre-primario': tema.onPrimary || '#FFFFFF',
    '--tv-acento': acento,
    '--tv-deriva-x': `${deriva.x}px`,
    '--tv-deriva-y': `${deriva.y}px`,
  }

  const logo = local.logo || local.icono

  return (
    <div className={`tv ${vertical ? 'tv-vertical' : 'tv-horizontal'} ${hayGrande ? '' : 'tv-sin-grande'} ${franja.length ? 'tv-con-listos' : ''} ${clases}`} style={estilo}>
      <div className="tv-escena">
        {hayGrande && (
          <section className={`tvg tvg-${transicion}`}>
            {capas.map(c => (
              <PlatoGrande key={c.clave} plato={c.plato} estado={c.estado} alFallar={marcarSinFoto} />
            ))}
            {cola.length > 1 && cola.length <= 14 && (
              <div className="tvg-puntos">
                {cola.map((p, i) => <i key={p.id} className={i === iGrande % cola.length ? 'on' : ''} />)}
              </div>
            )}
          </section>
        )}

        <section className="tvt">
          <header className="tvt-cabeza">
            {pagina && (
              <div className="tvt-cat" key={`${pagina.cat.id}-${pagina.pagina}`}>
                {pagina.cat.emoji && <span className="tvt-emoji">{pagina.cat.emoji}</span>}
                <h2>{pagina.cat.nombre}</h2>
                {pagina.de > 1 && <span className="tvt-pag">{pagina.pagina}/{pagina.de}</span>}
              </div>
            )}
            <Logo src={logo} nombre={local.nombre} clase="tvt-logo" claseTexto="tvt-nombre" />
          </header>

          <div className="tvt-lista" ref={listaRef}>
            {pagina?.cat.id === CATEGORIA_MD.id ? (
              <TableroAlmuerzo key="almuerzo" plato={pagina.platos[0]} />
            ) : pagina ? (
              <ul key={`${pagina.cat.id}-${pagina.pagina}`} className={columnas === 2 ? 'dos' : ''}>
                {pagina.platos.map((p, i) => <FilaTablero key={p.id} plato={p} i={i} resaltado={p.id === platoFoco} />)}
              </ul>
            ) : (
              <p className="tvt-vacio">Muy pronto verás aquí nuestro menú.</p>
            )}
          </div>

          {categorias.length > 1 && pagina && (
            <footer className="tvt-pie">
              {categorias.map(c => (
                <span key={c.id} className={`tvt-chip ${c.id === pagina.cat.id ? 'on' : ''}`}>
                  {c.emoji} {c.nombre}
                  {c.id === pagina.cat.id && anuncio == null && (
                    <i key={paso.pag} className="tvt-avance" style={{ animationDuration: `${TIEMPOS.pagina}ms` }} />
                  )}
                </span>
              ))}
            </footer>
          )}
        </section>
      </div>

      {anuncio && <Anuncio key={`${anuncio.id}-${paso.vueltaAnuncio}`} anuncio={anuncio} logo={logo} nombre={local.nombre} />}

      {franja.length > 0 && (
        <div className="tvl-franja" aria-label="Pedidos listos">
          <span className="tvl-franja-tit">Listos</span>
          <div className="tvl-franja-lista">
            {franja.map(x => (
              <span key={x.id} className="tvl-chip"><b>{x.turno}</b>{x.nombre && <small>{x.nombre}</small>}</span>
            ))}
          </div>
        </div>
      )}

      {llamando && (
        <div key={llamando.id} className="tvl-llamado" role="alert">
          <span className="tvl-etq">Pedido listo</span>
          <b className="tvl-num">{llamando.turno}</b>
          {llamando.nombre && <span className="tvl-nombre">{llamando.nombre}</span>}
          <span className="tvl-pie">Acércate al mostrador</span>
        </div>
      )}

      <span className="tv-marca">Hecho con <b>Appetic</b></span>
    </div>
  )
}

// 👀 «Ver cómo queda» (D18): la misma pantalla dentro del panel, del tamaño de su caja y con
// lo que el dueño tiene en pantalla aunque no lo haya guardado. El plato grande pasa más rápido
// para que se alcance a ver la transición.
// Avisa cuando cambia el tamaño de `el`. Los TV con Chrome < 64 no tienen ResizeObserver: ahí basta
// el cambio de tamaño de la ventana (en un TV es lo único que cambia). Devuelve cómo dejar de oír.
function observarTamano(el, fn) {
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(fn)
    ro.observe(el)
    return () => ro.disconnect()
  }
  window.addEventListener('resize', fn)
  return () => window.removeEventListener('resize', fn)
}

export function VistaTV({ local, productos }) {
  const ref = useRef(null)
  const [tam, setTam] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setTam({ w: el.clientWidth, h: el.clientHeight })
    const fin = observarTamano(el, medir)
    medir()
    return fin
  }, [])
  return (
    <div ref={ref} className="tv-vista">
      {tam && tam.w > 0 && (
        <Pantalla local={local} productos={productos} tam={tam} clases="tv-incrustada" deriva={{ x: 0, y: 0 }} veloz />
      )}
    </div>
  )
}

function PlatoGrande({ plato, estado, alFallar }) {
  const etiqueta = etiquetaGrande(plato)
  const precio = preciosDelPlato(plato)
  return (
    <article className={`tvg-capa ${estado}`}>
      <div className="tvg-foto">
        <img src={plato.foto} alt="" onError={() => alFallar(plato.id)} />
      </div>
      <div className="tvg-info">
        {etiqueta && <span className="tvg-etq">{etiqueta}</span>}
        <h1>{plato.nombre}</h1>
        {plato.descripcion && <p>{plato.descripcion}</p>}
        <span className="tvg-precio"><Precio precio={precio} /></span>
      </div>
    </article>
  )
}

// 🍲 La página del menú del día: el almuerzo con sus precios y, debajo, qué trae hoy cada parte.
function TableroAlmuerzo({ plato }) {
  const precio = preciosDelPlato(plato)
  const partes = (plato.gruposOpciones || [])
    .filter(g => !g.soloSi)
    .map(g => ({ ...g, opciones: (g.opciones || []).filter(o => !String(o.id).startsWith('sin-')) }))
    .filter(g => g.opciones.length)
  return (
    <div className="tvm">
      <div className="tvm-cab">
        <h3>{plato.nombre}</h3>
        <span className="tvm-precio"><Precio precio={precio} /></span>
      </div>
      <div className="tvm-partes">
        {partes.map((g, i) => (
          <div key={g.id} className="tvm-parte" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="tvm-etq">{g.emoji} {g.nombre}</span>
            <span className="tvm-ops">
              {g.opciones.map((o, j) => (
                <span key={o.id}>
                  {j > 0 && <i className="tvm-o"> o </i>}
                  {o.nombre}
                  {o.precioExtra > 0 && <small> +{cop(o.precioExtra)}</small>}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilaTablero({ plato, i, resaltado = false }) {
  const p0 = preciosDelPlato(plato)
  // Con 3 tamaños o más, los precios uno al lado del otro dejaban el nombre en «Hambur…»: en el
  // tablero va el rango (el detalle está en el menú del celular). Auditoría H13.
  const precio = p0.tipo === 'tamanos' && p0.tamanos.length >= 3
    ? { tipo: 'rango', min: Math.min(...p0.tamanos.map(t => t.precio)), max: Math.max(...p0.tamanos.map(t => t.precio)) }
    : p0
  return (
    <li className={`tvt-fila ${resaltado ? 'tvt-resaltado' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
      <div className="tvt-txt">
        <span className="tvt-pnombre">
          {plato.nombre}
          {plato.destacado && <span className="tvt-fuerte" aria-label="Nuestro fuerte">★</span>}
        </span>
        {plato.descripcion && <span className="tvt-desc">{plato.descripcion}</span>}
      </div>
      <span className="tvt-guia" aria-hidden="true" />
      <span className="tvt-precio"><Precio precio={precio} chico /></span>
    </li>
  )
}

function Precio({ precio, chico = false }) {
  if (precio.tipo === 'tamanos') {
    return (
      <span className={`tv-tamanos ${chico ? 'chico' : ''}`}>
        {precio.tamanos.map(t => <span key={t.nombre}><small>{t.nombre}</small> {cop(t.precio)}</span>)}
      </span>
    )
  }
  if (precio.tipo === 'rango') return <>{cop(precio.min)} – {cop(precio.max)}</>
  if (precio.tipo === 'desde') return <><small>desde</small> {cop(precio.precio)}</>
  return <>{cop(precio.precio)}</>
}

function Anuncio({ anuncio, logo, nombre }) {
  return (
    <div className={`tva ${anuncio.imagen ? 'con-imagen' : ''}`}>
      {anuncio.imagen && <img className="tva-fondo" src={anuncio.imagen} alt="" />}
      <div className="tva-caja">
        {anuncio.titulo && <h1>{anuncio.titulo}</h1>}
        {anuncio.texto && <p>{anuncio.texto}</p>}
      </div>
      <Logo src={logo} nombre={nombre} clase="tva-logo" claseTexto="tva-logo-txt" />
    </div>
  )
}

// El logo del local; si no hay o no carga, su nombre.
function Logo({ src, nombre, clase, claseTexto }) {
  const [fallo, setFallo] = useState(false)
  useEffect(() => setFallo(false), [src])
  if (!src || fallo) return <strong className={claseTexto}>{nombre}</strong>
  return <img className={clase} src={src} alt={nombre} onError={() => setFallo(true)} />
}

function Mensaje({ titulo, texto }) {
  return (
    <div className="tv tv-mensaje">
      <div>
        <h1>{titulo}</h1>
        <p>{texto}</p>
      </div>
      <span className="tv-marca">Hecho con <b>Appetic</b></span>
    </div>
  )
}

// ─────────────────────────────── Ganchos ───────────────────────────────

// 🔔 Escucha `pantalla/listos` (un documento público) si el local prendió los pedidos listos.
// Los que llegan después de abrir la pantalla se llaman de a uno, 7 s cada uno, sin sonido (D24);
// los que ya estaban al abrir no se vuelven a llamar. La franja muestra los de los últimos minutos.
function useListos(local, minuto) {
  const activo = !!local?.pantalla?.pedidosListos && local?.usaCocina !== false
  // undefined = todavía no llega nada; null = no hay documento (ningún pedido listo aún).
  const [docListos, setDocListos] = useState(undefined)
  useEffect(() => {
    if (!activo || !local?.id) { setDocListos(undefined); return }
    const demo = import.meta.env.DEV || new URLSearchParams(window.location.search).has('preview')
    return comandasDe(local.id, { demo }).escucharListos(setDocListos)
  }, [activo, local?.id])

  const vistos = useRef(null)
  const [cola, setCola] = useState([])
  const [llamando, setLlamando] = useState(null)
  useEffect(() => {
    if (docListos === undefined) return
    const items = docListos?.items || []
    // Lo que ya estaba al abrir la pantalla no se vuelve a llamar.
    if (vistos.current === null) { vistos.current = new Set(items.map(x => x.id)); return }
    // Nuevo = no estaba antes, sin mirar el reloj del TV (si iba adelantado no llamaba a nadie).
    const nuevos = items.filter(x => !vistos.current.has(x.id)).reverse()
    nuevos.forEach(x => vistos.current.add(x.id))
    if (nuevos.length) setCola(c => [...c, ...nuevos])
  }, [docListos, activo])
  useEffect(() => {
    if (llamando || !cola.length) return
    setLlamando(cola[0])
    setCola(c => c.slice(1))
  }, [cola, llamando])
  useEffect(() => {
    if (!llamando) return
    const t = setTimeout(() => setLlamando(null), 7000)
    return () => clearTimeout(t)
  }, [llamando])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const franja = useMemo(() => (activo ? listosVigentes(docListos) : []), [activo, docListos, minuto])
  return { llamando, franja }
}

// El plato que entra y el que sale conviven ~1,2 s para que la transición se vea.
function useCapas(plato) {
  const [capas, setCapas] = useState([])
  const n = useRef(0)
  useEffect(() => {
    if (!plato) { setCapas([]); return }
    setCapas(cs => {
      if (cs.length && cs[cs.length - 1].plato.id === plato.id) {
        return cs.map((c, i) => (i === cs.length - 1 ? { ...c, plato } : c))
      }
      const nueva = { clave: ++n.current, plato, estado: cs.length ? 'entra' : 'quieta' }
      return [...cs.filter(c => c.estado !== 'sale').map(c => ({ ...c, estado: 'sale' })), nueva]
    })
    const t = setTimeout(() => setCapas(cs => cs.filter(c => c.estado !== 'sale')), 1400)
    return () => clearTimeout(t)
  }, [plato])
  return capas
}

function useTamano() {
  const leer = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [tam, setTam] = useState(leer)
  useEffect(() => {
    const f = () => setTam(leer())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return tam
}

// S12: si el aparato no mueve 40 cuadros por segundo, se bajan las animaciones pesadas.
// Se mide con el MENÚ ya en pantalla (no mientras gira la carga, que es liviana y daba 60 cuadros
// en un TV que después se traba) y otra vez cada media hora. Una vez liviano, se queda liviano.
function useModoLiviano(listo = true) {
  const [liviano, setLiviano] = useState(() =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false)
  useEffect(() => {
    if (!listo || liviano) return
    let id
    const medir = () => {
      let cuadros = 0
      const inicio = performance.now()
      const contar = ahora => {
        cuadros++
        if (ahora - inicio < 4000) { id = requestAnimationFrame(contar); return }
        if (cuadros / ((ahora - inicio) / 1000) < 40) setLiviano(true)
      }
      id = requestAnimationFrame(contar)
    }
    const t = setTimeout(medir, 2500)
    const cada = setInterval(medir, 30 * 60000)
    return () => { clearTimeout(t); clearInterval(cada); cancelAnimationFrame(id) }
  }, [listo, liviano])
  return liviano
}

// S6: pantalla siempre encendida y una recarga de madrugada para tomar la versión nueva.
// La recarga de las 4 a. m. y la pantalla despierta viven en vigilanteTV.js (fuera de React).
function useAguanteSolo(activo) {
  useEffect(() => { if (activo) vigilarTV() }, [activo])
}

// Anti-quemado: todo se corre unos pocos píxeles cada 7 minutos.
const DERIVAS = [{ x: 0, y: 0 }, { x: 3, y: -2 }, { x: -2, y: 3 }, { x: 2, y: 2 }, { x: -3, y: -1 }]
function useDeriva() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => n + 1), 7 * 60 * 1000)
    return () => clearInterval(t)
  }, [])
  return DERIVAS[i % DERIVAS.length]
}

// Pantalla completa con el OK del control, Enter o un toque. El aviso sale los primeros 10 s
// y solo si el navegador sabe hacerlo y no está ya en pantalla completa.
function usePantallaCompleta(activo) {
  const puede = activo && !!document.documentElement.requestFullscreen
  const [aviso, setAviso] = useState(() => puede && !document.fullscreenElement)
  useEffect(() => {
    if (!puede) return
    const completa = () => {
      setAviso(false)
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
    }
    const tecla = e => { if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13) completa() }
    window.addEventListener('click', completa)
    window.addEventListener('keydown', tecla)
    const t = setTimeout(() => setAviso(false), 10000)
    return () => {
      window.removeEventListener('click', completa)
      window.removeEventListener('keydown', tecla)
      clearTimeout(t)
    }
  }, [puede])
  return aviso
}

// En un computador por HDMI, el puntero se esconde a los 3 s sin moverse.
function useCursorOculto(activo) {
  const [oculto, setOculto] = useState(false)
  useEffect(() => {
    if (!activo) return
    let t
    const mover = () => {
      setOculto(false)
      clearTimeout(t)
      t = setTimeout(() => setOculto(true), 3000)
    }
    mover()
    window.addEventListener('mousemove', mover)
    return () => { window.removeEventListener('mousemove', mover); clearTimeout(t) }
  }, [activo])
  return oculto
}

// 🛟 Red de seguridad: si algo de la pantalla se rompe (un dato raro del menú), se muestra el fondo
// y se recarga sola al minuto, en vez de quedarse negra todo el día (auditoría H7).
export class RedTV extends Component {
  constructor(p) { super(p); this.state = { caida: false } }
  static getDerivedStateFromError() { return { caida: true } }
  componentDidCatch(e) { console.error('TV: la pantalla se cayó', e); if (this.props.recargar) recargarPronto() }
  render() { return this.state.caida ? <div className="tv tv-cargando"><div className="tv-spinner" /></div> : this.props.children }
}
