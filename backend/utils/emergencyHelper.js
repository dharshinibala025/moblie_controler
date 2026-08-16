const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config/emergency.json");

const CLASS_EMERGENCY_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const readState = () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return data && typeof data === "object" ? data : {};
    }
  } catch (err) {
    console.error("Error reading emergency config:", err);
  }
  return {};
};

const writeState = (state) => {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(state), "utf8");
  } catch (err) {
    console.error("Error writing emergency config:", err);
  }
};

/**
 * Returns true when a global emergency unblock is active, OR a class-scoped
 * emergency unblock (non-expired) is active for the given classId.
 * @param {string|null} classId
 */
const getEmergencyUnblock = (classId) => {
  const state = readState();
  if (state.emergencyUnblockActive) return true;

  if (classId && state.classEmergency && state.classEmergency[classId]) {
    const setAt = state.classEmergency[classId];
    if (Date.now() - setAt < CLASS_EMERGENCY_TTL_MS) {
      return true;
    }
    delete state.classEmergency[classId];
    writeState(state);
  }
  return false;
};

const setEmergencyUnblock = (active) => {
  writeState({ ...readState(), emergencyUnblockActive: !!active });
};

const setClassEmergencyUnblock = (classId, active) => {
  if (!classId) return;
  const state = readState();
  state.classEmergency = state.classEmergency || {};
  if (active) {
    state.classEmergency[classId] = Date.now();
  } else {
    delete state.classEmergency[classId];
  }
  writeState(state);
};

module.exports = {
  getEmergencyUnblock,
  setEmergencyUnblock,
  setClassEmergencyUnblock,
  CLASS_EMERGENCY_TTL_MS,
};
