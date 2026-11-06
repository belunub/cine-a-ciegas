import Stars from './Stars';

// Reseña visible.
export function ReviewCard({ review, style }) {
  return (
    <div className="review-card" style={style}>
      <p className="review-card__head">
        <span className="review-card__name">{review.name}</span>
        <Stars value={review.rating} />
      </p>
      <p className="review-card__text">{review.text}</p>
    </div>
  );
}

// v2: reseña "dada vuelta". Se sabe que la persona reseñó, pero no qué dijo,
// hasta que reseñe todo el grupo.
export function SealedReview({ name }) {
  return (
    <div className="review-card review-card--sealed">
      <span className="review-card__name">{name}</span>
      <span className="review-card__seal">Reseña sellada</span>
    </div>
  );
}
