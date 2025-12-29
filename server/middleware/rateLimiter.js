const rateLimit = require('express-rate-limit');

// Rate limiter général pour l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Retourner les infos de rate limit dans les headers
  legacyHeaders: false, // Désactiver les headers X-RateLimit-*
  skip: (req) => {
    // Ne pas appliquer le rate limit aux requêtes GET
    return req.method === 'GET';
  }
});

// Rate limiter strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite à 5 tentatives par windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
  skipFailedRequests: false // Compter les requêtes échouées
});

// Rate limiter pour l'entraînement (moins strict)
const trainingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // limite à 10 entraînements par heure
  message: 'Too many training requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter pour l'upload de fichiers
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // limite à 20 uploads par heure
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter personnalisé pour les prédictions
const predictionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limite à 30 prédictions par minute
  message: 'Too many prediction requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  authLimiter,
  trainingLimiter,
  uploadLimiter,
  predictionLimiter
};
