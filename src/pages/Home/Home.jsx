import logo from '../../assets/appetic-logo.png'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      {/* Brillos de fondo */}
      <div className="home-glow home-glow-1" />
      <div className="home-glow home-glow-2" />

      <main className="home-content">
        <div className="home-logo-wrap">
          <img className="home-logo" src={logo} alt="Appetic" />
        </div>

        <h1 className="home-title">Appetic</h1>
        <p className="home-tagline">El menú de tu barrio,<br />en un solo toque.</p>

        <div className="home-card">
          <p className="home-card-text">
            Llegaste a Appetic. Para ver un menú, entra con el
            <strong> link del negocio</strong> que quieres pedir.
          </p>
          <span className="home-soon">Pronto: descubre todos los locales del barrio 🍔</span>
        </div>
      </main>

      <footer className="home-footer">
        Hecho con 🧡 en Bogotá · <span>Appetic</span>
      </footer>
    </div>
  )
}
