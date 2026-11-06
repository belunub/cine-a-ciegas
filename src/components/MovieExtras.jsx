import { posterUrl, profileUrl, tmdbMovieLink } from '../lib/tmdb';

// Fila con el elenco principal.
export function Cast({ cast }) {
  if (!cast?.length) return null;
  return (
    <section className="extras">
      <h3 className="extras__title">Reparto</h3>
      <ul className="strip">
        {cast.map((person) => (
          <li key={person.id} className="person">
            {person.profilePath ? (
              <img src={profileUrl(person.profilePath)} alt="" loading="lazy" className="person__photo" />
            ) : (
              <span className="person__photo person__photo--empty" aria-hidden="true">
                {person.name[0]}
              </span>
            )}
            <span className="person__name">{person.name}</span>
            {person.character && <span className="person__role">{person.character}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Fila de películas parecidas (recomendaciones de TMDB).
export function Recommendations({ items }) {
  if (!items?.length) return null;
  return (
    <section className="extras">
      <h3 className="extras__title">Si les gusta esta, también</h3>
      <ul className="strip">
        {items.map((movie) => (
          <li key={movie.id}>
            <a className="rec" href={tmdbMovieLink(movie.id)} target="_blank" rel="noreferrer">
              <img src={posterUrl(movie.posterPath, 'w185')} alt="" loading="lazy" />
              <span className="rec__title">{movie.title}</span>
              {movie.year && <span className="rec__year">{movie.year}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
