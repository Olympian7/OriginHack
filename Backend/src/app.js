const express = require('express');
const fs = require('fs');
const path = require('path');

const healthRoutes = require('./routes/health.routes');
const conversationRoutes = require('./routes/conversation.routes');
const callRoutes = require('./routes/call.routes');
const siteRoutes = require('./routes/site.routes');
const HttpError = require('./utils/http-error');
const logger = require('./utils/logger');

const app = express();
const backendRootDir = path.resolve(__dirname, '..');
const audioDir = path.join(backendRootDir, 'storage', 'audio');
const frontendDir = path.resolve(backendRootDir, '..', 'Frontend', 'telecaller');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/audio', express.static(audioDir));

if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'landing.html'));
  });
}

app.use(healthRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/calls', callRoutes);

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
