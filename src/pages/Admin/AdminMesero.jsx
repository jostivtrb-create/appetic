import { useEffect, useMemo, useRef, useState } from 'react'
import { cop } from '../../utils/money'
import { tieneOpciones, precioItem } from '../../utils/price'
import { resumenSeleccion } from '../../utils/selectionSummary'
import {
  comandasDe, itemsDeComanda, etiquetaDestino, claveMesa, ms, nuevoIdComanda, motivoError,
} from '../../services/comandas'
import ProductModal from '../../components/Menu/ProductModal'
import ProductWizard from '../../components/Menu/ProductWizard'
import AdminEquipo from './AdminEquipo'
import ActivarAvisos from './ActivarAvisos'
import { useEsEscritorio } from '../../utils/useEsEscritorio'
import { Teclado } from './Teclado'
import CorregirComanda, { Cuidado } from './CorregirComanda'
import PorConfirmar from './PorConfirmar'
import { pedidosDe } from '../../services/pedidos'
import { urlWhatsApp, normalizarTel, mensajeTotalCambio } from '../../utils/whatsapp'
import { useAhora, minutosSeg, nivelTiempo, umbralesDe, coloresComanda, itemsTxt, claseDestino } from './comandaUtils'
import './Mesero.css'

// 🧑‍🍳 PANTALLA DEL MESERO (guía «Mesero y Comandas», paso 1).
//   • «Nuevo pedido»: el mismo catálogo del cliente pero compacto (sin fotos, con buscador). Los
//     productos con opciones abren el MISMO modal del cliente (mismas opciones, precios y reglas).
//     Cada ítem lleva su comentario. Al final: mesa por teclado, otro nombre o para llevar.
//   • «En curso»: todas las comandas vivas del local, por mesa, con lo que ya salió tachado.
//     Desde ahí se cancela una comanda. Cuando la cocina entrega una que mandó ESTE mesero,
//     aparece arriba un aviso que parpadea hasta que lo toca.
export default function AdminMesero({ local, productos, demo, usuario, esAdmin }) {
  const api = useMemo(() => comandasDe(local.id, { demo }), [local.id, demo])
  const [vista, setVista] = useState('tomar') // tomar | curso
  const [activas, setActivas] = useState([])
  const [recientes, setRecientes] = useState([])
  const [errorEscucha, setErrorEscucha] = useState('')

  useEffect(() => api.escucharActivas(l => { setActivas(l); setErrorEscucha('') }, e => setErrorEscucha(motivoError(e))), [api])
  useEffect(() => api.escucharRecientes(l => setRecientes(l), () => {}), [api])

  const yo = (usuario?.email || '').toLowerCase()
  const listos = useListos(recientes, yo, local.id)

  return (
    <div className="ms">
      {!demo && <ActivarAvisos local={local} usuario={usuario} />}
      {esAdmin && (
        <div className="ms-admin">
          <AdminEquipo local={local} rol="mesero" demo={demo} />
        </div>
      )}

      {listos.pendientes.length > 0 && (
        <button className="ms-listo" onClick={() => { listos.marcarVistos(); setVista('curso') }}>
          <span className="ms-listo-campana" aria-hidden="true">🔔</span>
          <span>
            <strong>{listos.pendientes.length === 1 ? '¡Pedido listo!' : `¡${listos.pendientes.length} pedidos listos!`}</strong>
            {' '}{listos.pendientes.map(c => etiquetaDestino(c.destino)).join(' · ')}
          </span>
          <span className="ms-listo-ok">Entendido</span>
        </button>
      )}

      <div style={coloresComanda(local).vars}><PorConfirmar local={local} demo={demo} usuario={usuario} /></div>

      <div className="ms-seg" role="tablist">
        <button role="tab" aria-selected={vista === 'tomar'} className={vista === 'tomar' ? 'on' : ''} onClick={() => setVista('tomar')}>
          Nuevo pedido
        </button>
        <button role="tab" aria-selected={vista === 'curso'} className={vista === 'curso' ? 'on' : ''} onClick={() => setVista('curso')}>
          En curso {activas.length > 0 && <span className="ms-seg-n">{activas.length}</span>}
        </button>
      </div>

      {errorEscucha && <p className="ms-aviso-red">{errorEscucha}</p>}

      {vista === 'tomar'
        ? <TomarPedido local={local} productos={productos} api={api} activas={activas} usuario={usuario} />
        : <EnCurso local={local} productos={productos} api={api} activas={activas} recientes={recientes} usuario={usuario} demo={demo} />}
    </div>
  )
}

