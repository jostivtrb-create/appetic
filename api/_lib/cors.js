// 🌐 CORS de las funciones que llama la propuesta web de Appetic (switflysolutions.com/appetic, página
// estática en Hostinger): /api/solicitud y /api/solicitud-archivo. Las dos aceptan EXACTAMENTE los
// mismos orígenes —la web de Swiftfly y localhost para probar—; cualquier otro no se atiende (403).

const ORIGENES_WEB = ['https://switflysolutions.com', 'https://www.switflysolutions.com']

// ¿Desde dónde llaman? La web de Swiftfly, o localhost/127.0.0.1 con cualquier puerto.
export function origenPermitido(origin) {
  const o = String(origin || '')
  return ORIGENES_WEB.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o)
}

// Cabeceras CORS para ese origen (solo POST + OPTIONS, un día de caché del preflight).
export function cors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Vary', 'Origin')
}
