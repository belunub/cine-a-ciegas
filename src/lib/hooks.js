import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Usuario actual. undefined = todavía cargando, null = sin sesión.
export function useAuth() {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  return user;
}

// Grupo abierto, guardado en la URL (#/g/CODIGO) para que sobreviva a recargas
// y para poder compartir el link de invitación.
function readGroupFromHash() {
  const match = window.location.hash.match(/^#\/g\/([A-Za-z0-9]{6})$/);
  return match ? match[1].toUpperCase() : null;
}

export function useHashGroup() {
  const [groupId, setGroupId] = useState(readGroupFromHash);

  useEffect(() => {
    const onChange = () => setGroupId(readGroupFromHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const goTo = useCallback((id) => {
    window.location.hash = id ? `/g/${id}` : '';
  }, []);

  return [groupId, goTo];
}
