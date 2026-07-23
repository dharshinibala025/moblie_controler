const rateLimit = require("express-rate-limit");

const isTest = process.env.NODE_ENV === "test";

const generalLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests, please try again later" },
    });

const loginLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) || 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many login attempts. Please try again later." },
      keyGenerator: (req) => req.ip,
    });

const accountLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 15,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many login attempts. Please try again later." },
      keyGenerator: (req) => {
        return req.body?.email?.toLowerCase() || req.ip;
      },
    });

const userKeyGenerator = (req) => {
  return req.user?.userId || req.ip;
};

const userLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests from this user, please try again later" },
      keyGenerator: userKeyGenerator,
    });

const strictLimiter = isTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Rate limit exceeded for this operation" },
      keyGenerator: userKeyGenerator,
    });

module.exports = { generalLimiter, loginLimiter, accountLimiter, userLimiter, strictLimiter };
