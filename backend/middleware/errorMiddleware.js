const logger = require("../utils/logger");
const { AppError } = require("../utils/AppError");

const errorMiddleware = (err, req, res, _next) => {
  logger.error({
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    const response = { error: err.message, code: err.code };
    if (err.details) response.details = err.details;
    return res.status(err.statusCode).json(response);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed", details: messages });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid resource ID" });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    return res.status(409).json({ error: `Duplicate value for: ${field}` });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Something went wrong";

  res.status(statusCode).json({ error: message });
};

module.exports = errorMiddleware;
