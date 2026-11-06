import { useEffect, useState } from 'react';
import { createGroup, joinGroup, watchMyGroups } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';
import Loader from './Loader';

// Pantalla inicial: crear grupo, unirse con código y ver tus grupos.
export default function Lobby({ user, onOpen }) {
  const notify = useToast();
  const [groups, setGroups] = useState(null);
  const [listError, setListError] = useState(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(null); // 'create' | 'join' | null
  const [formErrors, setFormErrors] = useState({});

  // READ: escuchamos en tiempo real los grupos del usuario.
  useEffect(
    () => watchMyGroups(user.uid, setGroups, (err) => setListError(friendlyError(err))),
    [user.uid],
  );

  async function handleCreate(event) {
    event.preventDefault();
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 30) {
      setFormErrors({ create: 'El nombre tiene que tener entre 2 y 30 caracteres.' });
      return;
    }
    setFormErrors({});
    setBusy('create');
    try {
      const newCode = await createGroup(clean, user);
      notify(`Grupo "${clean}" creado. Su código es ${newCode}.`);
      setName('');
      onOpen(newCode);
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function handleJoin(event) {
    event.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(clean)) {
      setFormErrors({ join: 'El código tiene 6 caracteres (letras y números).' });
      return;
    }
    setFormErrors({});
    setBusy('join');
    try {
      await joinGroup(clean, user);
      notify('¡Listo! Ya sos parte del grupo.');
      setCode('');
      onOpen(clean);
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="lobby">
      <section className="lobby__intro">
        <h1 className="display display--xl">Boletería</h1>
        <p>Armá un grupo nuevo o sumate a uno con el código que te pasaron.</p>
      </section>

      <div className="lobby__forms">
        <form className="panel" onSubmit={handleCreate} noValidate>
          <h2 className="panel__title">Crear grupo</h2>
          <label className="field">
            <span>Nombre del grupo</span>
            <input
              type="text"
              value={name}
              maxLength={30}
              placeholder="Ej: Los del viernes"
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(formErrors.create)}
            />
          </label>
          {formErrors.create && <p className="form-error">{formErrors.create}</p>}
          <button className="btn btn--primary" disabled={busy !== null}>
            {busy === 'create' ? 'Creando…' : 'Crear grupo'}
          </button>
        </form>

        <form className="panel" onSubmit={handleJoin} noValidate>
          <h2 className="panel__title">Unirme con código</h2>
          <label className="field">
            <span>Código de 6 caracteres</span>
            <input
              type="text"
              className="input--code"
              value={code}
              maxLength={6}
              placeholder="K7PX2Q"
              autoCapitalize="characters"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              aria-invalid={Boolean(formErrors.join)}
            />
          </label>
          {formErrors.join && <p className="form-error">{formErrors.join}</p>}
          <button className="btn btn--primary" disabled={busy !== null}>
            {busy === 'join' ? 'Buscando grupo…' : 'Unirme'}
          </button>
        </form>
      </div>

      <section className="lobby__groups">
        <h2 className="display">Tus grupos</h2>
        {listError && <p className="form-error">{listError}</p>}
        {!listError && groups === null && <Loader text="Buscando tus grupos…" />}
        {groups && groups.length === 0 && (
          <p className="empty">Todavía no estás en ningún grupo. Creá uno o sumate con un código.</p>
        )}
        {groups && groups.length > 0 && (
          <ul className="group-list">
            {groups.map((group) => (
              <li key={group.id}>
                {/* v2: cada grupo es una entrada; el talón lleva el código */}
                <button className="group-ticket" onClick={() => onOpen(group.id)}>
                  <span className="group-ticket__main paper notch-right">
                    <span className="group-ticket__name">{group.name}</span>
                    <span className="group-ticket__meta">
                      {group.memberIds.length} {group.memberIds.length === 1 ? 'persona' : 'personas'},
                      ronda {group.round?.number ?? 1}
                    </span>
                    {group.currentMovieId && <span className="badge">Película en cartelera</span>}
                  </span>
                  <span className="group-ticket__stub paper paper--stub notch-left">
                    <span className="code">{group.code}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
