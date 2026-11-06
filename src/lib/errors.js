// Traduce los errores técnicos de Firebase a mensajes entendibles.
export function friendlyError(error) {
  const code = error?.code || '';

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Cerraste la ventana de Google antes de terminar.';
  }
  if (code === 'auth/popup-blocked') {
    return 'El navegador bloqueó la ventana de Google. Permití las ventanas emergentes y probá de nuevo.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'El inicio de sesión con Google no está habilitado en Firebase (Authentication → Método de acceso).';
  }
  if (code.includes('permission-denied')) {
    return 'Firebase rechazó la operación por permisos. ¿Están publicadas las reglas de Firestore?';
  }
  if (code.includes('unavailable')) {
    return 'Sin conexión con Firebase. Revisá tu internet y probá de nuevo.';
  }
  if (code.includes('not-found')) {
    return 'No se encontró la base de datos. ¿Creaste Cloud Firestore en Firebase?';
  }

  return error?.message || 'Algo salió mal. Probá de nuevo.';
}
