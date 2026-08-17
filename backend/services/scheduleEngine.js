const User = require("../models/User");
const Device = require("../models/Device");
const Rule = require("../models/Rule");
const autoBlockService = require("./autoBlockService");
const ruleService = require("./ruleService");
const { emitToClass } = require("../config/socket");
const { getISTDate } = require("../utils/istTime");
const logger = require("../utils/logger");

const TICK_MS = 60 * 1000;

const lastStates = new Map();
let running = false;
let timer = null;

/**
 * Dispatch boundary transitions (stop only) so connected devices react
 * immediately when a class window closes, even without polling.
 *
 * Manual start: Only the staff/admin "Set Restriction Timing" button or
 * "Resume" action can start blocking. The schedule engine NEVER auto-starts.
 * Auto stop: When the schedule window closes, blocking is automatically stopped.
 */
const tick = async () => {
  if (running) return;
  running = true;

  const now = getISTDate();
  try {
    const classIdsFromField = await User.distinct("classId", { role: "student", classId: { $ne: null } });
    const classIdsFromRef = await User.distinct("classRoomId", { role: "student", classRoomId: { $ne: null } });
    const classIds = [...new Set([...classIdsFromField, ...classIdsFromRef.map(id => id.toString())])];

    for (const classId of classIds) {
      if (!classId) continue;
      try {
        const window = await autoBlockService.getClassWindow(classId, now);
        const newState = window.active ? "active" : "inactive";
        const prevState = lastStates.get(classId);

        if (prevState === newState) continue;

        lastStates.set(classId, newState);

        if (newState === "active") {
          // Window just opened — do NOT auto-start blocking.
          // Staff/admin must manually click "Set Restriction Timing" to start.
          logger.info(`Schedule engine: class ${classId} window opened (waiting for manual start) [${window.source}]`);
        } else {
          // Window just closed — auto-stop blocking if it was active.
          const activeRules = await Rule.find({
            targetClassId: classId,
            status: "active",
          });

          if (activeRules.length > 0) {
            for (const rule of activeRules) {
              try {
                await ruleService.sendCommand(rule._id, "pause", "Schedule window closed - auto-pause");
              } catch (cmdErr) {
                logger.error(`Auto-pause command failed for rule ${rule._id}: ${cmdErr.message}`);
              }
            }

            emitToClass(classId, "rule:update", {
              action: "stop",
              scheduleStart: window.scheduleStart,
              scheduleEnd: window.scheduleEnd,
              activeDays: window.activeDays,
              status: "paused",
              source: window.source,
              serverTimestamp: new Date().toISOString(),
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
                    action: "stop",
                    serverTimestamp: now,
                  },
                },
              }
            );

            logger.info(`Schedule engine: class ${classId} window closed -> auto-stopped (${activeRules.length} rules paused) [${window.source}]`);
          } else {
            logger.info(`Schedule engine: class ${classId} window closed (no active rules to stop) [${window.source}]`);
          }
        }
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
