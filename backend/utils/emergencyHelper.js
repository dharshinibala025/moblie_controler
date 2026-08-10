const fs = require("express").Router ? require("fs") : require("fs"); // safe check
const path = require("path");

const configPath = path.join(__dirname, "../config/emergency.json");

const getEmergencyUnblock = () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return !!data.emergencyUnblockActive;
    }
  } catch (err) {
    console.error("Error reading emergency config:", err);
  }
  return false;
};

const setEmergencyUnblock = (active) => {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify({ emergencyUnblockActive: !!active }), "utf8");
  } catch (err) {
    console.error("Error writing emergency config:", err);
  }
};

module.exports = { getEmergencyUnblock, setEmergencyUnblock };
