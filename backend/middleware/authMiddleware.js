const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", tokenExpired: true });
    }
    return res.status(401).json({ error: "Invalid token" });
  }

  if (decoded.sessionId) {
    const session = await Session.findOne({ _id: decoded.sessionId, userId: decoded.userId, status: "active" });
    if (!session) {
      return res.status(401).json({ error: "Session invalidated. Please login again.", sessionInvalidated: true });
    }
  }

  const user = await User.findById(decoded.userId).select("status isActive role");
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "Account disabled" });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Account suspended. Contact your administrator." });
  }

  if (user.status === "disabled") {
    return res.status(403).json({ error: "Account disabled. Contact your administrator." });
  }

  req.user = decoded;
  next();
};

module.exports = authMiddleware;
