const express = require("express");
const { loginLimiter, strictLimiter } = require("../middleware/rateLimiter");
const { validate } = require("../middleware/validation");
const authService = require("../services/authService");
const logger = require("../utils/logger");

const router = express.Router();

router.post("/login", loginLimiter, validate("login"), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await authService.authenticate({ email, password, ip, userAgent });

    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    if (result.mustChangePassword) {
      return res.status(200).json({
        mustChangePassword: true,
        accessToken: result.tempToken,
        user: result.user,
      });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await authService.refreshToken({ refreshToken, ip, userAgent });

    if (!result.success) {
      return res.status(result.status).json({ error: result.error, mustChangePassword: result.mustChangePassword });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        userId = decoded.userId;
      } catch (err) {
        // token may be expired, still allow logout
      }
    }

    const result = await authService.logout({ refreshToken, userId });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

router.post("/change-password", strictLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, tempToken } = req.body;

    if (tempToken) {
      const result = await authService.changePasswordWithTempToken({ tempToken, newPassword });
      if (!result.success) {
        return res.status(result.status).json({ error: result.error });
      }
      return res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const jwt = require("jsonwebtoken");
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const result = await authService.changePassword({
      userId: decoded.userId,
      currentPassword,
      newPassword,
    });

    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/consent/accept", strictLimiter, async (req, res, next) => {
  try {
    const { consentVersion } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const jwt = require("jsonwebtoken");
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const ip = req.ip || req.connection?.remoteAddress;
    const result = await authService.acceptConsent({
      userId: decoded.userId,
      consentVersion: consentVersion || "1.0",
      ip,
    });

    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
