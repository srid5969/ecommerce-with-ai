import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Same-origin `/api` in the browser; Vite forwards it to the backend.
      proxy: { '/api': { target: env.API_URL ?? 'http://localhost:3000', changeOrigin: true } },
    },
  };
});
