import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { tiene } from '../../utils/plan'
import { pruebaDe } from '../../utils/impresora/documento'
import { soporta, prefsDe, guardarPrefs, conectar, reconectar, desconectar, conectada, imprimir, motivoImpresora } from '../../utils/impresora/conexion'
import './Caja.css'
import './Impresora.css'

// 🖨️ La impresora de ESTE aparato (guía «Mejoras frente a Loggro» D6 y S8). La prende el dueño en
// Configuración → Impresora; cada aparato (la tablet de la cocina, el PC de la caja) conecta la suya
// aquí. `uso`: 'cocina' (comandas que salen solas) o 'caja' (ticket al cobrar).

// Un aviso para que todas las pantallas se enteren cuando cambia la conexión.
const oyentes = new Set()
const avisar = () => oyentes.forEach(f => f())
const suscribir = f => { oyentes.add(f); return () => oyentes.delete(f) }

export const impresionActiva = local => !!local?.impresion?.activa && tiene(local, 'impresora')
const anchoDe = local => local?.impresion?.ancho || 58

// Estado de la impresora para una pantalla: reconecta sola al entrar y deja imprimir.
export function useImpresora(local, uso) {
  const activa = impresionActiva(local) && (uso === 'cocina' ? local.impresion.comandas !== false : local.impresion.ticket !== false)
  const conexion = useSyncExternalStore(suscribir, conectada)
  const [prefs, setPrefsLocal] = useState(() => prefsDe(local.id))
  useEffect(() => {
    if (!activa || !prefs.metodo || conectada()) return
    reconectar(prefs.metodo).then(c => { if (c) avisar() })
  }, [activa, prefs.metodo])
  const setPrefs = useCallback(p => { guardarPrefs(local.id, p); setPrefsLocal(p) }, [local.id])
  // Igual que la casilla de la hoja: sin decidir todavía cuenta como «sí».
  const auto = activa && !!conexion?.enviar && (uso === 'cocina' ? prefs.autoComandas : prefs.autoTicket) !== false
  // `ventana` solo hace falta para el «Imprimir del navegador» (abrirla en el toque).
  const imprimirDoc = useCallback(async (doc, opciones) => {
    try { return await imprimir(doc, anchoDe(local), opciones) } finally { avisar() }
  }, [local])
  return { activa, conexion, prefs, setPrefs, auto, imprimir: imprimirDoc }
}

// Abre la ventana del navegador en el toque si hará falta (sin impresora directa).
export const ventanaSiHaceFalta = () => (conectada()?.enviar ? null : window.open('', '_blank', 'width=420,height=640'))

const METODOS = [
  { id: 'usb', ico: '🔌', t: 'Cable USB', d: 'Chrome en Android (con cable OTG) o en el PC.' },
  { id: 'bluetooth', ico: '📶', t: 'Bluetooth', d: 'Impresoras Bluetooth «BLE», desde Chrome.' },
  { id: 'serial', ico: '🧵', t: 'Cable (puerto serie)', d: 'Chrome en el PC. También Bluetooth ya emparejado.' },
  { id: 'navegador', ico: '🖨️', t: 'Imprimir del navegador', d: 'Cualquier impresora instalada. Muestra la ventana de imprimir; no es automático.' },
]

