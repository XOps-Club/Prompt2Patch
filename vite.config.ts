import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'frontend',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  plugins: [
    react(),
    {
      name: 'redirect-shortcodes',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
            return next();
          }

          const pathname = req.url.split('?')[0];
          // Ignore Vite internals, static files, and API endpoints
          if (
            pathname === '/' ||
            pathname.startsWith('/@') ||
            pathname.startsWith('/src') ||
            pathname.startsWith('/node_modules') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/links') ||
            pathname.includes('.')
          ) {
            return next();
          }

          try {
            const check = await fetch(`http://127.0.0.1:3002${req.url}`, {
              method: 'GET',
              headers: {
                ...(req.headers.referer ? { referer: req.headers.referer as string } : {}),
                ...(req.headers['user-agent'] ? { 'user-agent': req.headers['user-agent'] as string } : {})
              },
              redirect: 'manual'
            });

            if (check.status === 301 || check.status === 302) {
              const location = check.headers.get('location');
              if (location) {
                res.writeHead(check.status, { Location: location });
                return res.end();
              }
            }
          } catch (err) {
            // Fallback to Vite next handler
          }

          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/links': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true
      }
    }
  }
});
