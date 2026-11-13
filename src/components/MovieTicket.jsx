import { useState } from 'react';
import { formatRuntime, posterUrl } from '../lib/tmdb';
import { formatScore } from '../lib/stats';
import { deleteMyReview, submitReview, vetoMovie } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';
import { useMovieDetails } from '../lib/useMovieDetails';
import ReviewForm from './ReviewForm';
import Stars from './Stars';
import { SealedReview } from './Reviews';
import { Cast, Recommendations } from './MovieExtras';
import WatchProviders from './WatchProviders';

function shortName(group, id) {
  return (group.members?.[id]?.name || 'Alguien').split(' ')[0];
}

// v2: la película en cartelera es una ENTRADA troquelada.
//  - Cuerpo: póster y datos de la película.
//  - Talón: veto y reseñas. Reseñar es "cortar el talón": aparece el sello VISTA.
export default function MovieTicket({ movie: rawMovie, group, user }) {
  const movie = useMovieDetails(rawMovie);
  const notify = useToast();
  const [confirmingVeto, setConfirmingVeto] = useState(false);
  const [vetoing, setVetoing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reviews = movie.reviews || {};
  const myReview = reviews[user.uid];
  const reviewCount = Object.keys(reviews).length;
  const vetoesUsed = group.round?.vetoesUsed || [];
  const iUsedVeto = vetoesUsed.includes(user.uid);
  const canVeto = !iUsedVeto && reviewCount === 0;
  const noVetoesLeft = vetoesUsed.length >= group.memberIds.length;

  let vetoHint = 'Tenés un veto en esta ronda.';
  if (noVetoesLeft) vetoHint = 'Ya no quedan vetos: esta se ve sí o sí.';
  else if (iUsedVeto) vetoHint = 'Ya usaste tu veto en esta ronda.';
  else if (reviewCount > 0) vetoHint = 'Ya hay reseñas, así que no se puede vetar.';

  const runtime = formatRuntime(movie.runtime);
  const ticketNumber = `${group.code}-${String(movie.round ?? 1).padStart(3, '0')}`;

  async function handleVeto() {
    setVetoing(true);
    try {
      await vetoMovie(group.id, movie.id, user); // UPDATE en Firestore
      notify('Película vetada. Pueden girar de nuevo.');
    } catch (err) {
      notify(friendlyError(err), 'error');
      setVetoing(false);
      setConfirmingVeto(false);
    }
  }

  async function handleReview(data) {
    const roundFinished = await submitReview(group.id, movie.id, data, user); // UPDATE
    notify(
      roundFinished
        ? 'Reseñaron todos. Se revelan las reseñas y se recargan los vetos.'
        : 'Reseña guardada. Se revela cuando reseñe el resto del grupo.',
    );
  }

  async function handleDeleteReview() {
    setDeleting(true);
    try {
      await deleteMyReview(group.id, movie.id, user.uid); // DELETE de un campo
      notify('Borraste tu reseña. Podés escribirla de nuevo.');
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bill">
      <article className="entrada" key={movie.id}>
        {/* ── Cuerpo de la entrada ── */}
        <div className="entrada__cuerpo paper notch-bottom">
          <p className="entrada__print">
            <span>Función {movie.round ?? 1}</span>
            <span>Nº {ticketNumber}</span>
          </p>

          <div className="entrada__main">
            <img
              className="entrada__poster"
              src={posterUrl(movie.posterPath)}
              alt={`Póster de ${movie.title}`}
            />
            <div className="entrada__info">
              <p className="entrada__origin">
                Salió <strong>{movie.spunGenre?.name}</strong>, giró {movie.spunByName}
              </p>
              <h3 className="entrada__title">{movie.title}</h3>
              {movie.tagline && <p className="entrada__tagline">{movie.tagline}</p>}

              <dl className="facts">
                {movie.year && (
                  <div>
                    <dt>Año</dt>
                    <dd>{movie.year}</dd>
                  </div>
                )}
                {runtime && (
                  <div>
                    <dt>Duración</dt>
                    <dd>{runtime}</dd>
                  </div>
                )}
                {movie.director && (
                  <div>
                    <dt>Dirección</dt>
                    <dd>{movie.director}</dd>
                  </div>
                )}
                {movie.voteAverage ? (
                  <div>
                    <dt>TMDB</dt>
                    <dd>{formatScore(movie.voteAverage)}/10</dd>
                  </div>
                ) : null}
              </dl>

              {movie.genreNames?.length > 0 && (
                <ul className="tags" aria-label="Géneros">
                  {movie.genreNames.map((name) => (
                    <li key={name} className="tag">{name}</li>
                  ))}
                </ul>
              )}
              <p className="entrada__overview">{movie.overview}</p>
              <WatchProviders tmdbId={movie.tmdbId} />
            </div>
          </div>
        </div>

        {/* ── Talón ── */}
        <div className="entrada__talon paper paper--stub notch-top">
          <div className="veto">
            {confirmingVeto ? (
              <>
                <span className="veto__ask">¿Usás tu único veto de la ronda?</span>
                <button className="btn btn--ink btn--small" onClick={handleVeto} disabled={vetoing}>
                  {vetoing ? 'Vetando…' : 'Sí, vetar'}
                </button>
                <button
                  className="btn btn--link-ink"
                  onClick={() => setConfirmingVeto(false)}
                  disabled={vetoing}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn--outline-ink btn--small"
                  onClick={() => setConfirmingVeto(true)}
                  disabled={!canVeto}
                >
                  Vetar
                </button>
                <span className="veto__hint">{vetoHint}</span>
              </>
            )}
          </div>

          <div className="talon__section">
            <h4 className="talon__title">
              Reseñas <span className="talon__count">{reviewCount} de {group.memberIds.length}</span>
            </h4>

            {myReview ? (
              <div className="my-review">
                <span className="stamp" aria-hidden="true">Vista</span>
                <p className="my-review__label">Tu reseña</p>
                <Stars value={myReview.rating} />
                <p className="my-review__text">{myReview.text}</p>
                <button className="btn btn--link-ink" onClick={handleDeleteReview} disabled={deleting}>
                  {deleting ? 'Borrando…' : 'Borrar y reescribir'}
                </button>
              </div>
            ) : (
              <ReviewForm onSubmit={handleReview} />
            )}

            <ul className="sealed-list">
              {group.memberIds
                .filter((id) => id !== user.uid)
                .map((id) => (
                  <li key={id}>
                    {reviews[id] ? (
                      <SealedReview name={shortName(group, id)} />
                    ) : (
                      <div className="review-card review-card--pending">
                        <span className="review-card__name">{shortName(group, id)}</span>
                        <span className="review-card__seal">Todavía no la vio</span>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </article>

      <Cast cast={movie.cast} />
      <Recommendations items={movie.recommendations} />
    </div>
  );
}
