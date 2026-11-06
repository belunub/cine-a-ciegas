import { posterUrl } from '../lib/tmdb';
import Stars from './Stars';

function average(reviews) {
  const values = Object.values(reviews || {}).map((r) => r.rating);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// Películas que ya pasaron por la cartelera: vistas o vetadas.
export default function History({ movies }) {
  const past = movies.filter((m) => m.status !== 'cartelera');

  return (
    <section className="panel history">
      <h2 className="panel__title">Historial</h2>
      {past.length === 0 ? (
        <p className="empty">Acá van a aparecer las películas que vean (y las que veten).</p>
      ) : (
        <ul className="history__list">
          {past.map((movie) => {
            const avg = average(movie.reviews);
            return (
              <li key={movie.id}>
                <details className="history__item">
                  <summary>
                    <img src={posterUrl(movie.posterPath, 'w92')} alt="" loading="lazy" />
                    <span className="history__text">
                      <span className="history__title">{movie.title}</span>
                      <span className="mono history__meta">
                        {movie.year} · Ronda {movie.round}
                      </span>
                    </span>
                    {movie.status === 'vista' ? (
                      <span className="badge badge--ok">
                        Vista {avg !== null && <>· {avg.toFixed(1)} ★</>}
                      </span>
                    ) : (
                      <span className="badge badge--veto">Vetada por {movie.vetoedByName}</span>
                    )}
                  </summary>
                  {movie.status === 'vista' ? (
                    <div className="history__reviews">
                      {Object.entries(movie.reviews || {}).map(([id, review]) => (
                        <div key={id} className="review">
                          <p className="review__name">
                            {review.name} <Stars value={review.rating} />
                          </p>
                          <p>{review.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="history__reviews empty">Nadie llegó a verla: la vetaron antes.</p>
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
