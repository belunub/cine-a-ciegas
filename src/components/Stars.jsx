// Muestra un puntaje de 1 a 5 estrellas (solo lectura).
export default function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} de 5 estrellas`}>
      {'★'.repeat(rounded)}
      <span className="stars__off">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}
