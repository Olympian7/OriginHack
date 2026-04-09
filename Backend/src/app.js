const express = require('express');
const path = require('path');

const healthRoutes = require('./routes/health.routes');
const conversationRoutes = require('./routes/conversation.routes');
const HttpError = require('./utils/http-error');
const logger = require('./utils/logger');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/audio', express.static(path.join(process.cwd(), 'storage', 'audio')));

app.use(healthRoutes);
app.use('/api/conversation', conversationRoutes);

app.use((req, res, next) => {
  next(new HttpError(404, 'Route not found'));
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  logger.error('Request failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message
  });

  res.status(statusCode).json({ error: message });
});

module.exports = app;
