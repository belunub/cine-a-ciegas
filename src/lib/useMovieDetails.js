import { useEffect, useState } from 'react';
import { getMovieDetails } from './tmdb';

// Devuelve la película con su ficha completa.
// Desde la v2 la ficha se guarda en Firestore al girar; para películas
// guardadas con la v1 (sin elenco), la pedimos a TMDB en el momento.
export function useMovieDetails(movie) {
  const needsFetch = !Array.isArray(movie.cast);
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    if (!needsFetch) return undefined;
    let active = true;
    getMovieDetails(movie.tmdbId)
      .then((details) => active && setFetched(details))
      .catch(() => {}); // si falla, mostramos la película sin elenco
    return () => {
      active = false;
    };
  }, [needsFetch, movie.tmdbId]);

  return needsFetch && fetched ? { ...movie, ...fetched } : movie;
}
