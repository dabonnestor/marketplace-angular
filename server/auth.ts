import { Router, Request, Response } from 'express';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function createAuthRoutes(apiBaseUrl: string) {
  const router = Router();

  router.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.cookie(ACCESS_COOKIE, data.accessToken, COOKIE_OPTIONS);
      res.cookie(REFRESH_COOKIE, data.refreshToken, COOKIE_OPTIONS);

      res.json({ user: data.user });
    } catch (error) {
      res.status(502).json({ message: 'Auth service unavailable' });
    }
  });

  router.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.cookie(ACCESS_COOKIE, data.accessToken, COOKIE_OPTIONS);
      res.cookie(REFRESH_COOKIE, data.refreshToken, COOKIE_OPTIONS);

      res.json({ user: data.user });
    } catch (error) {
      res.status(502).json({ message: 'Auth service unavailable' });
    }
  });

  router.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const accessToken = req.cookies?.[ACCESS_COOKIE];
      if (!accessToken) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        return res.status(response.status).json(await response.json());
      }

      const data = await response.json();

      // Set non-httpOnly auth_status cookie for client hydration checks
      res.cookie('auth_status', '1', {
        httpOnly: false,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax' as const,
        path: '/',
      });

      res.json({ user: data.user });
    } catch (error) {
      res.status(502).json({ message: 'Auth service unavailable' });
    }
  });

  router.post('/api/auth/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];
      if (!refreshToken) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return res.status(response.status).json(await response.json());
      }

      const data = await response.json();

      res.cookie(ACCESS_COOKIE, data.accessToken, COOKIE_OPTIONS);
      res.cookie(REFRESH_COOKIE, data.refreshToken, COOKIE_OPTIONS);

      res.json({ success: true });
    } catch (error) {
      res.status(502).json({ message: 'Auth service unavailable' });
    }
  });

  router.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie('auth_status', { path: '/' });
    res.json({ success: true });
  });

  return router;
}
