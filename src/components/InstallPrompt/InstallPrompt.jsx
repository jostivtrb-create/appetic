import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavUI } from '../../contexts/NavUIContext.jsx'
import { alAvisoDeInstalar, avisoUsado, slugDeRuta } from '../../utils/instalacion.js'
import './InstallPrompt.css'
import logo from '../../assets/appetic-logo.png'

// ¿La app ya está instalada / abierta en modo standalone?
const yaInstalada = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

// 🔕 Al cerrarlo, no volver a molestar por un tiempo (para que no reaparezca
// en cada entrada). Se guarda la fecha en el dispositivo, aparte para Appetic y
// para cada local (quien cerró el de Appetic aún puede querer la app de su local).
const SNOOZE_KEY = 'appetic_install_snooze'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000 // 14 días
const clave = (slug) => (slug ? `${SNOOZE_KEY}_${slug}` : SNOOZE_KEY)
// Y si lo cerró, tampoco vuelve a salir en esta visita aunque cambie de local.
let cerradoEstaVisita = false
const enSnooze = (slug) => {
  if (cerradoEstaVisita) return true
  try {
    const t = Number(localStorage.getItem(clave(slug)))
    return Boolean(t) && (Date.now() - t) < SNOOZE_MS
  } catch { return false }
}

// ¿Es un iPhone / iPad? (iPadOS 13+ se hace pasar por Mac, lo detectamos por el táctil)
const esIOS = () => {
  const ua = window.navigator.userAgent || ''
  const iphone = /iphone|ipad|ipod/i.test(ua)
  const ipad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iphone || ipad
}

// En iOS solo se puede instalar desde Safari (Chrome/Firefox de iOS no pueden).
const esSafari = () => {
  const ua = window.navigator.userAgent || ''
  return /safari/i.test(ua) && !/crios|fxios|edgios|android/i.test(ua)
}

// Ícono de "Compartir" de iOS (cuadro con flecha hacia arriba).
function ShareIcon() {
  return (
    <svg className="ip-share" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M6 11v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

// X bonita (trazo redondeado), nada genérica.
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7 17 17M17 7 7 17" />
    </svg>
  )
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [deferred, setDeferred] = useState(null)
  const [ios] = useState(esIOS)
  // 📲 En el link de un local se instala ESE local (su manifest: api/manifest.js), así que el
  // aviso sale con su ícono y su nombre.
  const { pathname } = useLocation()
  const { activeLocal } = useNavUI()
  const slug = slugDeRuta(pathname)
  const nombre = activeLocal?.slug === slug ? activeLocal.nombre : ''

  useEffect(() => {
    setVisible(false)
    setCerrando(false)
    if (yaInstalada()) return // ya la tiene, no molestamos
    if (enSnooze(slug)) return // la cerró hace poco: no reaparecer en cada entrada

    let timer
    // Android / Chrome de escritorio: el navegador nos avisa que es instalable (el aviso se
    // guarda desde el arranque en utils/instalacion.js). Si la instalan, llega null.
    const dejar = alAvisoDeInstalar((e) => {
      setDeferred(e)
      clearTimeout(timer)
      if (e) timer = setTimeout(() => setVisible(true), 900)
      else setVisible(false)
    })
    // iOS no dispara 'beforeinstallprompt': mostramos las instrucciones a mano.
    if (ios) timer = setTimeout(() => setVisible(true), 1200)

    return () => { dejar(); clearTimeout(timer) }
  }, [slug, ios])

  const cerrar = () => {
    cerradoEstaVisita = true
    try { localStorage.setItem(clave(slug), String(Date.now())) } catch { /* nada */ }
    setCerrando(true)
    setTimeout(() => setVisible(false), 260)
  }

  const instalar = async () => {
    if (!deferred) return
    try {
      await deferred.prompt()
      await deferred.userChoice
    } catch (e) {
      console.error('[instalar]', e)
    } finally {
      avisoUsado()
      setDeferred(null)
      setVisible(false)
    }
  }

  if (!visible) return null

  // iPhone en un navegador que no es Safari: no se puede instalar ahí.
  const iosFueraDeSafari = ios && !esSafari()
  const titulo = nombre ? `Instala ${nombre}` : 'Instala la app'

  return (
    <div className={`ip-wrap ${cerrando ? 'is-closing' : ''}`} role="dialog" aria-label="Instalar la app">
      <div className="ip-card">
        <button className="ip-close" onClick={cerrar} aria-label="Cerrar">
          <CloseIcon />
        </button>

        <div className="ip-icon">
          <img
            key={slug}
            className={slug ? 'ip-icon-local' : undefined}
            src={slug ? `/api/icono?slug=${slug}&t=192&p=apple` : logo}
            onError={(e) => { if (!e.currentTarget.src.endsWith(logo)) e.currentTarget.src = logo }}
            alt=""
          />
        </div>

        {ios ? (
          <div className="ip-body">
            <strong className="ip-title">{titulo}</strong>
            {iosFueraDeSafari ? (
              <span className="ip-text">
                Ábrela en <b>Safari</b> y toca <ShareIcon /> para instalarla.
              </span>
            ) : (
              <span className="ip-text">
                Toca <ShareIcon /> y luego <b>«Añadir a pantalla de inicio»</b>.
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="ip-body">
              <strong className="ip-title">{titulo}</strong>
              <span className="ip-text">Ábrela desde tu inicio, sin abrir el navegador.</span>
            </div>
            <button className="ip-cta" onClick={instalar}>Instalar</button>
          </>
        )}
      </div>
    </div>
  )
}
