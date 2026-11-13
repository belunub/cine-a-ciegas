// v3: estadísticas del grupo, calculadas a partir de las películas guardadas.

// 4.25 → "4,3" (formato argentino)
export function formatScore(value) {
  return value.toFixed(1).replace('.', ',');
}

export function averageRating(reviews) {
  const values = Object.values(reviews || {}).map((r) => r.rating);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function groupStats(movies) {
  const seen = movies.filter((m) => m.status === 'vista');
  const vetoed = movies.filter((m) => m.status === 'vetada');

  // Género que más salió en la ruleta (contando todas las tiradas).
  const genreCount = {};
  movies.forEach((m) => {
    const name = m.spunGenre?.name;
    if (name) genreCount[name] = (genreCount[name] || 0) + 1;
  });
  const [topGenre, topGenreCount] =
    Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0] || [];

  // Promedio de estrellas que pone cada persona.
  const byPerson = {};
  seen.forEach((m) =>
    Object.entries(m.reviews || {}).forEach(([uid, review]) => {
      byPerson[uid] = byPerson[uid] || { name: review.name, ratings: [] };
      byPerson[uid].ratings.push(review.rating);
    }),
  );
  const people = Object.values(byPerson)
    .map((p) => ({ name: p.name, avg: p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length }))
    .sort((a, b) => a.avg - b.avg);
  const harshest = people.length > 1 ? people[0] : null;
  const kindest = people.length > 1 && people.at(-1).avg > people[0].avg ? people.at(-1) : null;

  // Quién vetó más.
  const vetoCount = {};
  vetoed.forEach((m) => {
    const name = m.vetoedByName || 'Alguien';
    vetoCount[name] = (vetoCount[name] || 0) + 1;
  });
  const [topVetoer, topVetoes] = Object.entries(vetoCount).sort((a, b) => b[1] - a[1])[0] || [];

  // Mejor puntuada.
  const best = seen
    .map((m) => ({ title: m.title, avg: averageRating(m.reviews) }))
    .filter((m) => m.avg !== null)
    .sort((a, b) => b.avg - a.avg)[0];

  return { seenCount: seen.length, vetoedCount: vetoed.length, topGenre, topGenreCount, harshest, kindest, topVetoer, topVetoes, best };
}
