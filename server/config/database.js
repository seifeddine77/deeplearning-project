const mongoose = require('mongoose');
let redis;
try {
  redis = require('redis');
} catch (e) {
  redis = null;
}
require('dotenv').config();

// MongoDB Configuration
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/deeplearning-db';

const connectMongoDB = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Using in-memory storage as fallback');
    return false;
  }
};

// Redis Configuration
let redisClient = null;

const connectRedis = async () => {
  try {
    if (!redis) {
      console.log('⚠️  Redis package not installed - caching disabled');
      redisClient = null;
      return false;
    }
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    console.log('⚠️  Redis caching disabled');
    return false;
  }
};

// Cache helper functions
const getFromCache = async (key) => {
  try {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Cache get error:', error.message);
    return null;
  }
};

const setInCache = async (key, value, ttl = 3600) => {
  try {
    if (!redisClient) return false;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('❌ Cache set error:', error.message);
    return false;
  }
};

const deleteFromCache = async (key) => {
  try {
    if (!redisClient) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('❌ Cache delete error:', error.message);
    return false;
  }
};

const clearCache = async () => {
  try {
    if (!redisClient) return false;
    await redisClient.flushDb();
    return true;
  } catch (error) {
    console.error('❌ Cache clear error:', error.message);
    return false;
  }
};

module.exports = {
  connectMongoDB,
  connectRedis,
  getFromCache,
  setInCache,
  deleteFromCache,
  clearCache,
  redisClient,
  mongoUri
};
