const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { loginLimiter } = require("../middleware/rateLimiter");
const { validate } = require("../middleware/validation");
const auditService = require("../services/auditService");
const logger = require("../utils/logger");

const router = express.Router();

router.post("/login", loginLimiter, validate("login"), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account disabled" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await auditService.logAction(null, user.role, "auth.failed", {
        type: "auth",
        id: user._id,
      }, { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const tokenPayload = {
      userId: user._id,
      role: user.role,
      classId: user.classId,
      institutionId: user.institutionId,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });

    await auditService.logAction(user._id, user.role, "auth.login", {
      type: "auth",
      id: user._id,
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
