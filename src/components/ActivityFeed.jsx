import { useEffect, useState } from 'react';
import { watchActivity } from '../lib/groups';
import { friendlyError } from '../lib/errors';
import { formatScore } from '../lib/stats';
import { timeAgo } from '../lib/time';
import Loader from './Loader';

// Traduce cada publicación del muro a un ícono y una frase.
function describe(item) {
  const who = <strong>{item.actorName}</strong>;
  const movie = item.movieTitle && <em>{item.movieTitle}</em>;

  switch (item.type) {
    case 'create':
      return ['🎟️', <>{who} abrió la boletería de este grupo.</>];
    case 'join':
      return ['👋', <>{who} se sumó al grupo.</>];
    case 'genre_add':
      return ['➕', <>{who} sumó {item.genreName} a la ruleta.</>];
    case 'genre_remove':
      return ['➖', <>{who} sacó {item.genreName} de la ruleta.</>];
    case 'spin':
      return ['🎡', <>{who} giró la ruleta: salió {item.genreName} y les tocó {movie}.</>];
    case 'veto':
      return ['✋', <>{who} vetó {movie}.</>];
    case 'review':
      return ['✍️', <>{who} vio {movie} y dejó su reseña sellada.</>];
    case 'reveal':
      return ['⭐', <>Función terminada: {movie} se llevó {formatScore(item.avg ?? 0)} ★ de promedio.</>];
    case 'comment':
      return ['💬', <>{who} comentó en {movie}: “{item.excerpt}”</>];
    case 'reaction':
      return [item.emoji, <>{who} reaccionó a la reseña de {item.targetName} sobre {movie}.</>];
    case 'rename':
      return ['✏️', <>{who} le cambió el nombre al grupo: “{item.groupName}”.</>];
    case 'leave':
      return ['🚪', <>{who} salió del grupo.</>];
    default:
      return ['•', <>{who} hizo algo en el grupo.</>];
  }
}

// v4: MURO DEL GRUPO. Publica cada interacción entre integrantes, en tiempo real.
export default function ActivityFeed({ groupId }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Escuchamos el muro en tiempo real; al salir de la pantalla, dejamos de escuchar.
  useEffect(
    () => watchActivity(groupId, setItems, (err) => setError(friendlyError(err))),
    [groupId],
  );

  // Cada 30 segundos actualizamos "now" para que los "hace X min" se mantengan al día.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="panel feed" aria-labelledby="t-muro">
      <h2 id="t-muro" className="panel__title">Muro del grupo</h2>

      {error && <p className="form-error">{error}</p>}
      {!error && items === null && <Loader text="Cargando el muro…" />}
      {items && items.length === 0 && (
        <p className="empty">
          Acá se publica todo lo que pasa en el grupo: quién giró, quién vetó, las reseñas y los
          comentarios.
        </p>
      )}

      {items && items.length > 0 && (
        <ol className="feed__list">
          {items.map((item) => {
            const [icon, text] = describe(item);
            return (
              <li key={item.id} className="feed__item">
                <span className="feed__icon" aria-hidden="true">{icon}</span>
                <p className="feed__text">{text}</p>
                <time className="feed__time">{timeAgo(item.createdAt, now)}</time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
