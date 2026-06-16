import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createAuthRoutes } from './auth';

describe('BFF auth routes', () => {
  let bff: express.Application;
  let mockApi: ReturnType<typeof express>;
  let mockApiServer: ReturnType<typeof mockApi.listen>;
  let mockApiUrl: string;

  const mockUser = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
  };

  beforeAll(async () => {
    mockApi = express();
    mockApi.use(express.json());

    // Mock marketplace API auth endpoints
    mockApi.post('/api/v1/auth/register', (req, res) => {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
      }
      res.json({
        user: { id: 'user-1', name, email },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    mockApi.post('/api/v1/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'bad@example.com') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      res.json({
        user: { id: 'user-1', name: 'Alice', email },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    mockApi.get('/api/v1/auth/me', (req, res) => {
      const auth = req.headers['authorization'];
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      res.json(mockUser);
    });

    mockApi.post('/api/v1/auth/refresh', (req, res) => {
      const { refreshToken } = req.body;
      if (!refreshToken || refreshToken === 'bad-token') {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      res.json({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    mockApi.post('/api/v1/auth/logout', (_req, res) => {
      res.json({ success: true });
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
    bff.use(createAuthRoutes(mockApiUrl));
  });

  afterAll(() => {
    mockApiServer?.close();
  });

  describe('POST /api/auth/register', () => {
    it('forwards to marketplace API and sets httpOnly cookies with tokens', async () => {
      const response = await request(bff)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUser);

      // httpOnly cookies should be set
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('access_token');
      expect(cookieStr).toContain('refresh_token');
    });

    it('returns error when API rejects registration', async () => {
      const response = await request(bff)
        .post('/api/auth/register')
        .send({ name: '', email: '', password: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing fields');
    });
  });

  describe('POST /api/auth/login', () => {
    it('forwards to marketplace API and sets httpOnly cookies with tokens', async () => {
      const response = await request(bff)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'secret123' });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUser);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('access_token');
      expect(cookieStr).toContain('refresh_token');
    });

    it('returns 401 when credentials are invalid', async () => {
      const response = await request(bff)
        .post('/api/auth/login')
        .send({ email: 'bad@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user when valid access_token cookie is present', async () => {
      // First log in to get cookies
      const loginRes = await request(bff)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'secret123' });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];

      const response = await request(bff)
        .get('/api/auth/me')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUser);
    });

    it('sets auth_status cookie for client hydration', async () => {
      const loginRes = await request(bff)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'secret123' });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];

      const response = await request(bff)
        .get('/api/auth/me')
        .set('Cookie', cookies);

      const meCookies = response.headers['set-cookie'] as unknown as string[];
      expect(meCookies).toBeDefined();

      const cookieStr = Array.isArray(meCookies) ? meCookies.join('; ') : meCookies;
      expect(cookieStr).toContain('auth_status');
    });

    it('returns 401 when no access_token cookie', async () => {
      const response = await request(bff).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('reads refresh_token cookie, calls API, and rotates both cookies', async () => {
      // First log in to get cookies
      const loginRes = await request(bff)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'secret123' });

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];

      const response = await request(bff)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);

      const newCookies = response.headers['set-cookie'] as unknown as string[];
      expect(newCookies).toBeDefined();

      // Should have new tokens in cookies
      const cookieStr = Array.isArray(newCookies) ? newCookies.join('; ') : newCookies;
      expect(cookieStr).toContain('access_token');
      expect(cookieStr).toContain('refresh_token');
    });

    // NOTE: The current /api/auth/refresh endpoint forwards to the real API without
    // trying refreshToken from headers. This test captures the current BFF behavior.
    it('returns 401 when refresh_token cookie is missing', async () => {
      const response = await request(bff).post('/api/auth/refresh');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears all auth cookies', async () => {
      const response = await request(bff).post('/api/auth/logout');

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
      expect(cookieStr).toContain('access_token=;');
      expect(cookieStr).toContain('refresh_token=;');
      expect(cookieStr).toContain('auth_status=;');
    });
  });
});
