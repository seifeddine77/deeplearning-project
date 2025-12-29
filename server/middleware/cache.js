const redisClient = require('../config/redis');
const logger = require('../config/logger');

/**
 * Middleware de cache pour les requêtes GET
 */
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    // Ne cacher que les requêtes GET
    if (req.method !== 'GET') {
      return next();
    }

    // Créer une clé de cache unique
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Vérifier si la réponse est en cache
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug('Serving from cache', { url: req.originalUrl });
        return res.json(cachedData);
      }
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
    }

    // Intercepter la méthode json pour cacher la réponse
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Cacher la réponse
      redisClient.set(cacheKey, data, ttl).catch(err => {
        logger.error('Failed to cache response', { error: err.message });
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware pour invalider le cache
 */
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Stocker les patterns à invalider
    req.cacheInvalidatePatterns = patterns;
    
    // Intercepter la méthode json pour invalider le cache
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Invalider le cache
      patterns.forEach(pattern => {
        redisClient.getAllKeys(pattern).then(keys => {
          keys.forEach(key => {
            redisClient.delete(key).catch(err => {
              logger.error('Failed to invalidate cache', { key, error: err.message });
            });
          });
        });
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware pour la pagination
 */
const paginationMiddleware = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Valider les paramètres
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
      details: 'page >= 1, 1 <= limit <= 100'
    });
  }

  req.pagination = {
    page,
    limit,
    skip
  };

  next();
};

/**
 * Middleware pour ajouter les informations de pagination à la réponse
 */
const addPaginationInfo = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (req.pagination && data.items) {
      data.pagination = {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total: data.total || 0,
        pages: Math.ceil((data.total || 0) / req.pagination.limit)
      };
    }
    return originalJson(data);
  };

  next();
};

/**
 * Middleware pour la compression des réponses
 */
const compressionMiddleware = require('compression');

const configureCompression = () => {
  return compressionMiddleware({
    level: 6, // 0-9, 6 est un bon compromis
    threshold: 1024, // Compresser si > 1KB
    filter: (req, res) => {
      // Ne pas compresser les images
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compressionMiddleware.filter(req, res);
    }
  });
};

/**
 * Middleware pour le lazy loading
 */
const lazyLoadingMiddleware = (req, res, next) => {
  // Ajouter un header pour indiquer le lazy loading
  res.set('X-Lazy-Loading', 'enabled');
  
  // Ajouter les paramètres de lazy loading
  req.lazyLoading = {
    enabled: req.query.lazy === 'true',
    batchSize: parseInt(req.query.batchSize) || 20
  };

  next();
};

/**
 * Middleware pour le code splitting
 */
const codeSplittingMiddleware = (req, res, next) => {
  // Ajouter les informations de code splitting
  req.codeSplitting = {
    enabled: true,
    chunks: req.query.chunks ? req.query.chunks.split(',') : []
  };

  next();
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  paginationMiddleware,
  addPaginationInfo,
  configureCompression,
  lazyLoadingMiddleware,
  codeSplittingMiddleware
};
