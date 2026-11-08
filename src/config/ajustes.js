// ⚙️ Las secciones de Configuración (/:slug/admin/config/<sección>). Las usan la página
// (pages/Admin/AdminAjustes.jsx) y el desplegable «Configuración» de la barra del panel (PanelRail).
export const SECCIONES_AJUSTES = [
  { id: 'catalogo', icono: '🍔', titulo: 'Catálogo', desc: 'Productos, precios, fotos y categorías' },
  { id: 'menu-del-dia', icono: '🍲', titulo: 'Menú del día', desc: 'El almuerzo: semana, hoy y lo que se acabó' },
  { id: 'negocio', icono: '🏪', titulo: 'Negocio y horario', desc: 'WhatsApp, horario y entrega' },
  { id: 'pagos', icono: '💳', titulo: 'Cuentas y pagos', desc: 'Efectivo, Nequi, Bold… y si hay cocina' },
  { id: 'apariencia', icono: '🎨', titulo: 'Apariencia', desc: 'Portada y animación del logo' },
  { id: 'impresora', icono: '🖨️', titulo: 'Impresora', desc: 'Comandas y ticket en papel (opcional)' },
  { id: 'pantalla', icono: '📺', titulo: 'Menú en Pantalla', desc: 'Tu menú en vivo en el TV del local, y tus anuncios' },
  { id: 'equipo', icono: '👥', titulo: 'Equipo', desc: 'Cajeros, meseros, cocina y domiciliarios' },
  { id: 'plan', icono: '💳', titulo: 'Mi plan', desc: 'Tu plan, hasta cuándo está pago y cómo subir' },
]

// Las secciones ya rehechas con el diseño del Catálogo (guía «Diseño de pantallas del panel»):
// van a todo el ancho y traen su propio encabezado grande (PanelHero), sin el título pequeño.
export const AJUSTES_ANCHOS = ['catalogo', 'menu-del-dia', 'negocio', 'apariencia', 'pagos', 'impresora']
