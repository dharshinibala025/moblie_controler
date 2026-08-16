const User = require("../models/User");
const Device = require("../models/Device");
const autoBlockService = require("./autoBlockService");
const { emitToClass } = require("../config/socket");
const logger = require("../utils/logger");

const TICK_MS = 60 * 1000;

const lastStates = new Map();
let running = false;
let timer = null;

/**
 * Dispatch boundary transitions (start/stop) so connected devices react
 * immediately when a class window opens or closes, even without polling.
 */
const tick = async () => {
  if (running) return;
  running = true;

  const now = new Date();
  try {
    const classIds = await User.distinct("classId", { role: "student", classId: { $ne: null } });

    for (const classId of classIds) {
      if (!classId) continue;
      try {
        const window = await autoBlockService.getClassWindow(classId, now);
        const newState = window.active ? "active" : "inactive";
        const prevState = lastStates.get(classId);

        if (prevState === newState) continue;

        lastStates.set(classId, newState);

        const action = newState === "active" ? "start" : "stop";

        emitToClass(classId, "rule:update", {
          action,
          scheduleStart: window.scheduleStart,
          scheduleEnd: window.scheduleEnd,
          activeDays: window.activeDays,
          status: newState,
          source: window.source,
          serverTimestamp: now.toISOString(),
        });

        await Device.updateMany(
          {
            userId: {
              $in: await User.find({ classId, role: "student" }).select("_id"),
            },
          },
          {
            $set: {
              lastKnownCommand: {
                ruleId: null,
                action,
                serverTimestamp: now,
              },
            },
          }
        );

        logger.info(`Schedule engine: class ${classId} window -> ${newState} (${action}) [${window.source}]`);
      } catch (err) {
        logger.error(`Schedule engine error for class ${classId}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Schedule engine tick error: ${err.message}`);
  } finally {
    running = false;
  }
};

const startScheduleEngine = () => {
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
  logger.info(`Schedule engine started (every ${TICK_MS / 1000}s)`);
  // Immediate first tick
  setTimeout(tick, 5000);
};

const stopScheduleEngine = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = { startScheduleEngine, stopScheduleEngine, tick };
