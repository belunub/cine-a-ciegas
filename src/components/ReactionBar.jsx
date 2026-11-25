import { useState } from 'react';
import { REACTIONS, toggleReaction } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { useToast } from '../lib/toast';

// v4: reacciones con emojis a la reseña de otra persona.
// En la reseña propia solo se ven los contadores.
export default function ReactionBar({ groupId, movie, reviewerUid, user }) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);

  const reactions = movie.reactions?.[reviewerUid] || {}; // { uidQueReacciona: emoji }
  const myReaction = reactions[user.uid];
  const isMine = reviewerUid === user.uid;

  // Contamos cuántas veces aparece cada emoji.
  const counts = {};
  Object.values(reactions).forEach((emoji) => {
    counts[emoji] = (counts[emoji] || 0) + 1;
  });

  async function handleClick(emoji) {
    setBusy(true);
    try {
      await toggleReaction(groupId, movie, reviewerUid, emoji, user);
    } catch (err) {
      notify(friendlyError(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (isMine) {
    const received = REACTIONS.filter((r) => counts[r.emoji]);
    if (received.length === 0) return null;
    return (
      <p className="reactions reactions--readonly" aria-label="Reacciones a tu reseña">
        {received.map((r) => (
          <span key={r.emoji} className="reaction is-static" title={r.label}>
            {r.emoji} {counts[r.emoji]}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className="reactions" role="group" aria-label="Reaccionar a esta reseña">
      {REACTIONS.map((r) => (
        <button
          key={r.emoji}
          type="button"
          className={myReaction === r.emoji ? 'reaction is-on' : 'reaction'}
          onClick={() => handleClick(r.emoji)}
          disabled={busy}
          aria-pressed={myReaction === r.emoji}
          aria-label={r.label}
          title={r.label}
        >
          {r.emoji}
          {counts[r.emoji] ? <span className="reaction__count">{counts[r.emoji]}</span> : null}
        </button>
      ))}
    </div>
  );
}
