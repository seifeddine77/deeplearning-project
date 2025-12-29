const logger = require('../config/logger');

class OptimizationService {
  /**
   * Paginer les données
   */
  static paginate(data, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const total = data.length;
    const items = data.slice(skip, skip + limit);
    const pages = Math.ceil(total / limit);

    logger.debug('Pagination', { page, limit, total, pages });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Lazy load les données
   */
  static lazyLoad(data, batchSize = 20, batch = 1) {
    const start = (batch - 1) * batchSize;
    const end = start + batchSize;
    const items = data.slice(start, end);
    const totalBatches = Math.ceil(data.length / batchSize);

    logger.debug('Lazy loading', { batch, batchSize, totalBatches });

    return {
      items,
      lazyLoading: {
        batch,
        batchSize,
        totalBatches,
        hasMore: batch < totalBatches
      }
    };
  }

  /**
   * Code splitting - Diviser les données en chunks
   */
  static codeSplit(data, chunkSize = 50) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    logger.debug('Code splitting', { totalChunks: chunks.length, chunkSize });

    return {
      chunks,
      codeSplitting: {
        totalChunks: chunks.length,
        chunkSize
      }
    };
  }

  /**
   * Compresser les données
   */
  static compressData(data) {
    const originalSize = JSON.stringify(data).length;
    
    // Supprimer les propriétés nulles
    const compressed = this.removeNullProperties(data);
    
    const compressedSize = JSON.stringify(compressed).length;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    logger.debug('Data compression', { originalSize, compressedSize, ratio: `${ratio}%` });

    return {
      data: compressed,
      compression: {
        originalSize,
        compressedSize,
        ratio: `${ratio}%`
      }
    };
  }

  /**
   * Supprimer les propriétés nulles
   */
  static removeNullProperties(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullProperties(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const cleaned = {};
      for (const key in obj) {
        if (obj[key] !== null && obj[key] !== undefined) {
          cleaned[key] = this.removeNullProperties(obj[key]);
        }
      }
      return cleaned;
    }

    return obj;
  }

  /**
   * Minifier les données JSON
   */
  static minifyJSON(data) {
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * Obtenir les statistiques de performance
   */
  static getPerformanceStats(startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      duration: `${duration}ms`,
      durationMs: duration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Optimiser les images
   */
  static optimizeImage(imageData, quality = 0.8) {
    // Simuler l'optimisation d'image
    const originalSize = imageData.length;
    const optimizedSize = Math.floor(originalSize * quality);

    logger.debug('Image optimization', { originalSize, optimizedSize });

    return {
      optimizedSize,
      savings: originalSize - optimizedSize,
      ratio: ((1 - quality) * 100).toFixed(2)
    };
  }

  /**
   * Batch les requêtes
   */
  static batchRequests(requests, batchSize = 10) {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    logger.debug('Request batching', { totalRequests: requests.length, totalBatches: batches.length });

    return batches;
  }

  /**
   * Memoize une fonction
   */
  static memoize(fn, ttl = 3600) {
    const cache = new Map();
    const timestamps = new Map();

    return function(...args) {
      const key = JSON.stringify(args);
      const now = Date.now();

      // Vérifier si le résultat est en cache et pas expiré
      if (cache.has(key)) {
        const timestamp = timestamps.get(key);
        if (now - timestamp < ttl * 1000) {
          logger.debug('Memoized function cache hit', { key });
          return cache.get(key);
        }
      }

      // Calculer le résultat
      const result = fn.apply(this, args);
      cache.set(key, result);
      timestamps.set(key, now);

      logger.debug('Memoized function cache miss', { key });

      return result;
    };
  }

  /**
   * Debounce une fonction
   */
  static debounce(fn, delay = 300) {
    let timeoutId;

    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }

  /**
   * Throttle une fonction
   */
  static throttle(fn, limit = 1000) {
    let inThrottle;

    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Obtenir les recommandations d'optimisation
   */
  static getOptimizationRecommendations(metrics) {
    const recommendations = [];

    if (metrics.responseTime > 1000) {
      recommendations.push({
        issue: 'Slow response time',
        recommendation: 'Enable caching or optimize database queries',
        severity: 'high'
      });
    }

    if (metrics.payloadSize > 1000000) {
      recommendations.push({
        issue: 'Large payload size',
        recommendation: 'Enable compression or implement pagination',
        severity: 'high'
      });
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push({
        issue: 'Low cache hit rate',
        recommendation: 'Increase cache TTL or cache more endpoints',
        severity: 'medium'
      });
    }

    if (metrics.errorRate > 0.01) {
      recommendations.push({
        issue: 'High error rate',
        recommendation: 'Investigate and fix errors',
        severity: 'high'
      });
    }

    logger.info('Optimization recommendations', { count: recommendations.length });

    return recommendations;
  }
}

module.exports = OptimizationService;
