# 🚀 Cómo publicar Perros Criiollos (desde tu PC)

Guía corta para crear el local en Firebase. Es **un solo comando**; lo demás es
preparación. Sigue los pasos en orden.

> ⚠️ **NO hay que tocar las reglas de Firebase.** No corras `firebase deploy`.
> El local se crea con el script, que usa la llave de administrador y no necesita
> cambios en `firestore.rules`.

---

## ✅ Antes de empezar, necesitas

1. **El proyecto en tu PC** (la carpeta donde está este archivo).
2. **Node.js instalado.** Para comprobar, en la terminal: `node -v` (debe mostrar un número).
3. **La llave de Firebase** en `scripts/serviceAccount.json` (la misma que usaste para
   *Burger Demo*). Si no la tienes, mira la sección **"¿No tienes la llave?"** más abajo.

---

## 🟢 Pasos (copia y pega en la terminal, uno por uno)

Abre la terminal **dentro de la carpeta del proyecto** y corre:

```bash
# 1) Traer lo último (el script y el menú con bebidas)
git pull origin main

# 2) Instalar dependencias (si hace falta; no pasa nada si ya están)
npm install

# 3) Crear el local en Firebase
node scripts/seed-perros-criollos.mjs
```

### Qué debe salir si funcionó
```
✓ Local creado: locales/perros-criollos (Perros Criiollos)
✓ 6 productos cargados
🔗 Link del local: /perros-criollos
🔐 Admin: sinfiniity@gmail.com → /perros-criollos/admin
```

¡Listo! El local ya existe en la base de datos. 🎉

---

## 📲 Después de publicarlo

1. Abre **`tu-dominio/perros-criollos`** (ya **sin** `?preview=1`). Debe verse el menú real.
2. Entra a **`tu-dominio/perros-criollos/admin`** e inicia sesión con Google usando
   **`sinfiniity@gmail.com`**.
3. Ve a **⚙️ Configuración → Datos del negocio** y escribe el **WhatsApp** para pedidos. Guarda.
4. (Opcional) En esa pantalla ajusta **horario** (ahora está abierto 24 h para pruebas),
   **domicilio** y **zonas de entrega**.

También aparecerá en **Superadmin → Suscripciones** y en el **buscador** del inicio.

---

## 🔑 ¿No tienes la llave (serviceAccount.json)?

Es un archivo secreto que da acceso de administrador a tu Firebase. Para conseguirlo:

1. Entra a la **consola de Firebase** → proyecto **appetic-17477**.
2. ⚙️ **Configuración del proyecto → Cuentas de servicio**.
3. Botón **"Generar nueva clave privada"** → descarga un archivo `.json`.
4. Renómbralo a **`serviceAccount.json`** y guárdalo en la carpeta **`scripts/`** del proyecto.

> 🔒 **Nunca subas este archivo a GitHub.** Ya está bloqueado en `.gitignore`, así que
> no se sube por accidente. No lo pegues en chats ni lo compartas.

---

## 🆘 Errores comunes y cómo resolverlos

| Error que ves | Qué significa / qué hacer |
|---|---|
| `Cannot find module '.../serviceAccount.json'` | Falta la llave. Mira **"¿No tienes la llave?"** y déjala en `scripts/serviceAccount.json`. |
| `node: command not found` | No tienes Node.js instalado. Instálalo desde nodejs.org y vuelve a intentar. |
| `Cannot find module 'firebase-admin'` | Faltó el `npm install`. Córrelo y reintenta el paso 3. |
| `PERMISSION_DENIED` / `unauthorized` | La llave no es del proyecto correcto. Genera una nueva de **appetic-17477**. |
| No pasa nada / se queda pegado | Revisa tu conexión a internet y vuelve a correr el paso 3. |

> Volver a correr el script **no rompe nada**: actualiza el local si ya existía (no lo duplica).

---

## 🔁 Cambiar el menú más adelante

- **Precios, agotados, fotos, horario, WhatsApp:** desde el **panel** (`/perros-criollos/admin`),
  sin tocar código ni volver a correr el script.
- **Cambios de fondo** (toppings/salsas, estética): se editan en `src/dev/perrosCriollos.js`,
  se sube el cambio y se vuelve a correr `node scripts/seed-perros-criollos.mjs`. Avísame y lo preparo.

---

*Cualquier cosa que te salga, pégamela aquí y te ayudo. 🌭*
