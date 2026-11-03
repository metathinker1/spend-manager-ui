/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The browser talks only to this dev server; it forwards API calls to
// spend-manager-service, so the service needs no CORS (NFR Design §3.2).
const apiTarget = process.env.SPEND_MANAGER_API_URL ?? 'http://127.0.0.1:8000';
const proxy = Object.fromEntries(
  ['/api', '/health', '/imports'].map((path) => [path, { target: apiTarget, changeOrigin: true }]),
);

export default defineConfig({
  plugins: [react()],
  server: { host: 'localhost', port: 5173, strictPort: true, proxy },
  // The budget is ~600 kB of gzipped JS (NFR Design §1); Mantine makes the
  // main chunk larger than Vite's default 500 kB (minified) warning level.
  build: { chunkSizeWarningLimit: 800 },
  preview: { host: 'localhost', port: 4173, strictPort: true, proxy },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/api/schema.d.ts', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx'],
      thresholds: { lines: 80 },
    },
  },
});
