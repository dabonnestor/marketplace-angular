import { Request, Response, NextFunction } from 'express';

export function createProxyMiddleware(apiBaseUrl: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    try {
      const queryString = req.originalUrl.includes('?')
        ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
        : '';
      const targetUrl = `${apiBaseUrl}${req.path}${queryString}`;
      const headers: Record<string, string> = {};

      // Forward relevant headers
      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'] as string;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      // Forward body for non-GET requests
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.json();

      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  };
}
