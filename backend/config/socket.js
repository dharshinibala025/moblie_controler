const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io = null;

const connectionCounts = new Map();
const MAX_CONNECTIONS_PER_USER = parseInt(process.env.MAX_SOCKET_CONNECTIONS_PER_USER) || 5;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectTimeout: 10000,
  });

  io.use((socket, next) => {
    const isProduction = process.env.NODE_ENV === "production";
    const token = socket.handshake.auth.token || (!isProduction && socket.handshake.query.token);
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.use((socket, next) => {
    const userId = socket.user.userId.toString();
    const count = connectionCounts.get(userId) || 0;
    if (count >= MAX_CONNECTIONS_PER_USER) {
      return next(new Error("Too many connections from this account"));
    }
    connectionCounts.set(userId, count + 1);
    socket.on("disconnect", () => {
      const current = connectionCounts.get(userId) || 0;
      if (current <= 1) {
        connectionCounts.delete(userId);
      } else {
        connectionCounts.set(userId, current - 1);
      }
    });
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: userId=${user.userId}, role=${user.role}`);

    socket.join(`user:${user.userId}`);

    if (user.classId) {
      socket.join(`class:${user.classId}`);
      logger.debug(`Socket joined room class:${user.classId}`);
    }

    if (user.role === "admin" || user.role === "staff") {
      socket.join(`monitor:${user.institutionId}`);
    }

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: userId=${user.userId}, reason=${reason}`);
    });
  });

  logger.info("Socket.io server initialized");
  return io;
};

const getIO = () => io;

const emitToClass = (classId, event, data) => {
  if (!io) {
    logger.warn("Socket.io not initialized, cannot emit event");
    return false;
  }
  io.to(`class:${classId}`).emit(event, data);
  logger.debug(`Emitted ${event} to class:${classId}`);
  return true;
};

const emitToUser = (userId, event, data) => {
  if (!io) {
    logger.warn("Socket.io not initialized, cannot emit event");
    return false;
  }
  io.to(`user:${userId}`).emit(event, data);
  logger.debug(`Emitted ${event} to user:${userId}`);
  return true;
};

module.exports = { initializeSocket, getIO, emitToClass, emitToUser };
