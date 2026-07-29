import app from '#src/app.js';
import request from 'supertest';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('status', 'OK');
    });
  });

  describe('GET /api', () => {
    it('should return api status', async () => {
      const response = await request(app).get('/api').expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Acquisition API is running!'
      );
    });
  });

  describe('GET /unknown-route', () => {
    it('should return 404 for unknown route', async () => {
      const response = await request(app).get('/unknown-route').expect(404);

      expect(response.body).toHaveProperty('message', 'Endpoint not found');
    });
  });
});
