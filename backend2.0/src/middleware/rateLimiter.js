const rateLimit = require("express-rate-limit");

/**
 * General rate limiter
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Trop de requêtes, veuillez réessayer plus tard",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter (stricter)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Trop de tentatives de connexion, veuillez réessayer plus tard",
  skipSuccessfulRequests: true,
});

module.exports = { limiter, authLimiter };
