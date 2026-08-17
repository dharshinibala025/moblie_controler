require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initializeFirebase } = require("./config/firebase");
const { initializeSocket } = require("./config/socket");
const { setupDeviceGateway } = require("./sockets/deviceGateway");
const { startScheduler } = require("./jobs/aggregateReports");
const { startScheduleEngine } = require("./services/scheduleEngine");
const emailQueueWorker = require("./jobs/emailQueueWorker");
const institutionService = require("./services/institutionService");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const httpServer = http.createServer(app);

    initializeSocket(httpServer);

    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        logger.warn(`Port ${PORT} is already in use by a running server instance. Serving traffic on existing process.`);
      } else {
        logger.error(`Server error: ${err.message}`);
      }
    });

    httpServer.listen(PORT, "0.0.0.0", async () => {
      logger.info(`Server running on http://0.0.0.0:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);

      try {
        await connectDB();
        initializeFirebase();
        await institutionService.ensureAdminExists();
        setupDeviceGateway();
        startScheduler();
        startScheduleEngine();
        emailQueueWorker.start(10000);

        // Keep-alive self-ping interval every 14 minutes to prevent Render free-tier from sleeping
        setInterval(() => {
          http.get("http://127.0.0.1:" + PORT + "/health", (res) => {
            logger.info(`Keep-alive self-ping status: ${res.statusCode}`);
          }).on("error", () => {});
        }, 14 * 60 * 1000);
      } catch (err) {
        logger.error(`Background service init notice: ${err.message}`);
      }
    });

    // Automatically configure ADB port forwarding for USB-connected physical Android devices on boot
    const { exec } = require("child_process");
    exec("adb reverse tcp:5000 tcp:5000", (err) => {
      if (err) {
        logger.info("ADB reverse notice: Physical device not connected or ADB not found.");
      } else {
        logger.info("Successfully configured ADB port reverse: tcp:5000 -> tcp:5000");
      }
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
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
