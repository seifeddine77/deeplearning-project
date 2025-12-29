const morgan = require('morgan');
const logger = require('../config/logger');

// Format personnalisé pour Morgan
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Stream pour Morgan
const stream = {
  write: (message) => logger.http(message.trim())
};

// Middleware Morgan
const morganMiddleware = morgan(morganFormat, { stream });

// Middleware personnalisé pour logger les requêtes
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Logger la requête
  logger.info({
    message: 'Incoming request',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Logger la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level]({
      message: 'Request completed',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });

  next();
};

module.exports = {
  morganMiddleware,
  requestLogger
};
