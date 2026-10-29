// 👥 EQUIPO del local: meseros y cocina (locales/{id}/equipo/{rol}:{email}).
//
// Va en una SUBCOLECCIÓN privada y no dentro del documento del local porque ese documento es de
// lectura pública (es el menú): ahí los correos del personal quedarían a la vista de cualquiera.
// Esta subcolección solo la leen el admin del local y la propia persona (firestore.rules).
//
//   id del doc:  'mesero:ana@gmail.com' · 'cocina:tablet.cocina@gmail.com'
//   datos:       { email, rol: 'mesero' | 'cocina' | 'domiciliario', activo: bool, localId, agregadoEn }
//
// «Desactivar» deja a la persona en la lista (en gris, se puede reactivar) y le quita el acceso;
// «Eliminar» la saca de la lista. Un mismo correo puede ser mesero y cocina a la vez.
import {
  collection, collectionGroup, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

export const ROLES = ['mesero', 'cocina', 'domiciliario']

const normal = email => String(email || '').trim().toLowerCase()
const idDoc = (rol, email) => `${rol}:${normal(email)}`

// ¿Tiene forma de correo? (la validación de verdad es que la persona pueda entrar con Google)
export const esCorreo = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normal(email))

// ─────────────────────────────── Motor Firestore ───────────────────────────────

function firestoreApi(localId) {
  const col = () => collection(db, 'locales', localId, 'equipo')
  return {
    async listar(rol) {
      const snap = await getDocs(query(col(), where('rol', '==', rol)))
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.email.localeCompare(b.email))
    },
    async agregar(rol, email) {
      const e = normal(email)
      await setDoc(doc(col(), idDoc(rol, e)), {
        email: e, rol, activo: true, localId, agregadoEn: serverTimestamp(),
      })
    },
    async setActivo(rol, email, activo) {
      await updateDoc(doc(col(), idDoc(rol, email)), { activo })
    },
    async eliminar(rol, email) {
      await deleteDoc(doc(col(), idDoc(rol, email)))
    },
  }
}

// ─────────────────────────────── Motor DEMO ───────────────────────────────

function demoApi(localId) {
  const KEY = `appetic_demo_equipo_${localId}`
  const leer = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
  const escribir = l => { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch { /* nada */ } }
  return {
    async listar(rol) {
      return leer().filter(p => p.rol === rol).sort((a, b) => a.email.localeCompare(b.email))
    },
    async agregar(rol, email) {
      const e = normal(email)
      escribir([...leer().filter(p => p.id !== idDoc(rol, e)), { id: idDoc(rol, e), email: e, rol, activo: true, localId }])
    },
    async setActivo(rol, email, activo) {
      escribir(leer().map(p => p.id === idDoc(rol, email) ? { ...p, activo } : p))
    },
    async eliminar(rol, email) {
      escribir(leer().filter(p => p.id !== idDoc(rol, email)))
    },
  }
}

export function equipoDe(localId, { demo = false } = {}) {
  return demo ? demoApi(localId) : firestoreApi(localId)
}

// 🔎 ¿En qué locales trabaja este correo y con qué rol? (consulta de grupo sobre 'equipo').
// Devuelve [{ localId, rol }] solo de los ACTIVOS.
export async function getRolesDeEquipo(email) {
  const e = normal(email)
  if (!e) return []
  try {
    const snap = await getDocs(query(collectionGroup(db, 'equipo'), where('email', '==', e)))
    return snap.docs.map(d => d.data()).filter(p => p.activo).map(p => ({ localId: p.localId, rol: p.rol }))
  } catch (err) {
    console.warn('No se pudo leer el equipo:', err?.code || err)
    return []
  }
}
