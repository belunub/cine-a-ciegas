import { formatScore, groupStats } from '../lib/stats';

function times(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// v3: "Datos de la sala". Se muestran como un cartel de letras intercambiables,
// el que los cines usan para anunciar la cartelera.
export default function GroupStats({ movies }) {
  const s = groupStats(movies);
  const lines = [];

  lines.push(
    `Vieron ${times(s.seenCount, 'película', 'películas')} y vetaron ${times(s.vetoedCount, 'vez', 'veces')}`,
  );
  if (s.topGenre) {
    lines.push(`${s.topGenre} es lo que más salió: ${times(s.topGenreCount, 'vez', 'veces')}`);
  }
  if (s.best) lines.push(`La mejor puntuada: ${s.best.title}, con ${formatScore(s.best.avg)} ★`);
  if (s.harshest) {
    lines.push(`La mano más dura es la de ${s.harshest.name}: ${formatScore(s.harshest.avg)} ★ de promedio`);
  }
  if (s.kindest) {
    lines.push(`La mano más generosa es la de ${s.kindest.name}: ${formatScore(s.kindest.avg)} ★`);
  }
  if (s.topVetoer) {
    lines.push(`Quien más vetó: ${s.topVetoer}, ${times(s.topVetoes, 'veto', 'vetos')}`);
  }

  return (
    <div className="letterboard" role="list" aria-label="Datos de la sala">
      {lines.map((line) => (
        <p key={line} className="letterboard__line" role="listitem">
          {line}
        </p>
      ))}
    </div>
  );
}
