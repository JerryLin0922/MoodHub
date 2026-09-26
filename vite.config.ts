import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative paths are required for Capacitor / Electron.
  base: './',
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    sourcemap: false,          // Smaller production bundle.
    target: 'es2018',          // Better compatibility with older Android WebView.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          recharts: ['recharts'],
        },
      },
    },
  },
});
