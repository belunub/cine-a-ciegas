// v4: "hace 5 min", "hace 2 h", "ayer"... para el muro y la charla.
export function timeAgo(timestamp, now = Date.now()) {
  const ms = timestamp?.toMillis ? timestamp.toMillis() : timestamp;
  if (!ms) return 'recién';

  const minutes = Math.floor((now - ms) / 60000);
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;

  return new Date(ms).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
