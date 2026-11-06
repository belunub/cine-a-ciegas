import { createContext, useContext } from 'react';

// Contexto para mostrar avisos (éxito / error) desde cualquier componente.
export const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}
