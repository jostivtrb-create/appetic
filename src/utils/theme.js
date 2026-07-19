// 🎨 Convierte el "tema" de un local en variables CSS que pintan su mundo.
// El local define algunos colores; lo que falte cae a la marca Appetic.
export function localThemeVars(tema = {}) {
  const vars = {}
  if (tema.primary) vars['--local-primary'] = tema.primary
  if (tema.primaryStrong) vars['--local-primary-strong'] = tema.primaryStrong
  if (tema.primarySoft) vars['--local-primary-soft'] = tema.primarySoft
  if (tema.onPrimary) vars['--local-on-primary'] = tema.onPrimary
  if (tema.accent) vars['--local-accent'] = tema.accent
  // Fondo del "mundo" del local (detrás del menú). Si no lo define, cae al fondo de la app.
  if (tema.bg) vars['--local-bg'] = tema.bg
  return vars
}

// ¿El "mundo" del local es oscuro? (luminancia del fondo)
export function esColorOscuro(hex) {
  if (!hex || typeof hex !== 'string') return false
  const m = hex.replace('#', '')
  if (m.length < 6) return false
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return false
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45
}

// 🌎 Transforma TODA la app con el mundo del local activo: sobreescribe los
// tokens semánticos (fondo, superficie, texto, marca) para que cada pantalla
// (Buscar, Favoritos, Cuenta, Pedidos) adopte sus colores — incluido el fondo,
// oscuro u claro según el mundo del local. Sin local activo devuelve {} y la
// app queda con los tokens Appetic de :root.
export function appThemeVars(tema) {
  if (!tema) return {}
  const vars = { ...localThemeVars(tema) }
  const bg = tema.bg || '#FBF3E2'
  const primary = tema.primary || '#ED7D2B'
  const strong = tema.primaryStrong || primary
  const soft = tema.primarySoft || primary
  const accent = tema.accent || primary

  vars['--bnav-bg'] = bg
  vars['--brand-cream'] = bg
  vars['--brand-orange'] = primary
  vars['--brand-orange-soft'] = soft
  vars['--bg'] = bg

  if (esColorOscuro(bg)) {
    // 🌙 Mundo oscuro: superficies levantadas del fondo, texto claro.
    vars['--surface'] = `color-mix(in srgb, ${bg} 82%, #ffffff)`
    vars['--surface-2'] = `color-mix(in srgb, ${bg} 90%, #ffffff)`
    vars['--border'] = 'rgba(255, 255, 255, 0.12)'
    vars['--text'] = '#F5EEE4'
    vars['--text-soft'] = 'rgba(245, 238, 228, 0.66)'
    vars['--text-faint'] = 'rgba(245, 238, 228, 0.42)'
    vars['--brand-ink'] = '#F5EEE4'
    // En oscuro, "strong" se usa como texto de acento → el acento brilla mejor.
    vars['--brand-orange-strong'] = accent
    vars['--brand-orange-tint'] = `color-mix(in srgb, ${primary} 26%, ${bg})`
    vars['--shadow-sm'] = '0 1px 2px rgba(0, 0, 0, 0.45)'
    vars['--shadow'] = '0 6px 20px rgba(0, 0, 0, 0.55)'
    vars['--shadow-lg'] = '0 14px 44px rgba(0, 0, 0, 0.6)'
  } else {
    // ☀️ Mundo claro: fondo del local (crema…), tarjetas blancas, texto oscuro.
    vars['--surface'] = '#FFFFFF'
    vars['--surface-2'] = `color-mix(in srgb, ${bg} 62%, #ffffff)`
    vars['--border'] = `color-mix(in srgb, ${primary} 16%, #ffffff)`
    vars['--text'] = '#2A211C'
    vars['--text-soft'] = '#6E635B'
    vars['--text-faint'] = '#A89E94'
    vars['--brand-ink'] = '#2A211C'
    vars['--brand-orange-strong'] = strong
    vars['--brand-orange-tint'] = `color-mix(in srgb, ${primary} 13%, #ffffff)`
  }
  return vars
}
