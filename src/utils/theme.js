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
