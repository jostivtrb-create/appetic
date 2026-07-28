import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLocalBySlug } from '../../services/locales'
import { mensajeRespuestaCliente, urlWhatsApp } from '../../utils/whatsapp'

// 💬 /r/:slug/:tel/:codigo/:nombre — puente para que el LOCAL le responda al cliente.
//
// Existe para que el link dentro del WhatsApp del pedido sea CORTO. Antes llevaba el
// mensaje completo codificado en la URL y salía un muro de ~450 caracteres en el chat;
// ahora son ~58 y el texto se arma aquí (ver linkRespuestaCliente en utils/whatsapp).
//
// Todo viaja en el path porque el dueño NO puede leer los pedidos según firestore.rules,
// y abrirlos al público expondría teléfono y dirección del cliente. Lo único que se
// consulta es el local por su slug, que ya es de lectura pública.
export default function Responder() {
  const { slug, tel, codigo, nombre } = useParams()
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [url, setUrl] = useState('')
  const yaAbrio = useRef(false) // StrictMode monta dos veces en DEV: no abrir WhatsApp dos veces

  useEffect(() => {
    let activo = true
    getLocalBySlug(slug)
      .then(local => {
        if (!activo) return
        if (!local) { setEstado('error'); return }
        // '-' es el marcador de "no vino el dato" que pone linkRespuestaCliente.
        const pedido = {
          codigo: codigo === '-' ? '' : codigo,
          cliente: { nombre: nombre === '-' ? '' : nombre },
        }
        const destino = urlWhatsApp(tel, mensajeRespuestaCliente(local, pedido))
        setUrl(destino)
        setEstado('listo')
        if (!yaAbrio.current) {
          yaAbrio.current = true
          // replace y no href: al volver atrás no se vuelve a disparar el puente.
          window.location.replace(destino)
        }
      })
      .catch(() => { if (activo) setEstado('error') })
    return () => { activo = false }
  }, [slug, tel, codigo, nombre])

  if (estado === 'error') {
    return (
      <div className="local-msg">
        <div className="local-msg-emoji">🤔</div>
        <h2>No encontramos el local</h2>
        <p>Puedes escribirle al cliente directamente:</p>
        <a className="btn btn-primary" href={`https://wa.me/${tel}`}>Abrir WhatsApp</a>
      </div>
    )
  }

  // Los deep links a veces no disparan solos (navegador in-app de WhatsApp, bloqueo
  // de pop-ups): siempre dejamos el botón a la vista para que el dueño no se quede varado.
  return (
    <div className="local-msg">
      <div className="local-msg-emoji">💬</div>
      <h2>Abriendo WhatsApp…</h2>
      <p>Te llevamos al chat con el cliente y el mensaje listo para enviar.</p>
      {estado === 'listo'
        ? <a className="btn btn-primary" href={url}>Abrir WhatsApp</a>
        : <div className="local-spinner" />}
    </div>
  )
}
