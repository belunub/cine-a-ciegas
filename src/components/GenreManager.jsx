import { useState } from 'react';
import { addGenre, removeGenre, MAX_GENRES } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';
import Loader from './Loader';

// Agregar y quitar géneros de la ruleta (CREATE y DELETE en Firestore).
export default function GenreManager({ groupId, user, genres, allGenres, genresError, disabled }) {
  const notify = useToast();
  const [selected, setSelected] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  if (genresError) return <p className="form-error">{genresError}</p>;
  if (!allGenres || genres === null) return <Loader text="Cargando géneros…" />;

  const usedIds = new Set(genres.map((g) => g.tmdbId));
  const available = allGenres.filter((g) => !usedIds.has(g.id));
  const full = genres.length >= MAX_GENRES;

  async function handleAdd(event) {
    event.preventDefault();
    const genre = allGenres.find((g) => String(g.id) === selected);
    if (!genre) {
      notify('Elegí un género de la lista.', 'error');
      return;
    }
    setAdding(true);
    try {
      await addGenre(groupId, genre, user);
      notify(`${genre.name} entró en la ruleta.`);
      setSelected('');
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(genre) {
    setRemovingId(genre.id);
    try {
      await removeGenre(groupId, genre.id);
      notify(`Sacaste ${genre.name} de la ruleta.`);
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="genres">
      <h3 className="genres__title">Géneros en la ruleta ({genres.length}/{MAX_GENRES})</h3>

      <form className="genres__form" onSubmit={handleAdd}>
        <label className="sr-only" htmlFor="genre-select">Género</label>
        <select
          id="genre-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={full || adding || disabled}
        >
          <option value="">{full ? 'La ruleta está completa' : 'Elegí un género…'}</option>
          {available.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button className="btn btn--primary" disabled={!selected || full || adding || disabled}>
          {adding ? 'Sumando…' : 'Sumar'}
        </button>
      </form>

      {genres.length === 0 ? (
        <p className="empty">Todavía no hay géneros. ¡Cada uno sume los que le gustan!</p>
      ) : (
        <ul className="chips">
          {genres.map((genre) => (
            <li key={genre.id} className="chip">
              <span>{genre.name}</span>
              <span className="chip__by">de {genre.addedByName}</span>
              <button
                className="chip__remove"
                onClick={() => handleRemove(genre)}
                disabled={removingId === genre.id || disabled}
                aria-label={`Sacar ${genre.name} de la ruleta`}
                title="Sacar de la ruleta"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
