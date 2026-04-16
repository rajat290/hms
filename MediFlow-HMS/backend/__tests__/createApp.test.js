import request from 'supertest';
import createApp from '../app/createApp.js';

describe('createApp', () => {
  it('serves health checks on both legacy and versioned API paths', async () => {
    const app = createApp({ enableStaticAssets: false });

    const legacyResponse = await request(app).get('/api/health');
    const versionedResponse = await request(app).get('/api/v1/health');

    expect(legacyResponse.status).toBe(200);
    expect(versionedResponse.status).toBe(200);
    expect(legacyResponse.body.success).toBe(true);
    expect(versionedResponse.body.success).toBe(true);
    expect(legacyResponse.body.database).toEqual(
      expect.objectContaining({
        readyState: expect.any(Number),
        status: expect.any(String),
      }),
    );
  });

  it('keeps the root readiness response available outside the API namespace', async () => {
    const app = createApp({ enableStaticAssets: false });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('API Working');
  });
});
