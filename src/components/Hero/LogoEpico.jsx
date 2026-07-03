import './LogoEpico.css'

// 🎬 Entrada épica del logo: la imagen se parte en TRES bloques horizontales
// (arriba, medio, abajo) y cada uno CAE con golpe de aterrizaje, uno tras otro
// —"pum… pum… pum"—. Es solo visual: los tres bloques son la misma imagen
// recortada a su tercio, así que al terminar quedan alineados formando el logo
// completo, idéntico al original.
//
// - Un "sizer" invisible da el tamaño real y el texto para lectores de pantalla.
// - Respeta `prefers-reduced-motion` (aparece sin brincos).
// - Se activa/desactiva desde el panel (Configuración → Animación del logo).
export default function LogoEpico({ src, alt = '', className = '', direccion = 'arriba' }) {
  const dir = direccion === 'lado' ? 'lado' : 'arriba'
  return (
    <div className={`logo-epico logo-epico--${dir} ${className}`} role="img" aria-label={alt}>
      <img className="logo-epico-sizer" src={src} alt={alt} />
      <img className="logo-epico-band lb1" src={src} alt="" aria-hidden="true" />
      <img className="logo-epico-band lb2" src={src} alt="" aria-hidden="true" />
      <img className="logo-epico-band lb3" src={src} alt="" aria-hidden="true" />
    </div>
  )
}
