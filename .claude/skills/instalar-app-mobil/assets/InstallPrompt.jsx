import { useState, useEffect } from 'react';
import './InstallPrompt.css';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showAndroid, setShowAndroid] = useState(false);
    const [showIos, setShowIos] = useState(false);

    useEffect(() => {
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        if (isStandalone) return;

        if (sessionStorage.getItem('pwa-install-dismissed')) return;

        const isIos = /ipad|iphone|ipod/i.test(navigator.userAgent);
        const isSafari =
            /safari/i.test(navigator.userAgent) &&
            !/chrome/i.test(navigator.userAgent);

        if (isIos && isSafari) {
            const timer = setTimeout(() => setShowIos(true), 3000);
            return () => clearTimeout(timer);
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowAndroid(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowAndroid(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowAndroid(false);
        setShowIos(false);
        sessionStorage.setItem('pwa-install-dismissed', '1');
    };

    const logoSrc = '/LOGO.png';
    const fallbackLogo = '/icon-192.png';

    if (showAndroid) {
        return (
            <div className="install-overlay fade-in" role="dialog" aria-modal="true">
                <div className="install-card slide-up">
                    <img src={logoSrc} alt="Logo" className="install-logo"
                        onError={(e) => { e.target.src = fallbackLogo; }} />
                    <h3 className="install-title">Instala nuestra App</h3>
                    <p className="install-desc">
                        Agrega la app a tu pantalla de inicio para acceder más rápido y sin navegador.
                    </p>
                    <button className="install-btn-primary" onClick={handleInstall}>Instalar App</button>
                    <button className="install-btn-secondary" onClick={handleDismiss}>Ahora no</button>
                </div>
            </div>
        );
    }

    if (showIos) {
        return (
            <div className="install-overlay fade-in" role="dialog" aria-modal="true">
                <div className="install-card slide-up">
                    <img src={logoSrc} alt="Logo" className="install-logo"
                        onError={(e) => { e.target.src = fallbackLogo; }} />
                    <h3 className="install-title">Instala nuestra App</h3>
                    <p className="install-desc">Sigue estos pasos en Safari:</p>
                    <ol className="install-steps">
                        <li className="install-step">
                            <span className="step-num">1</span>
                            <span className="step-text">
                                Toca el ícono <strong>Compartir</strong>{' '}
                                <span className="step-icon">⎙</span> en la barra inferior de Safari
                            </span>
                        </li>
                        <li className="install-step">
                            <span className="step-num">2</span>
                            <span className="step-text">
                                Desplázate y toca <strong>"Añadir a pantalla de inicio"</strong>{' '}
                                <span className="step-icon">＋</span>
                            </span>
                        </li>
                        <li className="install-step">
                            <span className="step-num">3</span>
                            <span className="step-text">Toca <strong>"Añadir"</strong> para confirmar</span>
                        </li>
                    </ol>
                    <button className="install-btn-secondary" onClick={handleDismiss}>Entendido</button>
                </div>
            </div>
        );
    }

    return null;
}