// ─────────────────────────────── Tomar el pedido ───────────────────────────────

function TomarPedido({ local, productos, api, activas, usuario }) {
  const KEY = `appetic_mesero_carrito_${local.id}`
  // Solo productos de ESTE local: cada línea lleva su localId y además se cruza con el menú actual
  // (lo que no esté —de otro local o ya borrado del menú— se descarta al abrir).
  const idsMenu = useMemo(() => new Set(productos.map(p => p.id)), [productos])
  const [carrito, setCarrito] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(KEY) || '[]')
      return guardado.filter(it => it.localId === local.id && idsMenu.has(it.producto?.id))
    } catch { return [] }
  })
  // El pedido a medio armar sobrevive si el mesero cambia de pantalla o se le cierra la app.
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(carrito)) } catch { /* nada */ } }, [KEY, carrito])

  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null) // producto con opciones abierto en el modal
  const [hoja, setHoja] = useState(false)      // la comanda + destino
  const [enviada, setEnviada] = useState('')   // aviso «enviada a cocina»
  const [info, setInfo] = useState(null)       // producto del que se ve «¿Qué lleva?»
  const esPC = useEsEscritorio()

  const disponibles = useMemo(() => productos.filter(p => p.disponible !== false), [productos])
  const categorias = useMemo(() => (local.categorias || []).filter(c => disponibles.some(p => p.categoria === c.id)), [local.categorias, disponibles])
  const filtrados = useMemo(() => {
    const t = normalizar(q)
    if (!t) return null
    return disponibles.filter(p => normalizar(`${p.nombre} ${p.descripcion || ''}`).includes(t))
  }, [q, disponibles])

  const cantidadDe = id => carrito.filter(it => it.producto.id === id).reduce((s, it) => s + it.cantidad, 0)
  const totalItems = carrito.reduce((s, it) => s + it.cantidad, 0)
  const total = carrito.reduce((s, it) => s + precioItem(it), 0)

  function tocar(p) {
    if (tieneOpciones(p)) { setAbierto(p); return }
    // Sin opciones: un toque = uno más (se suma a la línea que ya exista sin comentario).
    setCarrito(c => {
      const i = c.findIndex(it => it.producto.id === p.id && !it.comentario)
      if (i >= 0) return c.map((it, j) => j === i ? { ...it, cantidad: it.cantidad + 1 } : it)
      return [...c, { uid: uid(), localId: local.id, producto: p, seleccion: {}, cantidad: 1, comentario: '' }]
    })
  }
  function agregarDesdeModal({ producto, seleccion, cantidad, notas }) {
    setCarrito(c => [...c, { uid: uid(), localId: local.id, producto, seleccion, cantidad, comentario: notas || '' }])
    setAbierto(null)
  }

  function listo(etiqueta) {
    setCarrito([])
    setQ('')
    setHoja(false)
    setEnviada(etiqueta)
    setTimeout(() => setEnviada(''), 3500)
  }

  const renglon = p => {
    const n = cantidadDe(p.id)
    return (
      <li key={p.id} className="ms-prod-li">
        <button className={`ms-prod ${n ? 'tiene' : ''} ${p.descripcion ? 'con-info' : ''}`} onClick={() => tocar(p)}>
          <span className="ms-prod-nombre">{p.nombre}</span>
          <span className="ms-prod-precio">{precioDesde(p)}{tieneOpciones(p) ? ' ›' : ''}</span>
          {n > 0 ? <span className="ms-prod-n">{n}</span> : <span className="ms-prod-mas" aria-hidden="true">+</span>}
        </button>
        {p.descripcion && (
          <button className="ms-prod-info" onClick={() => setInfo(p)} aria-label={`¿Qué lleva ${p.nombre}?`} title="¿Qué lleva?">ⓘ</button>
        )}
      </li>
    )
  }

  return (
    <>
      <div className="ms-pos">
        <div className="ms-pos-menu">
      <div className="ms-buscar">
        <span aria-hidden="true">🔎</span>
        <input type="search" placeholder="Buscar producto…" value={q} onChange={e => setQ(e.target.value)} />
        {q && <button onClick={() => setQ('')} aria-label="Borrar búsqueda">✕</button>}
      </div>

      {filtrados ? (
        <ul className="ms-lista">
          {filtrados.length ? filtrados.map(renglon) : <li className="ms-vacio">Nada con «{q}».</li>}
        </ul>
      ) : (
        <>
          <nav className="ms-cats" aria-label="Categorías">
            {categorias.map(c => (
              <a key={c.id} href={`#ms-cat-${c.id}`} onClick={e => { e.preventDefault(); document.getElementById(`ms-cat-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                {c.emoji ? `${c.emoji} ` : ''}{c.nombre}
              </a>
            ))}
          </nav>
          {categorias.map(c => (
            <section key={c.id} id={`ms-cat-${c.id}`} className="ms-cat">
              <h3>{c.emoji ? `${c.emoji} ` : ''}{c.nombre}</h3>
              <ul className="ms-lista">
                {disponibles.filter(p => p.categoria === c.id).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).map(renglon)}
              </ul>
            </section>
          ))}
        </>
      )}

        </div>
        {/* 🖥️ PC: la comanda siempre a la vista, a la derecha. */}
        {esPC && (
          <aside className="ms-pos-comanda">
            {carrito.length ? (
              <HojaComanda
                enLinea local={local} idsMenu={idsMenu}
                carrito={carrito} setCarrito={setCarrito} total={total} api={api} activas={activas}
                usuario={usuario} onCerrar={() => {}} onEnviada={listo}
              />
            ) : (
              <div className="ms-pos-vacia">
                <span aria-hidden="true">🧾</span>
                <strong>Comanda vacía</strong>
                <small>Toca un producto de la izquierda para empezar.</small>
              </div>
            )}
          </aside>
        )}
      </div>

      {enviada && <div className="ms-toast" role="status">✓ Enviada a cocina · {enviada}</div>}

      {/* Se esconde mientras haya una ventana encima (opciones, «¿qué lleva?»): si no, tapaba su
          botón «Agregar» al pie. */}
      {!esPC && totalItems > 0 && !hoja && !abierto && !info && (
        <button className="ms-barra" onClick={() => setHoja(true)}>
          <span className="ms-barra-n">{totalItems}</span>
          <span>Ver comanda</span>
          <span className="ms-barra-total">{cop(total)} ›</span>
        </button>
      )}

      {info && (
        <div className="ms-velo" onClick={() => setInfo(null)}>
          <div className="ms-hoja ms-info" role="dialog" aria-modal="true" aria-label={`¿Qué lleva ${info.nombre}?`} onClick={e => e.stopPropagation()}>
            <header className="ms-hoja-cab">
              <h2>{info.nombre}</h2>
              <button className="ms-x" onClick={() => setInfo(null)} aria-label="Cerrar">✕</button>
            </header>
            <p className="ms-info-tit">¿Qué lleva?</p>
            <p className="ms-info-txt">{info.descripcion}</p>
            <p className="ms-info-precio">{precioDesde(info)}</p>
            <button className="ms-enviar" onClick={() => { const p = info; setInfo(null); tocar(p) }}>
              {tieneOpciones(info) ? 'Elegir opciones y agregar' : '+ Agregar a la comanda'}
            </button>
          </div>
        </div>
      )}

      {abierto && (abierto.modo === 'pasos'
        ? <ProductWizard producto={abierto} onCerrar={() => setAbierto(null)} onAgregar={agregarDesdeModal} />
        : <ProductModal producto={abierto} compacto textoNotas="Comentario para cocina" onCerrar={() => setAbierto(null)} onAgregar={agregarDesdeModal} />)}

      {hoja && !esPC && (
        <HojaComanda
          local={local} idsMenu={idsMenu}
          carrito={carrito} setCarrito={setCarrito} total={total} api={api} activas={activas}
          usuario={usuario} onCerrar={() => setHoja(false)} onEnviada={listo}
        />
      )}
    </>
  )
}

// La comanda armada: ítems con su comentario, y abajo el destino (mesa / nombre / llevar) + Enviar.
// `enLinea`: en el PC la comanda vive fija a la derecha del menú (como una caja registradora),
// en vez de abrirse como ventana desde la barra de abajo.
function HojaComanda({ local, idsMenu, carrito, setCarrito, total, api, activas, usuario, onCerrar, onEnviada, enLinea = false }) {
  const [tipo, setTipo] = useState('mesa')   // mesa | nombre | llevar
  const [mesa, setMesa] = useState('')
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState('')   // '' | enviando | error
  const [avisoMesa, setAvisoMesa] = useState(null) // comandas vivas de esa mesa
  const idRef = useRef(null)                 // mismo id en los reintentos → nunca se duplica
  const avisoRef = useRef(null)
  // El aviso de «mesa en curso» sale abajo del teclado: se trae a la vista para que no pase por alto.
  useEffect(() => { if (avisoMesa) avisoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [avisoMesa])

  const destino = tipo === 'llevar'
    ? { tipo: 'llevar', mesa: null, nombre: nombre.trim() || null }
    : tipo === 'nombre'
      ? { tipo: 'mesa', mesa: null, nombre: nombre.trim() || null }
      : { tipo: 'mesa', mesa: mesa || null, nombre: null }
  const destinoListo = tipo === 'llevar' || (tipo === 'mesa' ? !!mesa : !!nombre.trim())

  function cambiar(uid, cambios) { setCarrito(c => c.map(it => it.uid === uid ? { ...it, ...cambios } : it)) }
  function quitar(uid) { setCarrito(c => c.filter(it => it.uid !== uid)) }

  function intentarEnviar() {
    if (!destinoListo || !carrito.length) return
    const k = claveMesa(destino)
    const vivas = k ? activas.filter(c => claveMesa(c.destino) === k) : []
    if (vivas.length && !avisoMesa) { setAvisoMesa(vivas); return }
    enviar()
  }

  async function enviar() {
    setAvisoMesa(null)
    // Última barrera: nada que no sea del menú de ESTE local llega a su cocina.
    const ajenos = carrito.filter(it => it.localId !== local.id || !idsMenu.has(it.producto?.id))
    if (ajenos.length) {
      setCarrito(c => c.filter(it => !ajenos.includes(it)))
      setEstado('ajenos')
      return
    }
    setEstado('enviando')
    if (!idRef.current) idRef.current = nuevoIdComanda(api)
    const datos = {
      id: idRef.current,
      destino,
      items: itemsDeComanda(carrito),
      creadaPor: { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' },
    }
    try {
      // Si en 10 s no confirma el servidor, se avisa: el mesero NUNCA debe creer que llegó
      // algo que no llegó. Reintentar usa el mismo id, así que no puede quedar repetida.
      await conTiempo(api.crear(datos), 10000)
      idRef.current = null
      onEnviada(etiquetaDestino(destino))
    } catch {
      setEstado('error')
    }
  }

  const cuerpo = (
      <>
        <header className="ms-hoja-cab">
          <h2>Comanda</h2>
          {!enLinea && <button className="ms-x" onClick={onCerrar} aria-label="Seguir agregando">✕</button>}
        </header>

        <ul className="ms-items">
          {carrito.map(it => (
            <li key={it.uid} className="ms-item">
              <div className="ms-item-fila">
                <div className="ms-item-qty">
                  <button onClick={() => it.cantidad > 1 ? cambiar(it.uid, { cantidad: it.cantidad - 1 }) : quitar(it.uid)} aria-label="Uno menos">{it.cantidad > 1 ? '−' : '🗑'}</button>
                  <strong>{it.cantidad}</strong>
                  <button onClick={() => cambiar(it.uid, { cantidad: it.cantidad + 1 })} aria-label="Uno más">+</button>
                </div>
                <div className="ms-item-txt">
                  <span className="ms-item-nombre">{it.producto.nombre}</span>
                  {resumenSeleccion(it.producto, it.seleccion) && <span className="ms-item-op">{resumenSeleccion(it.producto, it.seleccion)}</span>}
                </div>
                <span className="ms-item-precio">{cop(precioItem(it))}</span>
              </div>
              <input
                className="ms-item-com" placeholder="💬 Comentario para cocina (opcional)" maxLength={140}
                value={it.comentario || ''} onChange={e => cambiar(it.uid, { comentario: e.target.value })}
              />
            </li>
          ))}
        </ul>
        <p className="ms-total">Total <strong>{cop(total)}</strong></p>

        <h3 className="ms-sub">¿Para dónde va?</h3>
        <div className="ms-tipo" role="radiogroup">
          {[['mesa', '🪑 Mesa'], ['nombre', '✏️ Otro nombre'], ['llevar', '🥡 Para llevar']].map(([v, t]) => (
            <button key={v} role="radio" aria-checked={tipo === v} className={tipo === v ? 'on' : ''} onClick={() => { setTipo(v); setAvisoMesa(null) }}>{t}</button>
          ))}
        </div>

        {tipo === 'mesa' && <Teclado valor={mesa} onCambio={v => { setMesa(v); setAvisoMesa(null) }} />}
        {tipo !== 'mesa' && (
          <input
            className="ms-nombre" autoFocus maxLength={30}
            placeholder={tipo === 'llevar' ? 'Nombre del cliente (opcional)' : 'Ej: Barra, Terraza, Don Carlos'}
            value={nombre} onChange={e => { setNombre(e.target.value); setAvisoMesa(null) }}
          />
        )}

        {avisoMesa && (
          <div className="ms-mesa-aviso" role="alert" ref={avisoRef}>
            <p><strong>{etiquetaDestino(destino)} ya tiene {avisoMesa.length === 1 ? 'un pedido' : `${avisoMesa.length} pedidos`} en curso.</strong> ¿Le sumas este pedido o es otra mesa?</p>
            <div>
              <button className="btn btn-primary" onClick={enviar}>Sumar a {etiquetaDestino(destino)}</button>
              <button className="btn btn-ghost" onClick={() => { setAvisoMesa(null); if (tipo === 'mesa') setMesa('') }}>Elegir otra</button>
            </div>
            <small>Se envía como una comanda nueva, al final de la fila de cocina.</small>
          </div>
        )}

        {estado === 'ajenos' && (
          <div className="ms-error" role="alert">
            <strong>⚠️ Quité productos que no son de {local.nombre}.</strong> Revisa la comanda y vuelve a enviar.
          </div>
        )}
        {estado === 'error' && (
          <div className="ms-error" role="alert">
            <strong>⚠️ No se envió.</strong> Revisa el internet y vuelve a intentar. La comanda sigue aquí.
          </div>
        )}

        {!avisoMesa && (
          <button className="ms-enviar" disabled={!destinoListo || estado === 'enviando'} onClick={intentarEnviar}>
            {estado === 'enviando' ? 'Enviando…' : estado === 'error' ? '↻ Reintentar envío' : destinoListo ? `Enviar a cocina · ${etiquetaDestino(destino)}` : 'Elige la mesa'}
          </button>
        )}
      </>
  )

  if (enLinea) return <section className="ms-hoja ms-hoja--linea" aria-label="Comanda">{cuerpo}</section>
  return (
    <div className="ms-velo" onClick={onCerrar}>
      <div className="ms-hoja" role="dialog" aria-modal="true" aria-label="Comanda" onClick={e => e.stopPropagation()}>{cuerpo}</div>
    </div>
  )
}

// ─────────────────────────────── En curso ───────────────────────────────

function EnCurso({ local, productos, api, activas, recientes, usuario, demo }) {
  const ahora = useAhora()
  const umbrales = umbralesDe(local)
  const colores = coloresComanda(local)
  const [cancelando, setCancelando] = useState(null)
  const [corrigiendo, setCorrigiendo] = useState(null)   // id de la comanda en corrección
  const [cuidadoCancelar, setCuidadoCancelar] = useState(null)
  const [guardada, setGuardada] = useState(false)
  const [totalCambio, setTotalCambio] = useState(null) // { pedido, total } tras corregir un pedido de la app (D34)
  const enCorreccion = corrigiendo ? activas.find(c => c.id === corrigiendo) : null

  // Agrupadas por mesa / nombre; dentro, por orden de llegada.
  const grupos = useMemo(() => {
    const m = new Map()
    for (const c of activas) {
      const k = claveMesa(c.destino) || `llevar:${c.id}`
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(c)
    }
    return [...m.values()]
  }, [activas])

  const entregadasHoy = recientes.filter(c => c.estado === 'entregada').slice(0, 8)

  // Cancelar una comanda que ya tiene algo hecho pasa por el CUIDADO (igual que corregir).
  function pedirCancelar(c) {
    if (c.items.some(it => it.hecho && !it.quitado)) setCuidadoCancelar(c)
    else setCancelando(c.id)
  }

  async function cancelar(c) {
    await api.cancelar(c, { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' })
    // Pedido de la app cancelado: el cliente lo ve como no atendido en «Mi pedido».
    if (c.pedidoId) pedidosDe(local.id, { demo }).cambiarEstado(c.pedidoId, 'rechazado').catch(() => {})
    setCancelando(null)
  }

  return (
    <div className="ms-curso" style={colores.vars}>
      {grupos.length === 0 && <p className="ms-vacio ms-vacio--grande">No hay pedidos en curso.</p>}
      {grupos.map(lista => (
        <section key={lista[0].id} className="ms-mesa">
          <h3 className={`ms-mesa-tit ${claseDestino(lista[0].destino)}`}>{etiquetaDestino(lista[0].destino)}</h3>
          {lista.map(c => {
            const vivos = c.items.filter(i => !i.quitado)
            const hechos = vivos.filter(i => i.hecho).length
            const seg = (ahora - (ms(c.creadaEn) || ahora)) / 1000
            const ultimo = c.cambios?.at(-1)
            const segCambio = c.cambiadaEn ? (ahora - ms(c.cambiadaEn)) / 1000 : 0
            return (
              <article key={c.id} className="ms-com">
                <div className="ms-com-cab">
                  <span className={`ms-reloj ${nivelTiempo(seg, umbrales)}`}>⏱ {minutosSeg(seg)}</span>
                  <span className="ms-com-prog">{hechos}/{vivos.length} listos</span>
                  {c.creadaPor?.nombre && <span className="ms-com-quien">La tomó {c.creadaPor.nombre.split(' ')[0]}</span>}
                </div>
                {/* ¿La cocina ya vio la corrección? (S18: lo que se está cocinando sin tachar no lo sabe el sistema) */}
                {c.cambioPendiente && (
                  <p className={`ms-cambio ${segCambio > 60 ? 'urgente' : ''}`}>
                    {segCambio > 60 ? '⚠️ La cocina no ha visto el cambio · ve a avisarle' : '⏳ Cocina aún no ha visto el cambio'}
                  </p>
                )}
                {!c.cambioPendiente && ultimo && (
                  <p className="ms-cambio visto">✓ Cocina vio el cambio · {ultimo.por?.nombre?.split(' ')[0] || 'alguien'} {ultimo.resumen}</p>
                )}
                <ul className="ms-com-items">
                  {vivos.map(it => (
                    <li key={it.uid} className={it.hecho ? 'hecho' : ''}>
                      <span>{it.hecho ? '✓' : '•'} {it.cantidad}× {it.nombre}</span>
                      {it.opciones && <small>{it.opciones}</small>}
                      {it.comentario && <em>💬 {it.comentario}</em>}
                    </li>
                  ))}
                </ul>
                {cancelando === c.id ? (
                  <div className="ms-cancelar-seguro">
                    <p>¿Cancelar la comanda de <strong>{etiquetaDestino(c.destino)}</strong>? La cocina la verá CANCELADA.</p>
                    <div>
                      <button className="btn ms-btn-peligro" onClick={() => cancelar(c)}>Sí, cancelar</button>
                      <button className="btn btn-ghost" onClick={() => setCancelando(null)}>No</button>
                    </div>
                  </div>
                ) : (
                  <div className="ms-com-acc">
                    <button className="ms-corregir" onClick={() => setCorrigiendo(c.id)}>✏️ Corregir</button>
                    <button className="ms-cancelar" onClick={() => pedirCancelar(c)}>Cancelar comanda</button>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      ))}

      {guardada && <div className="ms-toast" role="status">✓ Corrección enviada a cocina</div>}

      {enCorreccion && (
        <CorregirComanda
          comanda={enCorreccion} productos={productos} api={api} usuario={usuario}
          onCerrar={async ok => {
            const c = enCorreccion
            setCorrigiendo(null)
            if (!ok) return
            setGuardada(true); setTimeout(() => setGuardada(false), 3000)
            // Pedido de la app: el pedido queda igual que la comanda (el domiciliario cobra lo
            // correcto) y, si cambió el total, se ofrece avisarle al cliente (D34, S25).
            if (c?.pedidoId) {
              try {
                const fresca = await api.obtener(c.id)
                if (!fresca) return
                const r = await pedidosDe(local.id, { demo }).sincronizarConComanda(fresca)
                if (r && r.antes !== r.ahora) setTotalCambio({ pedido: r.pedido, total: r.ahora })
              } catch { /* el pedido se puede actualizar a mano; la comanda ya quedó */ }
            }
          }}
        />
      )}
      {/* Si la comanda deja de estar en curso mientras se corrige (la entregaron), se cierra sola. */}
      {corrigiendo && !enCorreccion && <CerrarSolo onCerrar={() => setCorrigiendo(null)} />}

      {totalCambio && (
        <div className="ms-velo" onClick={() => setTotalCambio(null)}>
          <div className="cc-cuidado" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <p className="cc-cuidado-tit">💲 EL TOTAL CAMBIÓ</p>
            <h3>Ahora es {'$' + Math.round(totalCambio.total).toLocaleString('es-CO')}</h3>
            <p>Avísale a {(totalCambio.pedido.cliente?.nombre || 'el cliente').split(' ')[0]} para que no haya sorpresas al pagar.</p>
            <button className="cc-ir" onClick={() => {
              const tel = normalizarTel(totalCambio.pedido.cliente?.telefono)
              if (tel) window.open(urlWhatsApp(tel, mensajeTotalCambio(local, totalCambio.pedido, totalCambio.total)), '_blank')
              setTotalCambio(null)
            }}>💬 Avisar por WhatsApp</button>
            <button className="cc-no" onClick={() => setTotalCambio(null)}>Ahora no</button>
          </div>
        </div>
      )}

      {cuidadoCancelar && (
        <Cuidado
          titulo={`${etiquetaDestino(cuidadoCancelar.destino)} ya tiene platos hechos`}
          onIr={() => { setCancelando(cuidadoCancelar.id); setCuidadoCancelar(null) }}
          onCancelar={() => setCuidadoCancelar(null)}
        />
      )}

      {entregadasHoy.length > 0 && (
        <>
          <h3 className="ms-sub">Entregadas hace poco</h3>
          <ul className="ms-entregadas">
            {entregadasHoy.map(c => (
              <li key={c.id}>
                <strong>{etiquetaDestino(c.destino)}</strong>
                <span>{itemsTxt(c.cantidadItems)} · {hora(c.entregadaEn)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function CerrarSolo({ onCerrar }) {
  useEffect(() => { onCerrar() }, [onCerrar])
  return null
}

// 🔔 Comandas de ESTE mesero que la cocina entregó y él todavía no ha visto.
// Lo «visto» se recuerda en el dispositivo para no avisar dos veces la misma.
function useListos(recientes, yo, localId) {
  const KEY = `appetic_mesero_vistos_${localId}`
  const [vistos, setVistos] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } })
  const desde = useRef(Date.now() - 30 * 60000) // solo avisos de la última media hora al abrir
  const pendientes = recientes.filter(c =>
    c.estado === 'entregada' && (c.creadaPor?.email === yo || c.origen === 'qr') && !vistos.includes(c.id)
    && (ms(c.entregadaEn) || Date.now()) >= desde.current)
  function marcarVistos() {
    const n = [...new Set([...vistos, ...pendientes.map(c => c.id)])].slice(-200)
    setVistos(n)
    try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* nada */ }
  }
  return { pendientes, marcarVistos }
}

// ─────────────────────────────── utilidades ───────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)
const normalizar = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
function precioDesde(p) {
  if (p.variantes?.length) return 'desde ' + cop(Math.min(...p.variantes.map(v => Number(v.precio) || 0)))
  return cop(p.precio)
}
function hora(t) {
  const m = ms(t)
  return m ? new Date(m).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : ''
}
function conTiempo(promesa, msMax) {
  return Promise.race([promesa, new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo')), msMax))])
}
