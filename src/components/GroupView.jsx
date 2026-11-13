import { useEffect, useState } from 'react';
import { joinGroup, watchGenres, watchGroup, watchMovies } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';
import Loader from './Loader';
import Roulette from './Roulette';
import MovieTicket from './MovieTicket';
import History from './History';
import GroupSettings from './GroupSettings';
import { EmptyBill, LastShow, VetoNotice } from './LastShow';

// Pantalla de un grupo: ruleta, cartelera e historial.
export default function GroupView({ groupId, user, onExit }) {
  const notify = useToast();
  const [group, setGroup] = useState(undefined); // undefined = cargando, null = no existe
  const [genres, setGenres] = useState(null);
  const [movies, setMovies] = useState(null);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      notify('Ya sos parte del grupo.');
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
      .then(() => notify('Invitación copiada. Pasásela al grupo.'))
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
        <p>
          No existe ningún grupo con el código <span className="code">{groupId}</span>. Revisá que
          esté bien escrito.
        </p>
        <button className="btn btn--ghost" onClick={onExit}>Volver a la boletería</button>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="panel state-panel">
        <p className="state-panel__kicker">Te invitaron a</p>
        <h2 className="display display--xl">{group.name}</h2>
        <p>
          {group.memberIds.length} {group.memberIds.length === 1 ? 'persona ya está' : 'personas ya están'}{' '}
          en este grupo.
        </p>
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
  // La última película que pasó por cartelera en la ronda anterior o en esta.
  const latest = !group.currentMovieId ? movies?.[0] : null;
  const roundNumber = group.round?.number ?? 1;
  const showLastShow = latest?.status === 'vista' && latest.round === roundNumber - 1;
  const showVeto = latest?.status === 'vetada' && latest.round === roundNumber;

  let bill;
  if (movies === null) bill = <Loader text="Cargando la cartelera…" />;
  else if (currentMovie) bill = <MovieTicket movie={currentMovie} group={group} user={user} />;
  else if (group.currentMovieId) bill = <Loader text="Trayendo la película…" />;
  else if (showLastShow) bill = <LastShow movie={latest} />;
  else if (showVeto) bill = <VetoNotice movie={latest} />;
  else bill = <EmptyBill />;

  return (
    <div className="group">
      <header className="group__header">
        <div className="group__heading">
          <nav className="group__nav">
            <button className="btn btn--link" onClick={onExit}>Volver a la boletería</button>
            <button
              className="btn btn--link"
              onClick={() => setShowSettings((open) => !open)}
              aria-expanded={showSettings}
            >
              Ajustes del grupo
            </button>
          </nav>
          <h1 className="display display--xl">{group.name}</h1>
          <ul className="members" aria-label="Integrantes">
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

        <div className="code-stub">
          <span className="code-stub__label">Código del grupo</span>
          <span className="code-stub__value">{group.code}</span>
          <button className="btn btn--outline-ink btn--small" onClick={copyInvite}>
            Copiar invitación
          </button>
        </div>
      </header>

      {showSettings && (
        <GroupSettings
          group={group}
          user={user}
          onClose={() => setShowSettings(false)}
          onExit={onExit}
        />
      )}

      <div className={currentMovie ? 'group-grid has-movie' : 'group-grid'}>
        <section className="panel stage" aria-labelledby="t-ruleta">
          <h2 id="t-ruleta" className="panel__title">La ruleta</h2>
          <Roulette group={group} genres={genres} movies={movies} user={user} />
        </section>

        <section className="panel" aria-labelledby="t-cartelera">
          <h2 id="t-cartelera" className="panel__title">En cartelera</h2>
          {bill}
        </section>
      </div>

      {movies && <History movies={movies} group={group} />}
    </div>
  );
}