export default function ImpresoraBoton({ local, uso, impresora, estilo }) {
  const { activa, conexion, prefs, setPrefs } = impresora
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const sop = soporta()
  if (!activa) return null
  const directa = !!conexion?.enviar
  const clave = uso === 'cocina' ? 'autoComandas' : 'autoTicket'

  async function elegir(metodo) {
    setError(''); setEstado(metodo)
    try {
      const c = await conectar(metodo)
      setPrefs({ ...prefs, metodo, nombre: c.nombre, [clave]: metodo === 'navegador' ? false : (prefs[clave] ?? true) })
      avisar()
    } catch (e) { setError(motivoImpresora(e)) } finally { setEstado('') }
  }
  async function probar() {
    setError(''); setEstado('prueba')
    const ventana = directa ? null : window.open('', '_blank', 'width=420,height=640')
    try { await imprimir(pruebaDe(local), anchoDe(local), { ventana }); avisar() }
    catch (e) { setError(motivoImpresora(e)); avisar() } finally { setEstado('') }
  }
  function olvidar() { desconectar(); setPrefs({}); avisar() }

  return (
    <>
      <button type="button" className={`imp-boton${directa || conexion?.metodo === 'navegador' ? ' ok' : prefs.metodo ? ' falta' : ''}`} onClick={() => setAbierto(true)}
        aria-label="Impresora" title={directa ? `Impresora: ${conexion.nombre}` : 'Conectar la impresora'}>
        🖨️<i aria-hidden="true" />
      </button>
      {/* En el body: dentro de la cabecera de la Caja heredaba sus estilos (.pv-caja > div). */}
      {abierto && createPortal(
        <div className="pv-hoja-fondo centro" style={estilo} onClick={() => setAbierto(false)}>
          <div className="pv-hoja imp-hoja" role="dialog" aria-modal="true" aria-label="Impresora" onClick={e => e.stopPropagation()}>
            <button type="button" className="pv-hoja-x" aria-label="Cerrar" onClick={() => setAbierto(false)}>✕</button>
            <h2>🖨️ Impresora de este aparato</h2>
            <p className="pv-nota">{uso === 'cocina' ? 'Para que las comandas salgan en papel en la cocina.' : 'Para imprimir el ticket del cliente al cobrar.'} Se recuerda en este aparato.</p>

            <div className={`imp-estado${directa ? ' ok' : ''}`}>
              {directa ? <>✅ Conectada: <b>{conexion.nombre}</b></>
                : conexion?.metodo === 'navegador' ? <>🖨️ Con el «Imprimir» del navegador</>
                  : prefs.metodo ? <>⚠️ <b>{prefs.nombre || 'La impresora'}</b> no está conectada. Toca su forma de conexión para reconectarla.</>
                    : <>Ninguna impresora todavía.</>}
            </div>

            <div className="imp-metodos">
              {METODOS.filter(m => m.id === 'navegador' || sop[m.id]).map(m => (
                <button type="button" key={m.id} className={`imp-metodo${conexion?.metodo === m.id ? ' on' : ''}`} disabled={!!estado} onClick={() => elegir(m.id)}>
                  <span aria-hidden="true">{m.ico}</span>
                  <span><b>{estado === m.id ? 'Conectando…' : m.t}</b><small>{m.d}</small></span>
                </button>
              ))}
            </div>
            {!sop.usb && !sop.bluetooth && !sop.serial && (
              <p className="pv-nota">Este navegador no se conecta directo a impresoras: usa Chrome (Android o PC) para que imprima solo.</p>
            )}

            {directa && (
              <label className="imp-auto">
                <input type="checkbox" checked={prefs[clave] !== false} onChange={e => setPrefs({ ...prefs, [clave]: e.target.checked })} />
                <span>{uso === 'cocina' ? 'Imprimir solas las comandas nuevas (y las que cambian)' : 'Imprimir el ticket solo al cobrar'}<small>{uso === 'cocina' ? 'Préndelo en UN solo aparato de la cocina, o saldrán repetidas.' : 'Si lo apagas, el ticket se imprime desde Ventas cuando lo pidan.'}</small></span>
              </label>
            )}

            <div className="pv-eliminar-acc">
              {prefs.metodo && <button type="button" className="pv-link" onClick={olvidar}>Olvidar esta impresora</button>}
              <button type="button" className="pv-mandar" disabled={!!estado || !conexion} onClick={probar}>{estado === 'prueba' ? 'Imprimiendo…' : 'Imprimir prueba'}</button>
            </div>
            {error && <p className="pv-error" role="alert">⚠️ {error}</p>}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
