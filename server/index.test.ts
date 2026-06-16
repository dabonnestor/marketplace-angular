import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createServer } from './index';

describe('BFF proxy', () => {
  let bff: express.Application;
  let mockApi: ReturnType<typeof express>;
  let mockApiServer: ReturnType<typeof mockApi.listen>;

  beforeAll(async () => {
    // Create a mock marketplace API that the BFF will forward to
    mockApi = express();
    mockApi.get('/api/listings', (_req, res) => {
      res.json({ listings: [{ id: '1', title: 'Test Listing' }] });
    });

    await new Promise<void>((resolve) => {
      mockApiServer = mockApi.listen(0, () => {
        resolve();
      });
    });

    const mockApiPort = (mockApiServer.address() as { port: number }).port;
    const mockApiUrl = `http://localhost:${mockApiPort}`;

    bff = createServer({ apiBaseUrl: mockApiUrl });
  });

  afterAll(() => {
    mockApiServer?.close();
  });

  it('forwards GET /api/listings to the marketplace API and returns the response', async () => {
    const response = await request(bff).get('/api/listings');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      listings: [{ id: '1', title: 'Test Listing' }],
    });
  });
});
