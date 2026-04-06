import express from 'express';
import request from 'supertest';
import normalizeApiResponse from '../middleware/responseNormalizer.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { sendPaginatedResponse } from '../utils/pagination.js';

const createApiTestApp = () => {
  const app = express();
  const router = express.Router();

  router.use(normalizeApiResponse);

  router.get('/resource', (req, res) => {
    res.json({
      success: true,
      message: 'Resource loaded',
      items: [{ id: 1 }, { id: 2 }],
    });
  });

  router.get('/paginated', (req, res) => {
    sendPaginatedResponse(res, {
      message: 'Appointments fetched successfully',
      itemKey: 'appointments',
      items: [{ id: 'apt-1' }, { id: 'apt-2' }],
      page: 2,
      limit: 2,
      totalItems: 5,
    });
  });

  app.use('/api', router);
  app.use('/api/v1', router);

  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return notFoundHandler(req, res, next);
    }

    next();
  });

  app.use(errorHandler);

  return app;
};

describe('API quality middleware', () => {
  it('normalizes versioned API success responses with data and legacy keys', async () => {
    const app = createApiTestApp();

    const response = await request(app).get('/api/v1/resource');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Resource loaded',
      data: {
        items: [{ id: 1 }, { id: 2 }],
      },
      items: [{ id: 1 }, { id: 2 }],
    });
  });

  it('returns consistent pagination metadata for list responses', async () => {
    const app = createApiTestApp();

    const response = await request(app).get('/api/paginated');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.appointments).toHaveLength(2);
    expect(response.body.data.appointments).toHaveLength(2);
    expect(response.body.meta).toEqual({
      page: 2,
      limit: 2,
      totalItems: 5,
      totalPages: 3,
      count: 2,
      hasNextPage: true,
      hasPreviousPage: true,
    });
    expect(response.body.pagination).toEqual(response.body.meta);
  });

  it('returns versioned API 404 responses through the centralized error handler', async () => {
    const app = createApiTestApp();

    const response = await request(app).get('/api/v1/missing-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('route_not_found');
    expect(response.body.message).toContain('/api/v1/missing-route');
  });
});
