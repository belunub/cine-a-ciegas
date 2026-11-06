import { useEffect, useRef, useState } from 'react';
import Wheel from './Wheel';
import GenreManager from './GenreManager';
import { rotationFor } from '../lib/wheel';
import { getMovieGenres, pickRandomMovie } from '../lib/tmdb';
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
  const spinDone = useRef(null);

  useEffect(() => {
    getMovieGenres()
      .then(setAllGenres)
      .catch((err) => setGenresError(err.message));
  }, []);

  const hasMovie = Boolean(group.currentMovieId);
  const enoughGenres = genres && genres.length >= 2;
  const canSpin = enoughGenres && !hasMovie && !spinning;

  let hint = null;
  if (genres === null) hint = 'Cargando la ruleta…';
  else if (!enoughGenres) hint = 'Sumen al menos 2 géneros para poder girar.';
  else if (hasMovie) hint = 'Hay una película en cartelera. Cuando todos la reseñen (o alguien la vete), se vuelve a girar.';

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

    const index = Math.floor(Math.random() * genres.length);
    const genre = genres[index];
    const excludeIds = (movies || []).map((m) => m.tmdbId);

    // Buscamos la película mientras la ruleta gira.
    const moviePromise = pickRandomMovie(genre.tmdbId, excludeIds);
    moviePromise.catch(() => {}); // el error se maneja abajo

    try {
      await animateTo(index);
      const movie = await moviePromise;
      const names = (movie.genre_ids || [])
        .map((id) => allGenres?.find((g) => g.id === id)?.name)
        .filter(Boolean);
      // CREATE: guardamos la película en Firestore
      await putMovieOnBill(group.id, movie, genre, names, user);
      notify(`¡Salió ${genre.name}! Les toca: ${movie.title}.`);
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setSpinning(false);
    }
  }

  const vetoesUsed = group.round?.vetoesUsed?.length ?? 0;

  return (
    <div className="roulette">
      <Wheel
        genres={genres || []}
        rotation={rotation}
        spinning={spinning}
        onSpinEnd={() => spinDone.current?.()}
      />

      <button className="btn btn--primary btn--big btn--block" onClick={handleSpin} disabled={!canSpin}>
        {spinning ? 'Girando…' : 'Girar la ruleta'}
      </button>
      {hint && <p className="hint">{hint}</p>}

      <p className="mono round-info">
        Ronda {group.round?.number ?? 1} · Vetos usados: {vetoesUsed}/{group.memberIds.length}
      </p>

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
