import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite: usamos el plugin oficial de React.
export default defineConfig({
  plugins: [react()],
});
