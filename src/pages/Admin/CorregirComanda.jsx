import { useMemo, useState } from 'react'
import { precioUnitario, tieneOpciones } from '../../utils/price'
import { resumenSeleccion } from '../../utils/selectionSummary'
import { etiquetaDestino, CuidadoError } from '../../services/comandas'
import ProductModal from '../../components/Menu/ProductModal'
import ProductWizard from '../../components/Menu/ProductWizard'
import { Teclado } from './Teclado'

// ✏️ CORREGIR UNA COMANDA YA ENVIADA (guía «Mesero y Comandas», paso 2 · D21–D27).
//
// El mesero puede: quitar un plato · cambiar sus opciones · cambiar el comentario · cambiar la mesa.
// Lo que todavía NO se tachó se cambia directo. Si toca algo que la cocina YA tachó (o la mesa
// cuando algo ya salió) sale el CUIDADO: «Ya voy a cocina» (deja cambiar, y ese plato vuelve a la
// fila) o «Cancelar el cambio». Nada se guarda hasta «Guardar corrección»; al guardar se relee la
// comanda (transacción) y, si mientras tanto la cocina tachó algo que se tocó, sale el CUIDADO.
export default function CorregirComanda({ comanda, productos, api, usuario, onCerrar }) {
  const [cambios, setCambios] = useState({})             // { uid: { quitar | seleccion, opciones, precio | comentario } }
  const [confirmados, setConfirmados] = useState(() => new Set()) // tachados con «Ya voy a cocina»
  const [destino, setDestino] = useState(null)           // nuevo destino (null = sin cambio)
  const [confirmaDestino, setConfirmaDestino] = useState(false)
  const [editandoMesa, setEditandoMesa] = useState(false)
  const [cuidado, setCuidado] = useState(null)           // { titulo, alConfirmar }
  const [opcionesDe, setOpcionesDe] = useState(null)     // ítem cuyo modal de opciones está abierto
  const [estado, setEstado] = useState('')               // '' | guardando | error | cerrada | ultimo
  const porId = useMemo(() => new Map(productos.map(p => [p.id, p])), [productos])
  const por = { email: (usuario?.email || '').toLowerCase(), nombre: usuario?.displayName || '' }

  const vivos = comanda.items.filter(it => !it.quitado)
  const algoHecho = vivos.some(it => it.hecho)
  const hayCambios = Object.keys(cambios).length > 0 || !!destino

  // Cualquier acción sobre un ítem tachado pasa primero por el CUIDADO.
  function conCuidado(it, accion) {
    if (!it.hecho || confirmados.has(it.uid)) { accion(); return }
    setCuidado({
      titulo: `«${it.nombre}» ya se realizó`,
      alConfirmar: () => { setConfirmados(s => new Set([...s, it.uid])); accion() },
    })
  }
  const cambiar = (uid, c) => setCambios(m => ({ ...m, [uid]: { ...(m[uid] || {}), ...c } }))
  const deshacer = uid => setCambios(m => { const n = { ...m }; delete n[uid]; return n })

  function abrirMesa() {
    if (!algoHecho || confirmaDestino) { setEditandoMesa(true); return }
    setCuidado({ titulo: 'Esta comanda ya tiene platos hechos', alConfirmar: () => { setConfirmaDestino(true); setEditandoMesa(true) } })
  }

  async function guardar(extra = {}) {
    setEstado('guardando')
    const correccion = {
      items: cambios,
      destino: destino || undefined,
      confirmados: [...confirmados, ...(extra.confirmados || [])],
      confirmaDestino: confirmaDestino || !!extra.confirmaDestino,
    }
    try {
      await api.corregir(comanda.id, correccion, por)
      onCerrar(true)
    } catch (e) {
      if (e instanceof CuidadoError) {
        // La cocina tachó algo mientras el mesero corregía.
        setEstado('')
        setCuidado({
          titulo: 'La cocina acaba de hacer parte de lo que estás cambiando',
          alConfirmar: () => guardar({ confirmados: e.uids, confirmaDestino: e.destino }),
        })
        return
      }
      setEstado(e?.message === 'cerrada' ? 'cerrada' : e?.message === 'ultimo' ? 'ultimo' : 'error')
    }
  }

  // Opciones nuevas desde el MISMO modal del cliente, abierto con lo que ya tenía.
  function guardarOpciones({ producto, seleccion, notas }) {
    const it = opcionesDe
    cambiar(it.uid, {
      seleccion,
      opciones: resumenSeleccion(producto, seleccion) || '',
      precio: precioUnitario(producto, seleccion) * (it.cantidad || 1),
      comentario: notas || '',
    })
    setOpcionesDe(null)
  }

  const productoDe = opcionesDe ? porId.get(opcionesDe.productoId) : null

  return (
    <div className="ms-velo" onClick={() => onCerrar(false)}>
      <div className="ms-hoja" role="dialog" aria-modal="true" aria-label="Corregir comanda" onClick={e => e.stopPropagation()}>
        <header className="ms-hoja-cab">
          <div>
            <h2>Corregir · {etiquetaDestino(destino || comanda.destino)}</h2>
            {comanda.creadaPor?.nombre && <p className="cc-tomo">La tomó {comanda.creadaPor.nombre}</p>}
          </div>
          <button className="ms-x" onClick={() => onCerrar(false)} aria-label="Cerrar sin guardar">✕</button>
        </header>

        <ul className="ms-items">
          {vivos.map(it => {
            const c = cambios[it.uid] || {}
            const prod = porId.get(it.productoId)
            const conOpciones = prod && tieneOpciones(prod)
            const comentario = 'comentario' in c ? c.comentario : (it.comentario || '')
            const opciones = 'opciones' in c ? c.opciones : it.opciones
            return (
              <li key={it.uid} className={`ms-item cc-item ${c.quitar ? 'cc-quitado' : ''} ${Object.keys(c).length ? 'cc-cambiado' : ''}`}>
                <div className="ms-item-fila">
                  <div className="ms-item-txt">
                    <span className="ms-item-nombre">{it.cantidad}× {it.nombre}</span>
                    {opciones && <span className="ms-item-op">{opciones}</span>}
                  </div>
                  {it.hecho && <span className="cc-hecho">✓ Ya salió</span>}
                </div>

                {c.quitar ? (
                  <div className="cc-acciones">
                    <span className="cc-se-quita">Se quitará de la comanda</span>
                    <button onClick={() => deshacer(it.uid)}>Deshacer</button>
                  </div>
                ) : (
                  <>
                    <input
                      className="ms-item-com" placeholder="💬 Comentario para cocina" maxLength={140}
                      value={comentario}
                      onFocus={e => { if (it.hecho && !confirmados.has(it.uid)) { e.target.blur(); conCuidado(it, () => {}) } }}
                      onChange={e => cambiar(it.uid, { comentario: e.target.value })}
                    />
                    <div className="cc-acciones">
                      {conOpciones && <button onClick={() => conCuidado(it, () => setOpcionesDe(it))}>Cambiar opciones</button>}
                      <button className="cc-quitar" onClick={() => conCuidado(it, () => cambiar(it.uid, { quitar: true }))}>Quitar</button>
                      {Object.keys(c).length > 0 && <button onClick={() => deshacer(it.uid)}>Deshacer</button>}
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>

        <h3 className="ms-sub">Mesa</h3>
        {!editandoMesa ? (
          <button className="cc-mesa" onClick={abrirMesa}>
            {etiquetaDestino(destino || comanda.destino)} <span>· Cambiar</span>
          </button>
        ) : (
          <SelectorDestino inicial={comanda.destino} onCambio={setDestino} />
        )}

        {estado === 'error' && <div className="ms-error" role="alert"><strong>⚠️ No se guardó.</strong> Revisa el internet y vuelve a intentar.</div>}
        {estado === 'cerrada' && <div className="ms-error" role="alert"><strong>Esta comanda ya se entregó o se canceló.</strong> Si hay que rehacer algo, manda una comanda nueva.</div>}
        {estado === 'ultimo' && <div className="ms-error" role="alert"><strong>No puedes quitar todos los platos.</strong> Para eso usa «Cancelar comanda».</div>}

        <button className="ms-enviar" disabled={!hayCambios || estado === 'guardando' || estado === 'cerrada'} onClick={() => guardar()}>
          {estado === 'guardando' ? 'Guardando…' : hayCambios ? 'Guardar corrección y avisar a cocina' : 'Sin cambios'}
        </button>

        {cuidado && (
          <Cuidado
            titulo={cuidado.titulo}
            onIr={() => { const f = cuidado.alConfirmar; setCuidado(null); f() }}
            onCancelar={() => setCuidado(null)}
          />
        )}

        {opcionesDe && productoDe && (productoDe.modo === 'pasos'
          ? <ProductWizard producto={productoDe} inicial={{ seleccion: opcionesDe.seleccion, notas: cambios[opcionesDe.uid]?.comentario ?? opcionesDe.comentario }} textoBoton="Guardar cambio" onCerrar={() => setOpcionesDe(null)} onAgregar={guardarOpciones} />
          : <ProductModal producto={productoDe} compacto sinCantidad textoNotas="Comentario para cocina" textoBoton="Guardar cambio" inicial={{ seleccion: opcionesDe.seleccion, notas: cambios[opcionesDe.uid]?.comentario ?? opcionesDe.comentario }} onCerrar={() => setOpcionesDe(null)} onAgregar={guardarOpciones} />)}
      </div>
    </div>
  )
}

// ⚠️ El CUIDADO grande: el plato ya se hizo, hay que ir a cocina.
export function Cuidado({ titulo, onIr, onCancelar }) {
  return (
    <div className="cc-cuidado-velo" onClick={onCancelar}>
      <div className="cc-cuidado" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <p className="cc-cuidado-tit">⚠️ CUIDADO</p>
        <h3>{titulo}</h3>
        <p>Ve a cocina para arreglarlo antes de cambiarlo aquí.</p>
        <button className="cc-ir" onClick={onIr}>Ya voy a cocina · hacer el cambio</button>
        <button className="cc-no" onClick={onCancelar}>No se puede · cancelar el cambio</button>
      </div>
    </div>
  )
}

// Mesa por teclado / otro nombre / para llevar (igual que al tomar el pedido).
function SelectorDestino({ inicial, onCambio }) {
  const [tipo, setTipo] = useState(inicial?.tipo === 'llevar' ? 'llevar' : inicial?.mesa ? 'mesa' : 'nombre')
  const [mesa, setMesa] = useState(inicial?.mesa || '')
  const [nombre, setNombre] = useState(inicial?.nombre || '')
  const emitir = (t, m, n) => {
    if (t === 'llevar') onCambio({ tipo: 'llevar', mesa: null, nombre: n.trim() || null })
    else if (t === 'nombre') onCambio(n.trim() ? { tipo: 'mesa', mesa: null, nombre: n.trim() } : null)
    else onCambio(m ? { tipo: 'mesa', mesa: m, nombre: null } : null)
  }
  return (
    <>
      <div className="ms-tipo" role="radiogroup">
        {[['mesa', '🪑 Mesa'], ['nombre', '✏️ Otro nombre'], ['llevar', '🥡 Para llevar']].map(([v, t]) => (
          <button key={v} role="radio" aria-checked={tipo === v} className={tipo === v ? 'on' : ''} onClick={() => { setTipo(v); emitir(v, mesa, nombre) }}>{t}</button>
        ))}
      </div>
      {tipo === 'mesa'
        ? <Teclado valor={mesa} onCambio={v => { setMesa(v); emitir('mesa', v, nombre) }} />
        : <input className="ms-nombre" maxLength={30} placeholder={tipo === 'llevar' ? 'Nombre del cliente (opcional)' : 'Ej: Barra, Terraza'}
            value={nombre} onChange={e => { setNombre(e.target.value); emitir(tipo, mesa, e.target.value) }} />}
    </>
  )
}

