import { useState } from 'react';
import { posterUrl } from '../lib/tmdb';
import { averageRating as average, formatScore } from '../lib/stats';
import Stars from './Stars';
import { ReviewCard } from './Reviews';
import GroupStats from './GroupStats';
import ReactionBar from './ReactionBar';
import MovieChat from './MovieChat';

// v2: el historial es una colección de TALONES cortados.
// Las vistas muestran el promedio; las vetadas, quién las vetó.
export default function History({ movies, groupId, user }) {
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
          {past.map((movie) => (
            <li key={movie.id}>
              <Stub movie={movie} groupId={groupId} user={user} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Un talón del archivo. v4: al abrirlo aparecen las reacciones y la charla.
// La charla se monta solo cuando el talón está abierto, para no escuchar
// los comentarios de todas las películas a la vez.
function Stub({ movie, groupId, user }) {
  const [open, setOpen] = useState(false);
  const avg = average(movie.reviews);
  const vetoed = movie.status === 'vetada';

  return (
    <details className={vetoed ? 'stub stub--vetoed' : 'stub'} onToggle={(e) => setOpen(e.currentTarget.open)}>
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
            <ReviewCard key={id} review={review}>
              <ReactionBar groupId={groupId} movie={movie} reviewerUid={id} user={user} />
            </ReviewCard>
          ))
        )}
        {open && <MovieChat groupId={groupId} movie={movie} user={user} tone="paper" />}
      </div>
    </details>
  );
}
