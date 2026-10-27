// 🔙 ¿El "atrás" del teléfono es para cerrar el cajón del panel?
//
// El cajón (PanelDrawer) mete una entrada en el historial al abrirse para que
// "atrás" lo cierre. Pero el menú del local (LocalPage) también escucha
// "atrás" —su centinela— y, sin capa abierta, te manda al inicio. Sin este
// aviso, cerrar el cajón dentro de un menú te sacaba del menú.
let abierto = false

export function marcarCajonAbierto(v) {
  if (v) { abierto = true; return }
  // Se apaga en el siguiente tick: así todos los que escuchan ESTE mismo
  // "atrás" (sin importar el orden) alcanzan a ver que era del cajón.
  setTimeout(() => { abierto = false }, 0)
}

export function atrasEsDelCajon() {
  return abierto
}
