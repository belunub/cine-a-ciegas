import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { friendlyError } from '../lib/errors';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // Al iniciar sesión, App detecta el usuario y cambia de pantalla.
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  }

  return (
    <div className="login">
      {/* v2: el título es un cartel de marquesina con bombitas */}
      <div className="sign">
        <div className="sign__bulbs" aria-hidden="true" />
        <h1 className="sign__title">
          <span className="sign__line sign__line--top">Cine</span>
          <span className="sign__line sign__line--bottom">a ciegas</span>
        </h1>
      </div>

      <p className="login__tagline">Giren la ruleta. Lo que toca, se ve.</p>

      <div className="login__ticket">
        <ol className="login__steps paper notch-right">
          <li>Armá un grupo con quien quieras ver películas.</li>
          <li>Carguen sus géneros favoritos en la ruleta.</li>
          <li>Giren, vean la película y dejen su reseña.</li>
        </ol>
        <div className="login__stub paper paper--stub notch-left">
          <button className="btn btn--primary btn--big" onClick={handleLogin} disabled={loading}>
            {loading ? 'Abriendo Google…' : 'Entrar con Google'}
          </button>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
