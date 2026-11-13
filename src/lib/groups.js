// ─────────────────────────────────────────────────────────────
// OPERACIONES CON FIRESTORE
// Todas las lecturas y escrituras de la base de datos están en este archivo.
//
// Estructura de datos:
//   groups/{CODIGO}                    → el grupo (nombre, miembros, ronda)
//   groups/{CODIGO}/genres/{idGenero}  → porciones de la ruleta
//   groups/{CODIGO}/movies/{id}        → películas: en cartelera, vistas o vetadas
// ─────────────────────────────────────────────────────────────
import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const MAX_MEMBERS = 8;
export const MAX_GENRES = 12;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I para no confundir

function makeCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function firstName(user) {
  return (user.displayName || 'Alguien').split(' ')[0];
}

function memberInfo(user) {
  return { name: user.displayName || 'Sin nombre', photo: user.photoURL || null };
}

function toMillis(value) {
  return value?.toMillis ? value.toMillis() : 0;
}

// ───────────── CONSULTAS EN TIEMPO REAL (READ) ─────────────

// Grupos donde el usuario es miembro.
export function watchMyGroups(uid, onData, onError) {
  const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      groups.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(groups);
    },
    onError,
  );
}

export function watchGroup(groupId, onData, onError) {
  return onSnapshot(
    doc(db, 'groups', groupId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  );
}

export function watchGenres(groupId, onData, onError) {
  return onSnapshot(
    collection(db, 'groups', groupId, 'genres'),
    (snap) => {
      const genres = snap.docs.map((d) => ({
        id: d.id,
        ...d.data({ serverTimestamps: 'estimate' }),
      }));
      genres.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      onData(genres);
    },
    onError,
  );
}

export function watchMovies(groupId, onData, onError) {
  const q = query(collection(db, 'groups', groupId, 'movies'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))),
    onError,
  );
}

// ───────────── GRUPOS (CREATE / UPDATE) ─────────────

// Crea un grupo. El código de 6 caracteres es también el ID del documento.
export async function createGroup(name, user) {
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    const ref = doc(db, 'groups', code);

    const created = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return false; // código ocupado: probamos otro
      tx.set(ref, {
        name,
        code,
        ownerId: user.uid,
        memberIds: [user.uid],
        members: { [user.uid]: memberInfo(user) },
        currentMovieId: null,
        round: { number: 1, vetoesUsed: [] },
        createdAt: serverTimestamp(),
      });
      return true;
    });

    if (created) return code;
  }
  throw new Error('No pudimos generar un código para el grupo. Probá de nuevo.');
}

// Suma al usuario a un grupo existente a partir del código.
export async function joinGroup(rawCode, user) {
  const code = rawCode.trim().toUpperCase();
  const ref = doc(db, 'groups', code);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('No existe un grupo con ese código.');

    const group = snap.data();
    if (group.memberIds.includes(user.uid)) return; // ya era miembro
    if (group.memberIds.length >= MAX_MEMBERS) {
      throw new Error(`Este grupo está completo (máximo ${MAX_MEMBERS} personas).`);
    }

    tx.update(ref, {
      memberIds: arrayUnion(user.uid),
      [`members.${user.uid}`]: memberInfo(user),
    });
  });

  return code;
}

// ───────────── v3: ADMINISTRAR EL GRUPO (UPDATE / DELETE) ─────────────

export async function renameGroup(groupId, name) {
  await updateDoc(doc(db, 'groups', groupId), { name });
}

// Filtros de la función: { maxRuntime: 0 | 100 | 120, era: 'all' | 'classic' | ... }
export async function updateGroupFilters(groupId, filters) {
  await updateDoc(doc(db, 'groups', groupId), { filters });
}

