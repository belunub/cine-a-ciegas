import { useState } from 'react';
import { posterUrl } from '../lib/tmdb';
import { deleteMyReview, submitReview, vetoMovie } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';
import ReviewForm from './ReviewForm';
import Stars from './Stars';

// La película en cartelera: datos, veto y reseñas del grupo.
export default function MovieTicket({ movie, group, user }) {
  const notify = useToast();
  const [vetoing, setVetoing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reviews = movie.reviews || {};
  const myReview = reviews[user.uid];
  const reviewCount = Object.keys(reviews).length;
  const vetoesUsed = group.round?.vetoesUsed || [];
  const iUsedVeto = vetoesUsed.includes(user.uid);
  const canVeto = !iUsedVeto && reviewCount === 0;

  let vetoHint = 'Tenés 1 veto en esta ronda.';
  if (iUsedVeto) vetoHint = 'Ya usaste tu veto en esta ronda.';
  else if (reviewCount > 0) vetoHint = 'Ya hay reseñas: esta película no se puede vetar.';
  if (vetoesUsed.length >= group.memberIds.length) vetoHint = 'Se acabaron los vetos: esta va sí o sí.';

  async function handleVeto() {
    const ok = window.confirm(`¿Usar tu veto con "${movie.title}"? Solo tenés uno por ronda.`);
    if (!ok) return;
    setVetoing(true);
    try {
      await vetoMovie(group.id, movie.id, user); // UPDATE en Firestore
      notify('Película vetada. ¡A girar de nuevo!');
    } catch (err) {
      notify(friendlyError(err), 'error');
      setVetoing(false);
    }
  }

  async function handleReview(data) {
    const roundFinished = await submitReview(group.id, movie.id, data, user); // UPDATE
    notify(
      roundFinished
        ? '¡Reseñaron todos! Función terminada: los vetos se recargan y pueden volver a girar.'
        : 'Reseña guardada. Falta que reseñe el resto del grupo.',
    );
  }

  async function handleDeleteReview() {
    setDeleting(true);
    try {
      await deleteMyReview(group.id, movie.id, user.uid); // DELETE de un campo
      notify('Borraste tu reseña.');
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="ticket">
      <div className="ticket__main">
        <img
          className="ticket__poster"
          src={posterUrl(movie.posterPath)}
          alt={`Póster de ${movie.title}`}
          loading="lazy"
        />
        <div className="ticket__info">
          <p className="mono ticket__kicker">
            Salió {movie.spunGenre?.name} · giró {movie.spunByName}
          </p>
          <h3 className="ticket__title">{movie.title}</h3>
          <p className="mono ticket__meta">
            {movie.year}
            {movie.voteAverage ? ` · TMDB ${movie.voteAverage.toFixed(1)}/10` : ''}
          </p>
          {movie.genreNames?.length > 0 && (
            <ul className="tags">
              {movie.genreNames.map((name) => (
                <li key={name} className="tag">{name}</li>
              ))}
            </ul>
          )}
          <p className="ticket__overview">{movie.overview}</p>
        </div>
      </div>

      <div className="ticket__stub">
        <div className="veto">
          <button className="btn btn--ghost-dark" onClick={handleVeto} disabled={!canVeto || vetoing}>
            {vetoing ? 'Vetando…' : 'Vetar'}
          </button>
          <span className="veto__hint">{vetoHint}</span>
        </div>

        <h4 className="ticket__subtitle">
          Reseñas ({reviewCount}/{group.memberIds.length})
        </h4>
        <ul className="members-status">
          {group.memberIds.map((id) => (
            <li key={id} className={reviews[id] ? 'is-done' : ''}>
              {reviews[id] ? '✓' : '…'} {(group.members?.[id]?.name || 'Alguien').split(' ')[0]}
            </li>
          ))}
        </ul>

        {myReview ? (
          <div className="my-review">
            <p className="mono">Tu reseña</p>
            <Stars value={myReview.rating} />
            <p>{myReview.text}</p>
            <button className="btn btn--link" onClick={handleDeleteReview} disabled={deleting}>
              {deleting ? 'Borrando…' : 'Borrar mi reseña'}
            </button>
          </div>
        ) : (
          <ReviewForm onSubmit={handleReview} />
        )}

        {Object.entries(reviews)
          .filter(([id]) => id !== user.uid)
          .map(([id, review]) => (
            <div key={id} className="review">
              <p className="review__name">
                {review.name} <Stars value={review.rating} />
              </p>
              <p>{review.text}</p>
            </div>
          ))}
      </div>
    </article>
  );
}
