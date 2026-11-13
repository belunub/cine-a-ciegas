import { posterUrl } from '../lib/tmdb';
import { averageRating as average, formatScore } from '../lib/stats';
import Stars from './Stars';
import { ReviewCard } from './Reviews';
import GroupStats from './GroupStats';

// v2: el historial es una colección de TALONES cortados.
// Las vistas muestran el promedio; las vetadas, quién las vetó.
export default function History({ movies }) {
  const past = movies.filter((m) => m.status !== 'cartelera');

  return (
    <section className="archive" aria-labelledby="t-archivo">
      <div className="archive__head">
        <h2 id="t-archivo" className="panel__title">Archivo</h2>
      </div>

      {/* v3: estadísticas del grupo */}
      {past.length > 0 && <GroupStats movies={movies} />}

      {past.length === 0 ? (
        <p className="empty">Cuando terminen una función o veten una película, el talón queda guardado acá.</p>
      ) : (
        <ul className="stubs">
          {past.map((movie) => {
            const avg = average(movie.reviews);
            const vetoed = movie.status === 'vetada';
            return (
              <li key={movie.id}>
                <details className={vetoed ? 'stub stub--vetoed' : 'stub'}>
                  <summary>
                    <img src={posterUrl(movie.posterPath, 'w185')} alt="" loading="lazy" className="stub__poster" />
                    <span className="stub__text">
                      <span className="stub__title">{movie.title}</span>
                      <span className="stub__meta">
                        Función {movie.round}
                        {movie.year ? `, ${movie.year}` : ''}
                      </span>
                      {vetoed ? (
                        <span className="stub__result stub__result--veto">Vetada por {movie.vetoedByName}</span>
                      ) : (
                        <span className="stub__result">
                          {avg !== null && <Stars value={avg} />} {avg !== null && formatScore(avg)}
                        </span>
                      )}
                    </span>
                  </summary>
                  <div className="stub__body">
                    {vetoed ? (
                      <p className="empty">Nadie llegó a verla.</p>
                    ) : (
                      Object.entries(movie.reviews || {}).map(([id, review]) => (
                        <ReviewCard key={id} review={review} />
                      ))
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
