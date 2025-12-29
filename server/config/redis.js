let redis;
try {
  redis = require('redis');
} catch (e) {
  redis = null;
}
const logger = require('./logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialiser la connexion Redis
   */
  async connect() {
    try {
      if (!redis) {
        this.client = null;
        this.isConnected = false;
        logger.warn('Redis package not installed - caching disabled');
        return null;
      }
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryStrategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis connection refused', { error: options.error.message });
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis error', { error: err.message });
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
        logger.warn('Redis disconnected');
      });

      // Utiliser promisify pour les opérations async
      this.getAsync = this.client.get.bind(this.client);
      this.setAsync = this.client.set.bind(this.client);
      this.delAsync = this.client.del.bind(this.client);
      this.existsAsync = this.client.exists.bind(this.client);
      this.expireAsync = this.client.expire.bind(this.client);
      this.ttlAsync = this.client.ttl.bind(this.client);
      this.keysAsync = this.client.keys.bind(this.client);
      this.flushdbAsync = this.client.flushdb.bind(this.client);

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      throw error;
    }
  }

  /**
   * Obtenir une valeur du cache
   */
  async get(key) {
    try {
      if (!this.isConnected) return null;
      const value = await this.getAsync(key);
      if (value) {
        logger.debug('Cache hit', { key });
        return JSON.parse(value);
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Stocker une valeur dans le cache
   */
  async set(key, value, ttl = 3600) {
    try {
      if (!this.isConnected) return false;
      await this.setAsync(key, JSON.stringify(value));
      if (ttl) {
        await this.expireAsync(key, ttl);
      }
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Supprimer une clé du cache
   */
  async delete(key) {
    try {
      if (!this.isConnected) return false;
      const result = await this.delAsync(key);
      logger.debug('Cache delete', { key, deleted: result });
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Vérifier si une clé existe
   */
  async exists(key) {
    try {
      if (!this.isConnected) return false;
      const result = await this.existsAsync(key);
      return result > 0;
    } catch (error) {
      logger.error('Cache exists error', { key, error: error.message });
      return false;
    }
  }

  /**
   * Obtenir le TTL d'une clé
   */
  async getTTL(key) {
    try {
      if (!this.isConnected) return -1;
      return await this.ttlAsync(key);
    } catch (error) {
      logger.error('Cache getTTL error', { key, error: error.message });
      return -1;
    }
  }

  /**
   * Obtenir toutes les clés
   */
  async getAllKeys(pattern = '*') {
    try {
      if (!this.isConnected) return [];
      return await this.keysAsync(pattern);
    } catch (error) {
      logger.error('Cache getAllKeys error', { pattern, error: error.message });
      return [];
    }
  }

  /**
   * Vider le cache
   */
  async flush() {
    try {
      if (!this.isConnected) return false;
      await this.flushdbAsync();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
      return false;
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getStats() {
    try {
      if (!this.isConnected) return null;
      const keys = await this.getAllKeys();
      return {
        isConnected: this.isConnected,
        totalKeys: keys.length,
        keys: keys.slice(0, 100) // Premiers 100 clés
      };
    } catch (error) {
      logger.error('Cache getStats error', { error: error.message });
      return null;
    }
  }

  /**
   * Fermer la connexion
   */
  async disconnect() {
    try {
      if (this.client) {
        this.client.quit();
        this.isConnected = false;
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Failed to disconnect Redis', { error: error.message });
    }
  }
}

module.exports = new RedisClient();
