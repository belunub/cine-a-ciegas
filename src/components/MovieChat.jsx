import { useEffect, useState } from 'react';
import { addComment, deleteComment, watchComments } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { timeAgo } from '../lib/time';
import { useToast } from '../lib/toast';

const MAX_TEXT = 200;

// v4: CHARLA DE LA FUNCIÓN. Comentarios del grupo sobre una película.
// Cada integrante puede comentar y borrar sus propios comentarios.
export default function MovieChat({ groupId, movie, user, tone = 'dark' }) {
  const notify = useToast();
  const [comments, setComments] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(
    () => watchComments(groupId, movie.id, setComments, (err) => setError(friendlyError(err))),
    [groupId, movie.id],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = text.trim();
    if (clean.length < 2) {
      notify('Escribí algo antes de enviar.', 'error');
      return;
    }
    setSending(true);
    try {
      await addComment(groupId, movie, clean, user);
      setText('');
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId) {
    setDeletingId(commentId);
    try {
      await deleteComment(groupId, movie.id, commentId);
    } catch (err) {
      notify(friendlyError(err), 'error');
      setDeletingId(null);
    }
  }

  return (
    <section className={`chat chat--${tone}`} aria-label={`Charla sobre ${movie.title}`}>
      <h4 className="chat__title">
        Charla de la función {comments?.length > 0 && <span className="chat__count">{comments.length}</span>}
      </h4>

      {error && <p className="form-error">{error}</p>}
      {comments && comments.length === 0 && (
        <p className="chat__empty">Todavía nadie comentó. ¿Arrancás vos?</p>
      )}

      {comments && comments.length > 0 && (
        <ul className="chat__list">
          {comments.map((c) => {
            const mine = c.authorUid === user.uid;
            return (
              <li key={c.id} className={mine ? 'bubble bubble--mine' : 'bubble'}>
                <p className="bubble__meta">
                  <span className="bubble__name">{mine ? 'Vos' : c.authorName}</span>
                  <span className="bubble__time">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="bubble__text">{c.text}</p>
                {mine && (
                  <button
                    className="bubble__delete"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? 'Borrando…' : 'Borrar'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form className="chat__form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          maxLength={MAX_TEXT}
          placeholder="Escribí un comentario…"
          aria-label="Comentario"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn--primary btn--small" disabled={sending || !text.trim()}>
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </section>
  );
}
