import { useEffect, useState } from 'react';
import { joinGroup, watchGenres, watchGroup, watchMovies } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';
import Loader from './Loader';
import Roulette from './Roulette';
import MovieTicket from './MovieTicket';
import History from './History';

// Pantalla de un grupo: ruleta, cartelera e historial.
export default function GroupView({ groupId, user, onExit }) {
  const notify = useToast();
  const [group, setGroup] = useState(undefined); // undefined = cargando, null = no existe
  const [genres, setGenres] = useState(null);
  const [movies, setMovies] = useState(null);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  // READ en tiempo real del grupo.
  useEffect(
    () => watchGroup(groupId, setGroup, (err) => setError(friendlyError(err))),
    [groupId],
  );

  const isMember = Boolean(group?.memberIds?.includes(user.uid));

  // Géneros y películas: solo los miembros tienen permiso para leerlos.
  useEffect(() => {
    if (!isMember) return undefined;
    const onError = (err) => setError(friendlyError(err));
    const stopGenres = watchGenres(groupId, setGenres, onError);
    const stopMovies = watchMovies(groupId, setMovies, onError);
    return () => {
      stopGenres();
      stopMovies();
    };
  }, [groupId, isMember]);

  async function handleJoin() {
    setJoining(true);
    try {
      await joinGroup(groupId, user);
      notify('¡Listo! Ya sos parte del grupo.');
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setJoining(false);
    }
  }

  function copyInvite() {
    const link = `${window.location.origin}/#/g/${groupId}`;
    navigator.clipboard
      .writeText(`Sumate a "${group.name}" en Cine a Ciegas: ${link} (código ${groupId})`)
      .then(() => notify('Invitación copiada. ¡Pasásela al grupo!'))
      .catch(() => notify(`No se pudo copiar. El código es ${groupId}.`, 'error'));
  }

  if (error) {
    return (
      <div className="panel state-panel">
        <p className="form-error">{error}</p>
        <button className="btn btn--ghost" onClick={onExit}>Volver a la boletería</button>
      </div>
    );
  }

  if (group === undefined) return <Loader text="Buscando el grupo…" />;

  if (group === null) {
    return (
      <div className="panel state-panel">
        <h2 className="display">Grupo no encontrado</h2>
        <p>No existe ningún grupo con el código <span className="mono">{groupId}</span>.</p>
        <button className="btn btn--ghost" onClick={onExit}>Volver a la boletería</button>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="panel state-panel">
        <p className="mono">Invitación · Nº {group.code}</p>
        <h2 className="display">{group.name}</h2>
        <p>Te invitaron a este grupo. ¿Te sumás a la función?</p>
        <div className="actions">
          <button className="btn btn--primary" onClick={handleJoin} disabled={joining}>
            {joining ? 'Sumándote…' : 'Unirme al grupo'}
          </button>
          <button className="btn btn--ghost" onClick={onExit}>Ahora no</button>
        </div>
      </div>
    );
  }

  const currentMovie = movies?.find((m) => m.id === group.currentMovieId);

  return (
    <div className="group">
      <header className="group__header">
        <div>
          <button className="btn btn--link" onClick={onExit}>← Boletería</button>
          <h1 className="display display--xl">{group.name}</h1>
          <ul className="members">
            {group.memberIds.map((id) => {
              const member = group.members?.[id];
              return (
                <li key={id} className="member">
                  {member?.photo ? (
                    <img className="avatar" src={member.photo} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="avatar avatar--empty" aria-hidden="true">
                      {(member?.name || '?')[0]}
                    </span>
                  )}
                  {(member?.name || 'Alguien').split(' ')[0]}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="group__code">
          <span className="mono group__code-label">Ticket Nº</span>
          <span className="mono group__code-value">{group.code}</span>
          <button className="btn btn--ghost btn--small" onClick={copyInvite}>Copiar invitación</button>
        </div>
      </header>

      <div className={group.currentMovieId ? 'group-grid has-movie' : 'group-grid'}>
        <section className="panel group-grid__roulette">
          <h2 className="panel__title">La ruleta</h2>
          <Roulette group={group} genres={genres} movies={movies} user={user} />
        </section>

        <section className="panel group-grid__bill">
          <h2 className="panel__title">Cartelera</h2>
          {movies === null && <Loader text="Cargando la cartelera…" />}
          {movies !== null && currentMovie && (
            <MovieTicket movie={currentMovie} group={group} user={user} />
          )}
          {movies !== null && !group.currentMovieId && (
            <div className="empty-bill">
              <p className="display">Sin función</p>
              <p>No hay ninguna película en cartelera. ¡Giren la ruleta!</p>
            </div>
          )}
          {movies !== null && group.currentMovieId && !currentMovie && (
            <Loader text="Trayendo la película…" />
          )}
        </section>
      </div>

      {movies && <History movies={movies} />}
    </div>
  );
}
