import { useEffect, useState } from 'react'
import LogoEpico from '../../components/Hero/LogoEpico'
import LogoManchon from '../../components/Hero/LogoManchon'
import { localThemeVars } from '../../utils/theme'
import { LOGO_ANIMS } from '../../utils/logoAnim'

// 👀 Muestra de la animación del logo (Configuración → Apariencia).
// Pinta la MISMA cabecera del menú del local —su piel, sus colores y su logo— con los mismos
// componentes de animación, así lo que se ve aquí es lo que verá el cliente. Se repite sola al
// cambiar de animación y con «Ver otra vez».
export default function MuestraLogo({ local, anim }) {
  const [vuelta, setVuelta] = useState(0)
  useEffect(() => { setVuelta(v => v + 1) }, [anim])
  const skin = String(local.tema?.skin || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!local.logo) return null
  return (
    <div className="ml">
      <div className="ml-cab">
        <span>Así se ve: <b>{LOGO_ANIMS.find(o => o.id === anim)?.label || anim}</b></span>
        <button type="button" onClick={() => setVuelta(v => v + 1)}>↻ Ver otra vez</button>
      </div>
      <div className={`local-page ml-pagina ${skin ? `local-skin-${skin}` : ''}`} style={localThemeVars(local.tema)}>
        <header className="local-hero local-hero--logo ml-hero">
          <div className="local-hero-content local-hero-content--logo" key={vuelta}>
            {anim === 'manchon'
              ? <LogoManchon manchon={local.logo} texto={local.logoTexto} alt={local.nombre} />
              : anim === 'ninguna'
                ? <img className="local-logo-full" src={local.logo} alt={local.nombre} />
                : <LogoEpico src={local.logo} alt={local.nombre} direccion={anim} />}
            {local.descripcion && <p className="local-desc local-desc--ink">{local.descripcion}</p>}
          </div>
        </header>
      </div>
    </div>
  )
}
