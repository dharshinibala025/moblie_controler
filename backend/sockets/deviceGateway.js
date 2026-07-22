const { getIO, emitToClass } = require("../config/socket");
const Device = require("../models/Device");
const dispatchService = require("../services/dispatchService");
const logger = require("../utils/logger");

const setupDeviceGateway = () => {
  const io = getIO();
  if (!io) {
    logger.warn("Socket.io not initialized, skipping device gateway setup");
    return;
  }

  io.on("connection", (socket) => {
    if (socket.user.role === "student") {
      handleStudentConnection(socket);
    }

    if (socket.user.role === "admin" || socket.user.role === "staff") {
      handleMonitorConnection(socket);
    }

    socket.on("device:heartbeat", async () => {
      try {
        const device = await Device.findOne({ userId: socket.user.userId });
        if (device) {
          device.lastSyncAt = new Date();
          device.status = "online";
          await device.save();
        }
      } catch (err) {
        logger.error(`Heartbeat error: ${err.message}`);
      }
    });

    socket.on("device:requestState", async () => {
      try {
        if (socket.user.classId) {
          const command = await dispatchService.getLatestCommand(socket.user.classId);
          if (command) {
            socket.emit("rule:update", command);
          }
        }
      } catch (err) {
        logger.error(`State request error: ${err.message}`);
      }
    });

    socket.on("disconnect", async () => {
      try {
        const device = await Device.findOne({ userId: socket.user.userId });
        if (device) {
          device.status = "offline";
          await device.save();
        }
      } catch (err) {
        logger.error(`Disconnect handler error: ${err.message}`);
      }
    });
  });
};

async function handleStudentConnection(socket) {
  try {
    const device = await Device.findOne({ userId: socket.user.userId });
    if (device) {
      device.status = "online";
      device.lastSyncAt = new Date();
      await device.save();
    }

    if (socket.user.classId) {
      const command = await dispatchService.getLatestCommand(socket.user.classId);
      if (command) {
        socket.emit("rule:update", command);
      }
    }
  } catch (err) {
    logger.error(`Student connection setup error: ${err.message}`);
  }
}

function handleMonitorConnection(socket) {
  logger.debug(`Monitor connected: userId=${socket.user.userId}, role=${socket.user.role}`);
}

module.exports = { setupDeviceGateway };
