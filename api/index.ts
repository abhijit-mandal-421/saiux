// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import path from 'path';
import { registerRoutes } from '../server/routes';

const app = express();

// Middleware
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Serve static files for Vercel
function serveStaticFiles(app: express.Express) {
  const distPath = path.join(process.cwd(), 'dist', 'public');
  
  app.use(express.static(distPath));
  
  // Fall through to index.html for SPA routing
  app.use('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Initialize app
let initialized = false;

async function init() {
  if (initialized) return;
  await registerRoutes(app);
  serveStaticFiles(app);
  initialized = true;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await init();
  return app(req as any, res as any);
}

