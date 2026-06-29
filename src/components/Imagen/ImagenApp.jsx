import { useState } from 'react'
import placeholder from '../../assets/placeholder.webp'
import './ImagenApp.css'

// 🖼️ Imagen con placeholder de marca ("Cargando imagen…").
// - Si NO hay imagen del cliente → muestra el placeholder.
// - Mientras la imagen real CARGA → muestra el placeholder de fondo y la real
//   aparece con un fundido al terminar.
// - Si la imagen falla → se queda el placeholder.
// El tamaño/borde lo da la clase que se le pase (ocupa el 100% de su contenedor).
export default function ImagenApp({ src, alt = '', className = '' }) {
  const [cargada, setCargada] = useState(false)
  const [error, setError] = useState(false)
  const usarReal = Boolean(src) && !error

  return (
    <span className={`imgapp ${className}`}>
      {(!usarReal || !cargada) && (
        <img className="imgapp-ph" src={placeholder} alt="" aria-hidden="true" />
      )}
      {usarReal && (
        <img
          className={`imgapp-real ${cargada ? 'on' : ''}`}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setCargada(true)}
          onError={() => setError(true)}
        />
      )}
    </span>
  )
}
