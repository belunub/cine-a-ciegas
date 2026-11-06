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
    <div className="center-screen login">
      <div className="login__card">
        <p className="mono login__kicker">Función única · Entrada general</p>
        <h1 className="marquee-title">
          Cine
          <span>a ciegas</span>
        </h1>
        <p className="login__tagline">Giren la ruleta. Lo que toca, se ve.</p>

        <ol className="login__steps">
          <li>Armá un grupo con quien quieras ver películas.</li>
          <li>Carguen sus géneros favoritos en la ruleta.</li>
          <li>Giren, vean la película y dejen su reseña.</li>
        </ol>

        <button className="btn btn--primary btn--big" onClick={handleLogin} disabled={loading}>
          {loading ? 'Abriendo Google…' : 'Entrar con Google'}
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
