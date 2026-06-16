import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from './proxy';

describe('Proxy token forwarding', () => {
  let bff: express.Application;
  let mockApi: ReturnType<typeof express>;
  let mockApiServer: ReturnType<typeof mockApi.listen>;
  let mockApiUrl: string;

  beforeAll(async () => {
    mockApi = express();
    mockApi.use(express.json());

    mockApi.get('/api/protected', (req, res) => {
      const auth = req.headers['authorization'];
      if (!auth) {
        return res.status(401).json({ message: 'No token' });
      }
      res.json({ message: 'ok', token: auth.replace('Bearer ', '') });
    });

    let refreshCalled = false;
    mockApi.post('/api/v1/auth/refresh', (req, res) => {
      if (!req.body.refreshToken) {
        return res.status(401).json({ message: 'No refresh token' });
      }
      refreshCalled = true;
      res.json({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    mockApi.get('/api/protected-refresh', (req, res) => {
      const auth = req.headers['authorization'];
      // First call with expired token returns 401
      if (auth === 'Bearer old-token' && !refreshCalled) {
        return res.status(401).json({ message: 'Expired' });
      }
      if (auth === 'Bearer new-access-token') {
        return res.json({ message: 'refreshed' });
      }
      // Second 401 after failed refresh
      if (auth === 'Bearer bad-token') {
        return res.status(401).json({ message: 'Expired' });
      }
      return res.status(401).json({ message: 'No token' });
    });

    await new Promise<void>((resolve) => {
      mockApiServer = mockApi.listen(0, () => {
        resolve();
      });
    });

    const mockApiPort = (mockApiServer.address() as { port: number }).port;
    mockApiUrl = `http://localhost:${mockApiPort}`;

    bff = express();
    bff.use(cookieParser());
    bff.use(express.json());
    bff.use(createProxyMiddleware(mockApiUrl));
  });

  afterAll(() => {
    mockApiServer?.close();
  });

  it('forwards access_token cookie as Authorization header', async () => {
    const response = await request(bff)
      .get('/api/protected')
      .set('Cookie', ['access_token=test-token-123']);

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('test-token-123');
  });

  it('returns 401 when no access_token cookie present', async () => {
    const response = await request(bff).get('/api/protected');

    expect(response.status).toBe(401);
  });

  it('refreshes token and retries on 401', async () => {
    const response = await request(bff)
      .get('/api/protected-refresh')
      .set('Cookie', ['access_token=old-token', 'refresh_token=valid-refresh']);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('refreshed');

    // Should set new cookies
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
    expect(cookieStr).toContain('access_token=new-access-token');
    expect(cookieStr).toContain('refresh_token=new-refresh-token');
  });
});
