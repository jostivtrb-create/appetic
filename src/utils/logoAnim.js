// 🎬 Animación de entrada del logo del hero.
// Un solo campo en el local: `logoAnim`. Pensado para crecer: para agregar una
// animación nueva, basta con sumar una opción aquí y (si lleva movimiento) su
// variante en LogoEpico. Las que tienen "dirección" propia (arriba/lado) las
// entiende LogoEpico por su prop `direccion`.

export const LOGO_ANIMS = [
  { id: 'arriba', label: '⬇️ Desde arriba' },
  { id: 'lado', label: '↔️ De lado' },
  { id: 'ninguna', label: '🚫 Sin animación' },
]

// Resuelve qué animación usar leyendo el campo nuevo `logoAnim` y, si no existe,
// el modelo anterior (animarLogo + logoAnimDir) para no romper locales ya guardados.
export function resolverLogoAnim(local) {
  const val = local?.logoAnim
  if (val) return val
  if (local?.animarLogo === false) return 'ninguna'
  if (local?.logoAnimDir === 'lado') return 'lado'
  return 'arriba'
}
