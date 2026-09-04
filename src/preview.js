// 👀 Vista previa EN VIVO de un local, sin base de datos.
//
// Permite abrir un menú en producción agregando ?preview=1 al link
// (ej. https://tu-dominio/perros-criollos?preview=1). El menú se arma desde el
// código, NO desde Firebase: sirve para revisar el diseño en el celular antes de
// "sembrar" el local de verdad. En modo preview NO se reciben pedidos reales ni
// se registran visitas.
//
// Cuando el local ya está sembrado en Firebase, el link normal (sin ?preview)
// carga los datos reales y este modo deja de hacer falta.
export async function getPreviewLocal(slug) {
  if (slug === 'perros-criollos') {
    const { PERROS_LOCAL, PERROS_PRODUCTOS } = await import('./dev/perrosCriollos')
    return { local: PERROS_LOCAL, productos: PERROS_PRODUCTOS }
  }
  if (slug === 'sabor-del-dia') {
    const { SABOR_LOCAL, SABOR_PRODUCTOS } = await import('./dev/saborDelDia')
    return { local: SABOR_LOCAL, productos: SABOR_PRODUCTOS }
  }
  if (slug === 'pilotos') {
    const { PILOTOS_LOCAL, PILOTOS_PRODUCTOS } = await import('./dev/pilotos')
    return { local: PILOTOS_LOCAL, productos: PILOTOS_PRODUCTOS }
  }
  if (slug === 'juance') {
    const { JUANCE_LOCAL, JUANCE_PRODUCTOS } = await import('./dev/juance')
    return { local: JUANCE_LOCAL, productos: JUANCE_PRODUCTOS }
  }
  if (slug === 'jasbury') {
    const { JASBURY_LOCAL, JASBURY_PRODUCTOS } = await import('./dev/jasbury')
    return { local: JASBURY_LOCAL, productos: JASBURY_PRODUCTOS }
  }
  if (slug === 'fruti-tentacion') {
    const { FRUTI_LOCAL, FRUTI_PRODUCTOS } = await import('./dev/frutiTentacion')
    return { local: FRUTI_LOCAL, productos: FRUTI_PRODUCTOS }
  }
  if (slug === 'la-comarca') {
    const { COMARCA_LOCAL, COMARCA_PRODUCTOS } = await import('./dev/laComarca')
    return { local: COMARCA_LOCAL, productos: COMARCA_PRODUCTOS }
  }
  // La Gran Esquina no guarda su menú en Appetic: lo publica su cocinera desde
  // la app del negocio. La vista previa lo lee EN VIVO, que es justo lo que hay
  // que revisar aquí — que la traducción del menú del día se vea bien.
  if (slug === 'la-gran-esquina') {
    const { LGE_LOCAL } = await import('./dev/laGranEsquina')
    const { getMenuLaGranEsquina } = await import('./services/menuLaGranEsquina')
    return { local: LGE_LOCAL, productos: await getMenuLaGranEsquina() }
  }
  if (slug === 'el-monumento') {
    const { MONUMENTO_LOCAL, MONUMENTO_PRODUCTOS } = await import('./dev/elMonumento')
    return { local: MONUMENTO_LOCAL, productos: MONUMENTO_PRODUCTOS }
  }
  return null
}

// 👀 Vista previa del INICIO (/?preview=1): arma el buscador desde el código, sin
// base de datos — para revisar el diseño del inicio antes de re-sembrar. Calcula
// destacadosHome al vuelo con el mismo helper de los seeds/panel (fuente única).
const PREVIEW_SLUGS = [
  'perros-criollos', 'sabor-del-dia', 'pilotos', 'juance', 'jasbury',
  'fruti-tentacion', 'la-comarca', 'el-monumento',
]
export async function getPreviewLocales() {
  const { computeDestacadosHome } = await import('./utils/destacadosHome')
  const out = []
  for (const slug of PREVIEW_SLUGS) {
    const r = await getPreviewLocal(slug)
    if (r) out.push({ ...r.local, destacadosHome: computeDestacadosHome(r.productos) })
  }
  return out
}
