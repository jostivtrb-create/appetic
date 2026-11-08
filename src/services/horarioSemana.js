// 🗓️ Horario de la semana (modelo en utils/turnos.js). Firestore o DEMO (vista previa, localStorage).
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { limpiarSemana } from '../utils/horarioSemana'

function firestoreApi(localId) {
  const ref = doc(db, 'locales', localId, 'horarios', 'semana')
  return {
    escuchar(cb, onError) { return onSnapshot(ref, s => cb(s.exists() ? s.data() : { personas: [] }), onError) },
    guardar(personas, por) { return setDoc(ref, { personas: limpiarSemana(personas), actualizado: serverTimestamp(), por }) },
  }
}
function demoApi(localId) {
  const KEY = `appetic_demo_turnos_${localId}`
  const oyentes = new Set()
  const leer = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || { personas: [] } } catch { return { personas: [] } } }
  return {
    escuchar(cb) { const f = () => cb(leer()); oyentes.add(f); f(); return () => oyentes.delete(f) },
    async guardar(personas, por) {
      try { localStorage.setItem(KEY, JSON.stringify({ personas: limpiarSemana(personas), actualizado: Date.now(), por })) } catch { /* nada */ }
      oyentes.forEach(f => f())
    },
  }
}
const cache = new Map()
export function turnosDe(localId, { demo = false } = {}) {
  const k = `${demo ? 'demo' : 'fs'}:${localId}`
  if (!cache.has(k)) cache.set(k, demo ? demoApi(localId) : firestoreApi(localId))
  return cache.get(k)
}
