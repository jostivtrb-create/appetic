import './LogoManchon.css'

// 🎨 Hero "manchón pintado" (Jasbury), en bucle:
// el LOGO COMPLETO se PINTA con un trazo GRUESO en ZIGZAG (de ida y vuelta, como
// la brocha) que termina cubriéndolo TODO → un DESTELLO barre el logo → reposo
// largo → se despinta y reinicia. Una sola capa. Respeta prefers-reduced-motion.
//
// El trazo va de lado a lado bajando (boustrophedon). Grueso = sin huecos al final.
const ZIG_D = 'M-15,6 L163,24 L-15,42 L163,60 L-15,78 L163,94'

export default function LogoManchon({ manchon, alt = '', className = '' }) {
  // El destello se recorta a la forma del logo usándolo como máscara (alpha).
  const shineMask = manchon
    ? { WebkitMaskImage: `url(${manchon})`, maskImage: `url(${manchon})` }
    : undefined
  return (
    <div className={`logo-manchon ${className}`} role="img" aria-label={alt}>
      <img className="logo-manchon-sizer" src={manchon} alt="" aria-hidden="true" />
      <svg className="logo-manchon-blob" viewBox="0 0 148 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <mask id="lm-zig" maskUnits="userSpaceOnUse" x="0" y="0" width="148" height="100">
            <path
              className="logo-manchon-zig"
              d={ZIG_D}
              pathLength="1"
              fill="none"
              stroke="#fff"
              strokeWidth="42"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>
        <image href={manchon} x="0" y="0" width="148" height="100" preserveAspectRatio="none" mask="url(#lm-zig)" />
      </svg>
      <span className="logo-manchon-shine" style={shineMask} aria-hidden="true" />
    </div>
  )
}
