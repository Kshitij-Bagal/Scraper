import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { createScraperMiddleware } from './src/server/proxyMiddleware.ts';

function scraperPlugin(): Plugin {
  return {
    name: 'scraper-backend',
    configureServer(server) {
      server.middlewares.use(createScraperMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createScraperMiddleware());
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), scraperPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
