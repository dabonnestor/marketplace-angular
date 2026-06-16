import { Request, Response, NextFunction } from 'express';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

async function forwardRequest(req: Request, apiBaseUrl: string, accessToken?: string) {
  const queryString = req.originalUrl.includes('?')
    ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
    : '';
  const targetUrl = `${apiBaseUrl}${req.path}${queryString}`;
  const headers: Record<string, string> = {};

  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'] as string;
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  return fetch(targetUrl, fetchOptions);
}

export function createProxyMiddleware(apiBaseUrl: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    try {
      const accessToken = req.cookies?.[ACCESS_COOKIE];

      let response = await forwardRequest(req, apiBaseUrl, accessToken);

      // If 401 and we have a refresh token, try to refresh
      if (response.status === 401) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        if (refreshToken) {
          const refreshResponse = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const tokens = await refreshResponse.json();

            res.cookie(ACCESS_COOKIE, tokens.accessToken, COOKIE_OPTIONS);
            res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

            // Retry original request with new access token
            response = await forwardRequest(req, apiBaseUrl, tokens.accessToken);
          }
        }
      }

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  };
}
