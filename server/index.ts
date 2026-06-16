import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createProxyMiddleware } from './proxy';

const PORT = process.env['PORT'] ? parseInt(process.env['PORT']) : 3000;
const API_BASE_URL = process.env['API_BASE_URL'] || 'http://localhost:8080';
const STATIC_DIR = path.resolve(process.env['STATIC_DIR'] || 'dist/marketplace-angular/browser');

export function createServer({ apiBaseUrl }: { apiBaseUrl: string }) {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(createProxyMiddleware(apiBaseUrl));

  // Serve Angular static files in production
  app.use(express.static(STATIC_DIR));
  app.get('{*splat}', (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });

  return app;
}

// Entry point when run directly
if (require.main === module || process.argv[1]?.endsWith('index.ts')) {
  const app = createServer({ apiBaseUrl: API_BASE_URL });
  app.listen(PORT, () => {
    console.log(`BFF server running on http://localhost:${PORT}`);
    console.log(`Proxying /api/* to ${API_BASE_URL}`);
  });
}
