require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initializeFirebase } = require("./config/firebase");
const { initializeSocket } = require("./config/socket");
const { setupDeviceGateway } = require("./sockets/deviceGateway");
const { startScheduler } = require("./jobs/aggregateReports");
const emailQueueWorker = require("./jobs/emailQueueWorker");
const institutionService = require("./services/institutionService");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Automatically configure ADB port forwarding for USB-connected physical Android devices on boot
    const { exec } = require("child_process");
    exec("adb reverse tcp:5000 tcp:5000", (err) => {
      if (err) {
        logger.info("ADB reverse notice: Physical device not connected or ADB not found.");
      } else {
        logger.info("Successfully configured ADB port reverse: tcp:5000 -> tcp:5000");
      }
    });

    await connectDB();

    initializeFirebase();

    await institutionService.ensureAdminExists();

    const httpServer = http.createServer(app);

    initializeSocket(httpServer);

    setupDeviceGateway();

    startScheduler();

    emailQueueWorker.start(10000);

    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        logger.warn(`Port ${PORT} is already in use by a running server instance. Serving traffic on existing process.`);
      } else {
        logger.error(`Server error: ${err.message}`);
      }
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on http://0.0.0.0:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection stack:", reason);
  logger.error(reason, "Unhandled Rejection");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception stack:", err);
  logger.error(err, "Uncaught Exception");
  process.exit(1);
});

startServer();
