import { useState } from 'react';
import { friendlyError } from '../lib/errors';

const MAX_TEXT = 280;

// Formulario de reseña con validaciones básicas.
export default function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = text.trim();
    if (rating < 1) return setError('Elegí de 1 a 5 estrellas.');
    if (clean.length < 3) return setError('Escribí al menos unas palabras sobre la película.');
    if (clean.length > MAX_TEXT) return setError(`La reseña puede tener hasta ${MAX_TEXT} caracteres.`);

    setError(null);
    setSaving(true);
    try {
      await onSubmit({ rating, text: clean });
      // Si salió bien, la película se actualiza sola y este formulario desaparece.
    } catch (err) {
      setError(friendlyError(err));
      setSaving(false);
    }
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <p className="mono">¿La viste? Dejá tu reseña</p>
      <div className="star-input" role="radiogroup" aria-label="Puntaje">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            className={n <= rating ? 'star is-on' : 'star'}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_TEXT}
        rows={3}
        placeholder="¿Qué te pareció?"
        aria-label="Texto de la reseña"
      />
      <div className="review-form__footer">
        <span className="mono counter">{text.length}/{MAX_TEXT}</span>
        <button className="btn btn--primary" disabled={saving}>
          {saving ? 'Guardando…' : 'La vi · Guardar reseña'}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
