require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initializeFirebase } = require("./config/firebase");
const { initializeSocket } = require("./config/socket");
const { setupDeviceGateway } = require("./sockets/deviceGateway");
const { startScheduler } = require("./jobs/aggregateReports");
const institutionService = require("./services/institutionService");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    initializeFirebase();

    await institutionService.ensureAdminExists();

    const httpServer = http.createServer(app);

    initializeSocket(httpServer);

    setupDeviceGateway();

    startScheduler();

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

startServer();
