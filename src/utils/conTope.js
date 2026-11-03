import { useEffect, useState } from 'react'

// 📡 Sin internet, Firestore no falla: deja la escritura en cola y la promesa espera hasta que vuelva
// la señal (el botón se quedaba en «Enviando…» para siempre). Con tope, la pantalla se entera y lo dice.
export class SinRed extends Error {
  constructor() { super('sin-red'); this.code = 'sin-red' }
}
export const conTope = (promesa, ms = 8000) =>
  Promise.race([promesa, new Promise((_, no) => setTimeout(() => no(new SinRed()), ms))])

// ¿El dispositivo tiene red? (WiFi apagado, modo avión, datos caídos). Se pone al día sola.
export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false)
  useEffect(() => {
    const si = () => setEnLinea(true), no = () => setEnLinea(false)
    window.addEventListener('online', si)
    window.addEventListener('offline', no)
    return () => { window.removeEventListener('online', si); window.removeEventListener('offline', no) }
  }, [])
  return enLinea
}
