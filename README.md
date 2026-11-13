# Cine a Ciegas 🎟️

**Giren la ruleta. Lo que toca, se ve.**

Web app para cualquier grupo (familia, amigos, pareja, de a dos o de a muchos) que nunca se pone de acuerdo en qué película ver. Cada integrante suma sus géneros favoritos a una ruleta compartida. La ruleta elige un género y la app trae una película al azar de ese género. La película queda **en cartelera** hasta que todo el grupo la vea y deje su reseña. Cada integrante tiene **un veto por ronda** para descartar una película y volver a girar.

Trabajo Práctico 2 · Desarrollo Frontend II · UADE · 2026

**Integrantes:** Milagros Paez y María Belén Valcarce

**App publicada:** https://cine-a-ciegas.vercel.app

---

## Tecnologías

- **React + Vite**: interfaz con componentes, eventos y estado.
- **Firebase Authentication**: inicio de sesión con Google.
- **Cloud Firestore**: base de datos en tiempo real (consultar, crear, modificar y eliminar).
- **TMDB API**: datos de películas (póster, sinopsis, géneros).
- **Vercel**: publicación de la app.

## Funciones

- Iniciar sesión con Google.
- Crear un grupo (genera un código de 6 caracteres) o unirse con un código o un link de invitación.
- Sumar y quitar géneros de la ruleta del grupo.
- Girar la ruleta: elige un género y trae una película de TMDB que el grupo todavía no tuvo.
- Cartelera: la película actual como una entrada de cine, con póster, sinopsis, duración, dirección, etiquetas de género, **reparto** y **recomendaciones similares**.
- Veto: cada integrante puede vetar una vez por ronda, siempre que nadie haya reseñado todavía. Pide confirmación antes de usarlo.
- Reseñas **selladas**: puntaje de 1 a 5 estrellas más un comentario. Nadie ve lo que escribieron los demás hasta que reseña todo el grupo; entonces se revelan juntas, con el promedio.
- Al terminar la ronda se recargan los vetos.
- Archivo de películas vistas (con promedio) y vetadas (con quién las vetó), con **estadísticas del grupo**.
- **Dónde verla en Argentina:** plataformas donde está incluida, para alquilar o comprar (datos de JustWatch vía TMDB).
- **Filtros de la función:** duración máxima y época, elegidos por el grupo.
- **Ajustes del grupo:** cambiar el nombre, salir del grupo o eliminarlo (solo quien lo creó).
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
| **Modificar** | `joinGroup`, `vetoMovie`, `submitReview`, `renameGroup`, `updateGroupFilters`, `leaveGroup` |
| **Eliminar** | `removeGenre` (borra un documento), `deleteMyReview` (borra un campo), `deleteGroup` (borra el grupo con sus géneros y películas en un `writeBatch`) |

## Datos guardados en Firestore

```
groups/{CODIGO}
  name, code, ownerId
  memberIds: [uid, ...]
  members: { uid: { name, photo } }
  currentMovieId          ← película en cartelera (o null)
  round: { number, vetoesUsed: [uid, ...] }
  filters: { maxRuntime, era }   ← desde v3

groups/{CODIGO}/genres/{idGeneroTMDB}
  tmdbId, name, addedBy, addedByName, createdAt

groups/{CODIGO}/movies/{id}
  tmdbId, title, overview, posterPath, year, voteAverage, genreNames
  runtime, tagline, director, cast: [...], recommendations: [...]   ← desde v2
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

### v2: mejoras de funciones y rediseño
- **Ficha completa:** reparto con fotos y fila de películas recomendadas (TMDB `append_to_response=credits,recommendations`). La ficha se guarda en Firestore al girar.
- **Reseñas selladas y revelación:** las reseñas ajenas se ven "dadas vuelta" hasta que reseña todo el grupo; después se revelan juntas con el promedio.
- **Veto con confirmación** dentro de la entrada, sin ventanas del navegador.
- **Rediseño:** la película es una entrada troquelada (cuerpo + talón perforado) que se "imprime" al salir; reseñar pone un sello de "Vista"; la ruleta tiene un aro de bombitas que se encienden en cadena al girar; el login es un cartel de marquesina; los grupos y el archivo son entradas y talones de papel con textura.
- Texto de bienvenida más inclusivo ("Armá un grupo con quien quieras ver películas").
- Texto de bienvenida más inclusivo ("Armá un grupo con quien quieras ver películas").
- Corrección: los nombres de géneros de la mitad izquierda de.

### v3: versión final
- **Dónde verla en Argentina:** logos de las plataformas (incluida, alquiler, compra), consultados en el momento a TMDB/JustWatch porque cambian seguido.
- **Filtros de la función:** "¿Cuánto tiempo tienen?" (sin límite, hasta 2 h, hasta 1 h 40) y época (antes de 1990, 1990 a 2009, desde 2010). Se guardan en el grupo y se aplican al buscar en TMDB.
- **Ajustes del grupo:** renombrar, salir (si estaba la película en cartelera y ya reseñaron todos los que quedan, la ronda se cierra) y eliminar el grupo con todo su contenido.
- **Datos de la sala:** estadísticas del grupo en un cartel de letras intercambiables, como los de las marquesinas: películas vistas y vetadas, género que más salió, mejor puntuada, la mano más dura y la más generosa, y quién vetó más.
- Puntajes con coma decimal (formato argentino).

---

Datos de películas provistos por [TMDB](https://www.themoviedb.org/). Esta app usa la API de TMDB pero no está avalada ni certificada por TMDB.