// Salir del grupo. Si había una película en cartelera y con esta salida
// ya reseñaron todos los que quedan, la ronda se cierra.
export async function leaveGroup(groupId, uid) {
  const groupRef = doc(db, 'groups', groupId);

  await runTransaction(db, async (tx) => {
    const groupSnap = await tx.get(groupRef);
    if (!groupSnap.exists()) return;
    const group = groupSnap.data();
    if (group.ownerId === uid) {
      throw new Error('Quien creó el grupo no puede salir: puede eliminarlo.');
    }

    const remaining = group.memberIds.filter((id) => id !== uid);
    let movieRef = null;
    let movie = null;
    if (group.currentMovieId) {
      movieRef = doc(db, 'groups', groupId, 'movies', group.currentMovieId);
      movie = (await tx.get(movieRef)).data();
    }

    const update = {
      memberIds: remaining,
      [`members.${uid}`]: deleteField(),
      'round.vetoesUsed': (group.round?.vetoesUsed || []).filter((id) => id !== uid),
    };

    if (movie && movie.status === 'cartelera') {
      // Su reseña (si había) se descarta, para que no cuente en el promedio.
      const reviews = { ...(movie.reviews || {}) };
      delete reviews[uid];
      const everyoneReviewed = remaining.length > 0 && remaining.every((id) => reviews[id]);
      tx.update(movieRef, {
        [`reviews.${uid}`]: deleteField(),
        ...(everyoneReviewed ? { status: 'vista', closedAt: serverTimestamp() } : {}),
      });
      if (everyoneReviewed) {
        update.currentMovieId = null;
        update.round = { number: (group.round?.number ?? 1) + 1, vetoesUsed: [] };
        delete update['round.vetoesUsed'];
      }
    }

    tx.update(groupRef, update);
  });
}

// Eliminar el grupo (solo quien lo creó). Firestore no borra las subcolecciones
// solas, así que primero borramos géneros y películas, y al final el grupo.
export async function deleteGroup(groupId) {
  const [genresSnap, moviesSnap] = await Promise.all([
    getDocs(collection(db, 'groups', groupId, 'genres')),
    getDocs(collection(db, 'groups', groupId, 'movies')),
  ]);

  const batch = writeBatch(db);
  genresSnap.docs.forEach((d) => batch.delete(d.ref));
  moviesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'groups', groupId));
  await batch.commit();
}

// ───────────── GÉNEROS DE LA RULETA (CREATE / DELETE) ─────────────

export async function addGenre(groupId, genre, user) {
  // El ID del documento es el ID del género: así no se puede repetir.
  const ref = doc(db, 'groups', groupId, 'genres', String(genre.id));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      throw new Error(`${genre.name} ya está en la ruleta (lo sumó ${snap.data().addedByName}).`);
    }
    tx.set(ref, {
      tmdbId: genre.id,
      name: genre.name,
      addedBy: user.uid,
      addedByName: firstName(user),
      createdAt: serverTimestamp(),
    });
  });
}

export async function removeGenre(groupId, genreDocId) {
  await deleteDoc(doc(db, 'groups', groupId, 'genres', genreDocId));
}

// ───────────── PELÍCULAS (CREATE / UPDATE / DELETE) ─────────────

// Guarda la película que salió en la ruleta y la pone "en cartelera".
// Usa una transacción para que dos personas no giren a la vez.
// v2: también guarda la ficha completa (elenco, recomendaciones, etc.) para que
// todo el grupo vea lo mismo aunque TMDB falle después.
export async function putMovieOnBill(groupId, movie, genre, genreNames, details, user) {
  const groupRef = doc(db, 'groups', groupId);
  const movieRef = doc(collection(db, 'groups', groupId, 'movies'));

  await runTransaction(db, async (tx) => {
    const groupSnap = await tx.get(groupRef);
    if (!groupSnap.exists()) throw new Error('El grupo ya no existe.');
    const group = groupSnap.data();
    if (group.currentMovieId) {
      throw new Error('Alguien del grupo ya giró la ruleta. Miren la cartelera.');
    }

    tx.set(movieRef, {
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title || movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      year: (movie.release_date || '').slice(0, 4),
      voteAverage: movie.vote_average ?? null,
      genreNames: details?.genreNames?.length ? details.genreNames : genreNames,
      runtime: details?.runtime ?? null,
      tagline: details?.tagline ?? '',
      director: details?.director ?? null,
      cast: details?.cast ?? [],
      recommendations: details?.recommendations ?? [],
      spunGenre: { id: genre.tmdbId, name: genre.name },
      spunBy: user.uid,
      spunByName: firstName(user),
      round: group.round?.number ?? 1,
      status: 'cartelera',
      reviews: {},
      createdAt: serverTimestamp(),
    });
    tx.update(groupRef, { currentMovieId: movieRef.id });
  });

  return movieRef.id;
}

