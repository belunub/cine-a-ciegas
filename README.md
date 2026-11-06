# Cine a Ciegas 🎟️

**Giren la ruleta. Lo que toca, se ve.**

Web app para grupos de amigos o parejas que nunca se ponen de acuerdo en qué película ver. Cada integrante suma sus géneros favoritos a una ruleta compartida. La ruleta elige un género y la app trae una película al azar de ese género. La película queda **en cartelera** hasta que todo el grupo la vea y deje su reseña. Cada integrante tiene **un veto por ronda** para descartar una película y volver a girar.

Trabajo Práctico 2 · Desarrollo Frontend II · UADE · 2026

---

## Tecnologías

- **React + Vite**: interfaz con componentes, eventos y estado.
- **Firebase Authentication**: inicio de sesión con Google.
- **Cloud Firestore**: base de datos en tiempo real (consultar, crear, modificar y eliminar).
- **TMDB API**: datos de películas (póster, sinopsis, géneros).
- **Vercel**: publicación de la app.

## Funciones (v1)

- Iniciar sesión con Google.
- Crear un grupo (genera un código de 6 caracteres) o unirse con un código o un link de invitación.
- Sumar y quitar géneros de la ruleta del grupo.
- Girar la ruleta: elige un género y trae una película de TMDB que el grupo todavía no tuvo.
- Cartelera: la película actual, con póster, sinopsis, etiquetas de género y quién la giró.
- Veto: cada integrante puede vetar una vez por ronda, siempre que nadie haya reseñado todavía.
- Reseñas: puntaje de 1 a 5 estrellas más un comentario. Cuando reseñan todos, la ronda termina y se recargan los vetos.
- Historial de películas vistas (con promedio) y vetadas (con quién las vetó).
- Mensajes de carga, éxito y error. Diseño adaptable a celular.

## Dónde se conecta Firebase

| Archivo | Qué hace |
|---|---|
| `src/firebase.js` | Inicializa Firebase con las variables de `.env` y exporta `auth` y `db`. |
| `src/lib/groups.js` | **Todas** las operaciones con Firestore: lecturas en tiempo real (`onSnapshot`), creación (`set`), modificación (`update`) y eliminación (`deleteDoc`, `deleteField`). |
| `src/lib/hooks.js` | Escucha si hay un usuario con sesión iniciada (`onAuthStateChanged`). |
| `src/components/Login.jsx` | Inicio de sesión con Google (`signInWithPopup`). |
| `firestore.rules` | Reglas de seguridad de la base. |

### Operaciones sobre los datos

| Operación | Dónde |
|---|---|
| **Consultar** | `watchMyGroups`, `watchGroup`, `watchGenres`, `watchMovies` |
| **Agregar** | `createGroup`, `addGenre`, `putMovieOnBill` |
| **Modificar** | `joinGroup`, `vetoMovie`, `submitReview` |
| **Eliminar** | `removeGenre` (borra un documento), `deleteMyReview` (borra un campo) |

## Datos guardados en Firestore

```
groups/{CODIGO}
  name, code, ownerId
  memberIds: [uid, ...]
  members: { uid: { name, photo } }
  currentMovieId          ← película en cartelera (o null)
  round: { number, vetoesUsed: [uid, ...] }

groups/{CODIGO}/genres/{idGeneroTMDB}
  tmdbId, name, addedBy, addedByName, createdAt

groups/{CODIGO}/movies/{id}
  tmdbId, title, overview, posterPath, year, voteAverage, genreNames
  spunGenre, spunBy, spunByName, round
  status: "cartelera" | "vista" | "vetada"
  vetoedBy, vetoedByName
  reviews: { uid: { rating, text, name, photo, createdAt } }
```

---

## Cómo ejecutar el proyecto

### Requisitos

- [Node.js](https://nodejs.org/) versión LTS
- Una cuenta de [Firebase](https://console.firebase.google.com/) y una de [TMDB](https://www.themoviedb.org/)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar las variables de entorno

Copiá `.env.example` como `.env` (en la misma carpeta que `package.json`) y completá los valores:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_TMDB_TOKEN=...
```

- Los cuatro valores de Firebase están en *Configuración del proyecto → Tus apps → app web → `firebaseConfig`*.
- `VITE_TMDB_TOKEN` es el **API Read Access Token** de TMDB (*Configuración → API*).

> Las variables con prefijo `VITE_` quedan visibles en el navegador. La configuración web de Firebase está pensada para eso: la seguridad de los datos depende de las reglas de Firestore. El token de TMDB solo permite leer datos públicos de películas. El archivo `.env` **no se sube** a GitHub (está en `.gitignore`).

### 3. Configurar Firebase

1. **Authentication → Método de acceso → Google → Habilitar.**
2. **Firestore Database → Crear base de datos**: edición Standard, ID `(default)`, ubicación `southamerica-east1 (São Paulo)`, modo producción.
3. **Firestore → Reglas**: pegar el contenido de `firestore.rules` y **Publicar**.

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrir `http://localhost:5173`. Si se cambia el `.env`, hay que detener el servidor (`Ctrl + C`) y volver a ejecutar `npm run dev`.

## Publicación en Vercel

1. Importar el repositorio de GitHub en Vercel (Framework: **Vite**, build: `npm run build`, salida: `dist`).
2. En **Settings → Environment Variables** cargar las cinco variables `VITE_...` para *Production*.
3. Desplegar. Si las variables se agregan o cambian después, hacer **Redeploy**.
4. En Firebase: **Authentication → Configuración → Dominios autorizados → Agregar dominio**, con el dominio de Vercel (por ejemplo `cine-a-ciegas.vercel.app`). Sin esto, el login con Google falla en la versión publicada.

Las reglas de Firestore se publican en Firebase: desplegar en Vercel no las actualiza.

---

## Versiones

### v1: primera versión funcional
- Flujo completo: login, grupos, ruleta, cartelera, veto, reseñas e historial.
- Identidad base: paleta de sala de cine (carbón, crema, bordó, mostaza) y tipografías de marquesina, cartel de época y máquina de escribir.

---

Datos de películas provistos por [TMDB](https://www.themoviedb.org/). Esta app usa la API de TMDB pero no está avalada ni certificada por TMDB.
