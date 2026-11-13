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

// v3: filtros de la función (duración y época) que elige el grupo.
export const RUNTIME_OPTIONS = [
  { value: 0, label: 'Sin límite' },
  { value: 120, label: 'Hasta 2 h' },
  { value: 100, label: 'Hasta 1 h 40' },
];

export const ERA_OPTIONS = [
  { value: 'all', label: 'Cualquiera', from: null, to: null },
  { value: 'classic', label: 'Antes de 1990', from: null, to: '1989-12-31' },
  { value: '90s00s', label: '1990 a 2009', from: '1990-01-01', to: '2009-12-31' },
  { value: 'recent', label: 'Desde 2010', from: '2010-01-01', to: null },
];

function discoverParams(genreId, filters = {}, page = 1) {
  const params = {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    'vote_count.gte': 150,
    include_adult: 'false',
    page,
  };
  if (filters.maxRuntime) params['with_runtime.lte'] = filters.maxRuntime;
  if (filters.maxRuntime) params['with_runtime.gte'] = 60; // que no salgan cortos
  const era = ERA_OPTIONS.find((e) => e.value === filters.era);
  if (era?.from) params['primary_release_date.gte'] = era.from;
  if (era?.to) params['primary_release_date.lte'] = era.to;
  return params;
}

// Elige una película al azar de un género, respetando los filtros del grupo
// y evitando las que el grupo ya tuvo.
export async function pickRandomMovie(genreId, excludeTmdbIds = [], filters = {}) {
  const excluded = new Set(excludeTmdbIds);
  const usable = (data) =>
    (data.results || []).filter((m) => !excluded.has(m.id) && m.poster_path && m.overview);

  // La primera página nos dice cuántas páginas hay con estos filtros.
  const first = await tmdbFetch('/discover/movie', discoverParams(genreId, filters, 1));
  const totalPages = Math.min(first.total_pages || 1, 10);

  for (let attempt = 0; attempt < 4; attempt++) {
    const page = 1 + Math.floor(Math.random() * totalPages);
    const data =
      page === 1 ? first : await tmdbFetch('/discover/movie', discoverParams(genreId, filters, page));
    const candidates = usable(data);
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  const candidates = usable(first);
  if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];

  const filtered = filters.maxRuntime || (filters.era && filters.era !== 'all');
  throw new Error(
    filtered
      ? 'No quedan películas nuevas de ese género con estos filtros. Prueben aflojar la duración o la época.'
      : 'No encontramos una película nueva de ese género. Probá girar de nuevo.',
  );
}

// v3: dónde verla en Argentina. Lo pedimos en el momento porque cambia seguido.
// Los datos los provee JustWatch a través de TMDB.
export async function getWatchProviders(movieId) {
  const data = await tmdbFetch(`/movie/${movieId}/watch/providers`, {});
  const ar = data.results?.AR;
  if (!ar) return { link: null, groups: [] };

  const toList = (items) =>
    (items || [])
      .sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99))
      .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));

  const groups = [
    { key: 'flatrate', label: 'Incluida en', items: toList(ar.flatrate) },
    { key: 'free', label: 'Gratis en', items: toList([...(ar.free || []), ...(ar.ads || [])]) },
    { key: 'rent', label: 'Para alquilar', items: toList(ar.rent) },
    { key: 'buy', label: 'Para comprar', items: toList(ar.buy) },
  ].filter((g) => g.items.length > 0);

  return { link: ar.link || null, groups };
}

export function logoUrl(path) {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : null;
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
