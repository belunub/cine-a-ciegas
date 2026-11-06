import { posterUrl } from '../lib/tmdb';
import Stars from './Stars';
import { ReviewCard } from './Reviews';

function average(reviews) {
  const values = Object.values(reviews || {}).map((r) => r.rating);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// v2: cuando reseña el último, la película sale de cartelera y acá se REVELAN
// todas las reseñas juntas. Queda visible hasta que alguien vuelva a girar.
export function LastShow({ movie }) {
  const avg = average(movie.reviews);
  const reviews = Object.entries(movie.reviews || {});

  return (
    <div className="last-show">
      <div className="last-show__head">
        <img src={posterUrl(movie.posterPath, 'w185')} alt="" className="last-show__poster" />
        <div>
          <p className="last-show__kicker">Función terminada</p>
          <h3 className="last-show__title">{movie.title}</h3>
          {avg !== null && (
            <p className="last-show__avg">
              <span className="last-show__avg-number">{avg.toFixed(1)}</span>
              <Stars value={avg} />
              <span className="last-show__avg-label">promedio del grupo</span>
            </p>
          )}
        </div>
      </div>

      <div className="reveal">
        {reviews.map(([id, review], i) => (
          <ReviewCard key={id} review={review} style={{ animationDelay: `${150 + i * 160}ms` }} />
        ))}
      </div>

      <p className="last-show__next">Los vetos se recargaron. Giren la ruleta para la próxima función.</p>
    </div>
  );
}

// Aviso cuando la última película fue vetada.
export function VetoNotice({ movie }) {
  return (
    <div className="empty-bill">
      <p className="empty-bill__title">Vetada</p>
      <p>
        {movie.vetoedByName} vetó <em>{movie.title}</em>. La ruleta está libre: giren de nuevo.
      </p>
    </div>
  );
}

export function EmptyBill() {
  return (
    <div className="empty-bill">
      <p className="empty-bill__title">Sin función</p>
      <p>No hay ninguna película en cartelera. Giren la ruleta para que salga una.</p>
    </div>
  );
}
