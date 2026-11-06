// ─────────────────────────────────────────────────────────────
// API DE PELÍCULAS (TMDB)
// TMDB nos da los géneros, y películas al azar con póster y sinopsis.
// Esta app usa la API de TMDB pero no está avalada ni certificada por TMDB.
// ─────────────────────────────────────────────────────────────
const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_TOKEN;
const LANGUAGE = 'es-MX'; // español latinoamericano: más traducciones disponibles que es-AR

export const tmdbReady = Boolean(TOKEN);

export function posterUrl(path, size = 'w342') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function profileUrl(path) {
  return path ? `https://image.tmdb.org/t/p/w185${path}` : null;
}

export function tmdbMovieLink(id) {
  return `https://www.themoviedb.org/movie/${id}`;
}

async function tmdbFetch(path, params = {}) {
  const url = new URL(BASE_URL + path);
  Object.entries({ language: LANGUAGE, ...params }).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
    });
  } catch {
    throw new Error('No pudimos conectar con TMDB. Revisá tu conexión a internet.');
  }

  if (response.status === 401) {
    throw new Error('La clave de TMDB no es válida. Revisá VITE_TMDB_TOKEN en el archivo .env.');
  }
  if (!response.ok) {
    throw new Error(`TMDB respondió con un error (${response.status}). Probá de nuevo en un rato.`);
  }
  return response.json();
}

// Lista oficial de géneros de películas: [{ id: 27, name: 'Terror' }, ...]
let genresCache = null;
export async function getMovieGenres() {
  if (genresCache) return genresCache;
  const data = await tmdbFetch('/genre/movie/list');
  genresCache = data.genres;
  return genresCache;
}

// Elige una película al azar de un género, evitando las que el grupo ya tuvo.
export async function pickRandomMovie(genreId, excludeTmdbIds = []) {
  const excluded = new Set(excludeTmdbIds);

  for (let attempt = 0; attempt < 4; attempt++) {
    // Primero probamos páginas más profundas (más variedad), después las primeras.
    const maxPage = attempt < 2 ? 10 : 3;
    const page = 1 + Math.floor(Math.random() * maxPage);

    const data = await tmdbFetch('/discover/movie', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      include_adult: 'false',
      page,
    });

    const candidates = (data.results || []).filter(
      (movie) => !excluded.has(movie.id) && movie.poster_path && movie.overview,
    );
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  throw new Error('No encontramos una película nueva de ese género. Probá girar de nuevo.');
}

// v2: ficha completa de una película (duración, director, elenco y recomendaciones)
// en una sola llamada, usando append_to_response.
export async function getMovieDetails(movieId) {
  const data = await tmdbFetch(`/movie/${movieId}`, {
    append_to_response: 'credits,recommendations',
  });
  const director = (data.credits?.crew || []).find((person) => person.job === 'Director');

  return {
    runtime: data.runtime || null,
    tagline: data.tagline || '',
    director: director ? director.name : null,
    genreNames: (data.genres || []).map((g) => g.name),
    cast: (data.credits?.cast || []).slice(0, 8).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || '',
      profilePath: person.profile_path || null,
    })),
    recommendations: (data.recommendations?.results || [])
      .filter((movie) => movie.poster_path)
      .slice(0, 10)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        year: (movie.release_date || '').slice(0, 4),
      })),
  };
}

// "112" → "1 h 52 min"
export function formatRuntime(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}
