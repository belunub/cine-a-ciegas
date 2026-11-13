import { useEffect, useRef, useState } from 'react';
import Wheel from './Wheel';
import GenreManager from './GenreManager';
import FunctionFilters from './FunctionFilters';
import { rotationFor } from '../lib/wheel';
import { getMovieDetails, getMovieGenres, pickRandomMovie } from '../lib/tmdb';
import { putMovieOnBill } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';

const SPIN_MS = 4600;

// Sección de la ruleta: dibuja la rueda, gira y guarda la película que salió.
export default function Roulette({ group, genres, movies, user }) {
  const notify = useToast();
  const [allGenres, setAllGenres] = useState(null); // lista completa de géneros de TMDB
  const [genresError, setGenresError] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null); // { index, name } de la última tirada
  const spinDone = useRef(null);

  useEffect(() => {
    getMovieGenres()
      .then(setAllGenres)
      .catch((err) => setGenresError(err.message));
  }, []);

  // Si cambian los géneros, la porción ganadora ya no es la misma: la olvidamos.
  const genreCount = genres?.length ?? 0;
  useEffect(() => setWinner(null), [genreCount]);

  const hasMovie = Boolean(group.currentMovieId);
  const enoughGenres = genres && genres.length >= 2;
  const canSpin = enoughGenres && !hasMovie && !spinning;

  let hint = null;
  if (genres === null) hint = 'Cargando la ruleta…';
  else if (!enoughGenres) hint = 'Sumen al menos 2 géneros para poder girar.';
  else if (hasMovie) hint = 'Hay una película en cartelera. Se vuelve a girar cuando reseñen todos o alguien la vete.';

  // Devuelve una promesa que se resuelve cuando termina la animación.
  function animateTo(index) {
    return new Promise((resolve) => {
      const timer = setTimeout(finish, SPIN_MS + 600); // por si el navegador no avisa el final
      function finish() {
        clearTimeout(timer);
        spinDone.current = null;
        resolve();
      }
      spinDone.current = finish;
      setRotation((current) => rotationFor(index, genres.length, current));
    });
  }

  async function handleSpin() {
    if (!canSpin) return;
    setSpinning(true);
    setWinner(null);

    const index = Math.floor(Math.random() * genres.length);
    const genre = genres[index];
    const excludeIds = (movies || []).map((m) => m.tmdbId);

    // Mientras la ruleta gira, buscamos la película y su ficha completa.
    const moviePromise = pickRandomMovie(genre.tmdbId, excludeIds, group.filters);
    const detailsPromise = moviePromise.then((m) => getMovieDetails(m.id)).catch(() => null);
    moviePromise.catch(() => {}); // el error se maneja abajo

    try {
      await animateTo(index);
      setWinner({ index, name: genre.name });
      const movie = await moviePromise;
      const details = await detailsPromise; // si falla, guardamos la película igual
      const names = (movie.genre_ids || [])
        .map((id) => allGenres?.find((g) => g.id === id)?.name)
        .filter(Boolean);
      // CREATE: guardamos la película en Firestore
      await putMovieOnBill(group.id, movie, genre, names, details, user);
      notify(`Salió ${genre.name}. Les toca ${movie.title}.`);
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setSpinning(false);
    }
  }

  const vetoesLeft = group.memberIds.length - (group.round?.vetoesUsed?.length ?? 0);

  return (
    <div className="roulette">
      <Wheel
        genres={genres || []}
        rotation={rotation}
        spinning={spinning}
        winnerIndex={spinning ? null : winner?.index}
        onSpinEnd={() => spinDone.current?.()}
      />

      <p className="roulette__result" aria-live="polite">
        {winner && !spinning ? <>Salió <strong>{winner.name}</strong></> : ' '}
      </p>

      <FunctionFilters group={group} disabled={spinning || hasMovie} />

      <button className="btn btn--primary btn--big btn--block" onClick={handleSpin} disabled={!canSpin}>
        {spinning ? 'Girando…' : 'Girar la ruleta'}
      </button>
      {hint && <p className="hint">{hint}</p>}

      <dl className="round-info">
        <div>
          <dt>Ronda</dt>
          <dd>{group.round?.number ?? 1}</dd>
        </div>
        <div>
          <dt>Vetos disponibles</dt>
          <dd>
            {vetoesLeft} de {group.memberIds.length}
          </dd>
        </div>
      </dl>

      <GenreManager
        groupId={group.id}
        user={user}
        genres={genres}
        allGenres={allGenres}
        genresError={genresError}
        disabled={spinning}
      />
    </div>
  );
}
