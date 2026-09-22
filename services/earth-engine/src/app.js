const crypto = require('node:crypto');
const express = require('express');
const { ServiceUnavailableError } = require('./earth-engine-service');

function matchesToken(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string' || expected.length < 32) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function createApp({ service, token, logger = console }) {
  if (!token || token.length < 32) throw new Error('INTERNAL_TOKEN must contain at least 32 characters.');

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/v1', (request, response, next) => {
    if (!matchesToken(request.get('X-Internal-Token'), token)) {
      response.status(401).json({ data: null, message: 'Unauthorized.' });
      return;
    }
    next();
  });

  app.get('/v1/status', (request, response) => {
    response.json({ data: service.status(), message: 'Earth Engine status.' });
  });

  app.get('/v1/tiles', async (request, response, next) => {
    try {
      const tiles = await service.tiles();
      response.json({ data: tiles, message: `${tiles.length} Earth Engine layers available.` });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/v1/cache', (request, response) => {
    service.clearCache();
    response.json({ data: null, message: 'Earth Engine cache cleared.' });
  });

  app.use((error, request, response, next) => {
    logger.error('Earth Engine request failed.', { name: error.name });
    const status = error instanceof ServiceUnavailableError ? 503 : 500;
    response.status(status).json({
      data: null,
      message: status === 503 ? 'Earth Engine is unavailable.' : 'Internal service error.',
    });
  });

  return app;
}

module.exports = { createApp, matchesToken };
