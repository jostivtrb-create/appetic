# 🔧 GUÍA DE SETUP — Cuentas de Appetic (antes de programar)

> Objetivo: dejar listas las **cuentas reales** (GitHub, Firebase, Vercel) para construir Appetic directo sobre infraestructura de verdad, sin demos desechables.
> ⛔ **Regla de oro (D32):** vigilar que Firebase **no genere costos** al inicio. Por eso el paso de las **alertas de presupuesto** es obligatorio.

**Leyenda:**
- 🙋 = lo haces tú (navegador / facturación)
- 🤖 = lo puede hacer Claude después (por consola/CLI)

**Orden recomendado:** GitHub → Firebase → Vercel. (El dominio es opcional al inicio).

---

## 1. 🐙 GitHub (guardar el código)

- [ ] 🙋 Entra a [github.com](https://github.com) e inicia sesión (o crea cuenta).
- [ ] 🙋 Decide con **cuál cuenta** quedará Appetic (importante si manejas varias).
- [ ] 🙋 Crea un **repositorio nuevo**:
  - Nombre: `appetic`
  - Privado ✅ (mejor mientras se construye)
  - **Sin** README, sin .gitignore, sin licencia (vacío; Claude lo llena).
- [ ] 🙋 Copia la **URL del repo** (la necesitaremos al empezar a programar).
- [ ] 🤖 Conectar la carpeta del proyecto al repo y el primer push → lo hace Claude.


https://github.com/jostivtrb-create/appetic.git


---

## 2. 🔥 Firebase (base de datos, login y fotos)

> Firebase guarda los menús, las fotos de los productos y maneja el login del panel del local.

### 2.1 Crear el proyecto
- [ ] 🙋 Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google.
- [ ] 🙋 **Agregar proyecto** → nombre: `appetic`.
- [ ] 🙋 Google Analytics: **puedes desactivarlo** (no lo necesitamos al inicio; menos cosas que configurar).

### 2.2 Activar lo que usaremos
- [ YA ] 🙋 **Authentication** → Comenzar → habilita el proveedor **Google** (es para que el local entre a su panel).
- [ YA ] 🙋 **Firestore Database** → Crear base de datos:
  - Modo: **producción** (las reglas las sube Claude después 🤖).
  - Ubicación: **`southamerica-east1`** (São Paulo, la más cercana a Colombia = más rápido).
- [ YA ] 🙋 **Storage** → Comenzar (aquí van las fotos de los productos).

### 2.3 Registrar la "app web"
- [ ] 🙋 En la portada del proyecto, ícono **`</>`** (Web) → registra una app web llamada `appetic`.
- [ ] 🙋 Te dará un bloque de claves (`firebaseConfig`). **Cópialo y guárdalo** — se lo pasas a Claude cuando empecemos (van en un archivo `.env`, NO se suben a GitHub).

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZ_WZDom-slplipYUYhO29QcQRZORenx4",
  authDomain: "appetic-17477.firebaseapp.com",
  projectId: "appetic-17477",
  storageBucket: "appetic-17477.firebasestorage.app",
  messagingSenderId: "163250707814",
  appId: "1:163250707814:web:6b822338657b90eb7bfca7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

### 2.4 ⛔ Control de costos (LO MÁS IMPORTANTE)
> Para usar Storage, Firebase pide el plan **Blaze** (pago por uso). Blaze **mantiene la capa gratis** y solo cobra si te pasas. Con pocos locales eso casi nunca pasa — pero igual blindamos:

- [ ] 🙋 Cambia al plan **Blaze** (te pedirá una tarjeta).
- [ ] 🙋 Ve a **Google Cloud → Facturación → Presupuestos y alertas** (`console.cloud.google.com/billing`).
- [ ] 🙋 Crea un **presupuesto** para el proyecto `appetic`:
  - Monto: algo bajo, ej. **$5 USD/mes**.
  - Alertas por correo al **50%, 90% y 100%**.
- [ ] ⚠️ **Sé consciente:** las alertas **avisan pero NO cortan** el gasto automáticamente. La protección real es:
  1. El **diseño optimizado** de Claude (cachear menús, comprimir fotos, mínimas lecturas).
  2. Que **revises el correo** si llega una alerta.
  3. *(Opcional, avanzado)* Claude puede montar un "interruptor" que desactive la facturación si se pasa el tope. Lo dejamos para si algún día crece.

  YA

---

## 3. ▲ Vercel (publicar la app en internet)

> Vercel toma el código de GitHub y lo publica solo, cada vez que hay cambios.

- [ ] 🙋 Entra a [vercel.com](https://vercel.com) → **Sign up con GitHub** (así quedan conectados).
- [ ] 🙋 Autoriza a Vercel a ver tus repos de GitHub.
- [ ] 🤖 Importar el repo `appetic` y configurar el despliegue → lo hace Claude cuando ya haya código.
- [ ] 🤖 Cargar las claves de Firebase como **variables de entorno** en Vercel → lo hace Claude.
- 💡 De entrada tendrás una URL gratis tipo `appetic.vercel.app`. Sirve perfecto para empezar.

AUN NO PUEDO PORQUE NO HAY NADA EN MAIN PARA HACER DESPLIEGUE

---

## 4. 🌐 Dominio (OPCIONAL al inicio)

> No es urgente: se puede arrancar con `appetic.vercel.app`. El dominio bonito se conecta cuando quieras.

- [ ] 🙋 Verifica disponibilidad en un registrador (Namecheap, GoDaddy, Hostinger):
  - `appetic.com` · `appetic.app` · `appetic.co` (muy colombiano) · `appetic.com.co`
- [ ] 🙋 Si está libre y quieres, cómpralo.
- [ ] 🤖 Conectarlo a Vercel → lo hace Claude (es solo apuntar unos registros DNS).


SIN DOMINIO NO HAY PLATA PARA ESO AUN 
---

## ✅ Resultado: cuando termines tendrás

1. Un repo `appetic` en GitHub (vacío, listo).
2. Un proyecto Firebase `appetic` con Auth (Google), Firestore, Storage y **alertas de presupuesto activas**.
3. El bloque de **claves `firebaseConfig`** guardado.
4. Una cuenta de Vercel conectada a GitHub.

**Con eso, Claude ya puede empezar a programar Appetic sobre infraestructura real.** 🚀

---

### 📌 Lo único que Claude necesita de ti para arrancar a programar:
- La **URL del repo** de GitHub.
- El bloque de **`firebaseConfig`** (las claves del paso 2.3).
- Confirmación de que el **presupuesto/alertas** quedaron activos.
