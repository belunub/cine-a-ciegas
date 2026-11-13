import { useState } from 'react';
import { deleteGroup, leaveGroup, renameGroup } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';

// v3: administrar el grupo.
//  - Cualquiera puede cambiar el nombre (UPDATE).
//  - Quien creó el grupo puede eliminarlo con todo su contenido (DELETE).
//  - El resto puede salir del grupo (UPDATE de la lista de integrantes).
export default function GroupSettings({ group, user, onClose, onExit }) {
  const notify = useToast();
  const isOwner = group.ownerId === user.uid;
  const [name, setName] = useState(group.name);
  const [nameError, setNameError] = useState(null);
  const [busy, setBusy] = useState(null); // 'rename' | 'leave' | 'delete'
  const [confirming, setConfirming] = useState(false);

  async function handleRename(event) {
    event.preventDefault();
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 30) {
      setNameError('El nombre tiene que tener entre 2 y 30 caracteres.');
      return;
    }
    if (clean === group.name) {
      onClose();
      return;
    }
    setNameError(null);
    setBusy('rename');
    try {
      await renameGroup(group.id, clean);
      notify(`El grupo ahora se llama "${clean}".`);
      onClose();
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function handleLeaveOrDelete() {
    setBusy(isOwner ? 'delete' : 'leave');
    try {
      if (isOwner) {
        await deleteGroup(group.id);
        notify(`Eliminaste "${group.name}".`);
      } else {
        await leaveGroup(group.id, user.uid);
        notify(`Saliste de "${group.name}".`);
      }
      onExit();
    } catch (err) {
      notify(friendlyError(err), 'error');
      setBusy(null);
      setConfirming(false);
    }
  }

  return (
    <section className="panel settings" aria-labelledby="t-ajustes">
      <div className="settings__head">
        <h2 id="t-ajustes" className="panel__title">Ajustes del grupo</h2>
        <button className="btn btn--link" onClick={onClose}>Cerrar</button>
      </div>

      <form className="settings__rename" onSubmit={handleRename} noValidate>
        <label className="field">
          <span>Nombre del grupo</span>
          <input
            type="text"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(nameError)}
          />
        </label>
        <button className="btn btn--primary" disabled={busy !== null}>
          {busy === 'rename' ? 'Guardando…' : 'Guardar nombre'}
        </button>
        {nameError && <p className="form-error">{nameError}</p>}
      </form>

      <div className="settings__danger">
        {confirming ? (
          <>
            <p className="settings__warning">
              {isOwner
                ? 'Se borran la ruleta, las películas y todas las reseñas, para todo el grupo. No se puede deshacer.'
                : 'Vas a dejar de ver este grupo. Si tu reseña de la película en cartelera ya estaba, se descarta.'}
            </p>
            <div className="actions actions--start">
              <button className="btn btn--danger" onClick={handleLeaveOrDelete} disabled={busy !== null}>
                {busy === 'delete' && 'Eliminando…'}
                {busy === 'leave' && 'Saliendo…'}
                {!busy && (isOwner ? 'Sí, eliminar el grupo' : 'Sí, salir del grupo')}
              </button>
              <button className="btn btn--ghost" onClick={() => setConfirming(false)} disabled={busy !== null}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="settings__note">
              {isOwner
                ? 'Creaste este grupo, así que podés eliminarlo.'
                : 'Si salís, podés volver a entrar con el código.'}
            </p>
            <button className="btn btn--danger-outline" onClick={() => setConfirming(true)}>
              {isOwner ? 'Eliminar grupo' : 'Salir del grupo'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
