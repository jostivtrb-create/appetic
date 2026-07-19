import { useEffect, useState } from 'react'
import './InstallPrompt.css'
import logo from '../../assets/appetic-logo.png'

// ¿La app ya está instalada / abierta en modo standalone?
const yaInstalada = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

// 🔕 Al cerrarlo, no volver a molestar por un tiempo (para que no reaparezca
// en cada entrada). Se guarda la fecha en el dispositivo.
const SNOOZE_KEY = 'appetic_install_snooze'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000 // 14 días
const enSnooze = () => {
  try {
    const t = Number(localStorage.getItem(SNOOZE_KEY))
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
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (yaInstalada()) return // ya la tiene, no molestamos
    if (enSnooze()) return // la cerró hace poco: no reaparecer en cada entrada

    const ipad = esIOS()
    setIos(ipad)

    let timer

    // Android / Chrome de escritorio: el navegador nos avisa que es instalable.
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferred(e)
      timer = setTimeout(() => setVisible(true), 900)
    }
    // Si la instalan, escondemos el banner.
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // iOS no dispara 'beforeinstallprompt': mostramos las instrucciones a mano.
    if (ipad) {
      timer = setTimeout(() => setVisible(true), 1200)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      clearTimeout(timer)
    }
  }, [])

  const cerrar = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now())) } catch { /* nada */ }
    setCerrando(true)
    setTimeout(() => setVisible(false), 260)
  }

  const instalar = async () => {
    if (!deferred) return
    deferred.prompt()
    try {
      await deferred.userChoice
    } finally {
      setDeferred(null)
      setVisible(false)
    }
  }

  if (!visible) return null

  // iPhone en un navegador que no es Safari: no se puede instalar ahí.
  const iosFueraDeSafari = ios && !esSafari()

  return (
    <div className={`ip-wrap ${cerrando ? 'is-closing' : ''}`} role="dialog" aria-label="Instalar la app">
      <div className="ip-card">
        <button className="ip-close" onClick={cerrar} aria-label="Cerrar">
          <CloseIcon />
        </button>

        <div className="ip-icon">
          <img src={logo} alt="" />
        </div>

        {ios ? (
          <div className="ip-body">
            <strong className="ip-title">Instala la app</strong>
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
              <strong className="ip-title">Instala la app</strong>
              <span className="ip-text">Ábrela desde tu inicio, sin abrir el navegador.</span>
            </div>
            <button className="ip-cta" onClick={instalar}>Instalar</button>
          </>
        )}
      </div>
    </div>
  )
}