// Cada miembro tiene UN veto por ronda. Vetar descarta la película
// y libera la ruleta para volver a girar.
export async function vetoMovie(groupId, movieId, user) {
  const groupRef = doc(db, 'groups', groupId);
  const movieRef = doc(db, 'groups', groupId, 'movies', movieId);

  await runTransaction(db, async (tx) => {
    const [groupSnap, movieSnap] = [await tx.get(groupRef), await tx.get(movieRef)];
    const group = groupSnap.data();
    const movie = movieSnap.data();

    if (!movie || movie.status !== 'cartelera') {
      throw new Error('Esta película ya no está en cartelera.');
    }
    if (Object.keys(movie.reviews || {}).length > 0) {
      throw new Error('Ya hay reseñas de esta película: no se puede vetar.');
    }
    if ((group.round?.vetoesUsed || []).includes(user.uid)) {
      throw new Error('Ya usaste tu veto en esta ronda.');
    }

    tx.update(movieRef, {
      status: 'vetada',
      vetoedBy: user.uid,
      vetoedByName: firstName(user),
      closedAt: serverTimestamp(),
    });
    tx.update(groupRef, {
      currentMovieId: null,
      'round.vetoesUsed': arrayUnion(user.uid),
    });
  });
}

// Guarda la reseña del usuario. Si con esta reseñaron todos,
// la película pasa a "vista", termina la ronda y se recargan los vetos.
// Devuelve true si la ronda terminó.
export async function submitReview(groupId, movieId, { rating, text }, user) {
  const groupRef = doc(db, 'groups', groupId);
  const movieRef = doc(db, 'groups', groupId, 'movies', movieId);

  return runTransaction(db, async (tx) => {
    const [groupSnap, movieSnap] = [await tx.get(groupRef), await tx.get(movieRef)];
    const group = groupSnap.data();
    const movie = movieSnap.data();

    if (!movie || movie.status !== 'cartelera') {
      throw new Error('Esta función ya terminó.');
    }

    const review = {
      rating,
      text,
      name: firstName(user),
      photo: user.photoURL || null,
      createdAt: Date.now(),
    };
    const reviews = { ...(movie.reviews || {}), [user.uid]: review };
    const everyoneReviewed = group.memberIds.every((id) => reviews[id]);

    tx.update(movieRef, {
      [`reviews.${user.uid}`]: review,
      ...(everyoneReviewed ? { status: 'vista', closedAt: serverTimestamp() } : {}),
    });

    if (everyoneReviewed) {
      tx.update(groupRef, {
        currentMovieId: null,
        round: { number: (group.round?.number ?? 1) + 1, vetoesUsed: [] },
      });
    }
    return everyoneReviewed;
  });
}

// Borra la reseña propia (solo mientras la película sigue en cartelera).
export async function deleteMyReview(groupId, movieId, uid) {
  const movieRef = doc(db, 'groups', groupId, 'movies', movieId);

  await runTransaction(db, async (tx) => {
    const movieSnap = await tx.get(movieRef);
    if (movieSnap.data()?.status !== 'cartelera') {
      throw new Error('La función ya terminó: las reseñas quedan guardadas.');
    }
    tx.update(movieRef, { [`reviews.${uid}`]: deleteField() });
  });
}
