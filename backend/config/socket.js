const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io = null;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: userId=${user.userId}, role=${user.role}`);

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

module.exports = { initializeSocket, getIO, emitToClass };
