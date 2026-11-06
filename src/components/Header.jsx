import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useToast } from '../lib/toast';
import { firstName } from '../lib/groups';

export default function Header({ user, onHome }) {
  const notify = useToast();

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {
      notify('No se pudo cerrar la sesión. Probá de nuevo.', 'error');
    }
  }

  return (
    <header className="header">
      <button className="header__brand" onClick={onHome} aria-label="Ir al inicio">
        Cine <span>a ciegas</span>
      </button>
      <div className="header__user">
        {user.photoURL && (
          <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        )}
        <span className="header__name">{firstName(user)}</span>
        <button className="btn btn--ghost btn--small" onClick={handleLogout}>
          Salir
        </button>
      </div>
    </header>
  );
}
