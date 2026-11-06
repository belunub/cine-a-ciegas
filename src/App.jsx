import { firebaseReady, missingFirebaseVars } from './firebase';
import { tmdbReady } from './lib/tmdb';
import { useAuth, useHashGroup } from './lib/hooks';
import ToastProvider from './components/ToastProvider';
import ConfigMissing from './components/ConfigMissing';
import Loader from './components/Loader';
import Login from './components/Login';
import Header from './components/Header';
import Lobby from './components/Lobby';
import GroupView from './components/GroupView';

export default function App() {
  // Si falta configurar el .env, mostramos qué variables faltan.
  const missing = [...missingFirebaseVars, ...(tmdbReady ? [] : ['VITE_TMDB_TOKEN'])];
  if (!firebaseReady || !tmdbReady) return <ConfigMissing missing={missing} />;

  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}

function Shell() {
  const user = useAuth();
  const [groupId, goTo] = useHashGroup();

  if (user === undefined) return <Loader text="Abriendo la boletería…" fullScreen />;
  if (!user) return <Login />;

  return (
    <div className="app">
      <Header user={user} onHome={() => goTo(null)} />
      <main className="main">
        {groupId ? (
          // key: si cambia el grupo, el componente arranca de cero
          <GroupView key={groupId} groupId={groupId} user={user} onExit={() => goTo(null)} />
        ) : (
          <Lobby user={user} onOpen={goTo} />
        )}
      </main>
      <footer className="footer">
        <p>
          Datos de películas: <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>.
          Esta app usa la API de TMDB pero no está avalada ni certificada por TMDB.
        </p>
      </footer>
    </div>
  );
}
