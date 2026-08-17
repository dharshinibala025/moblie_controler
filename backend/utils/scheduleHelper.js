/**
 * Schedule Helper
 * Determines whether a policy rule is currently active based on IST time,
 * active days, and daily start/end schedule window (e.g., 09:00 to 16:00).
 */
const { getISTDate } = require("./istTime");

exports.isRuleActiveNow = (rule, now) => {
  if (!rule || rule.status !== "active") {
    return false;
  }

  const istNow = getISTDate(now);

  // 1. Check active days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDay = dayNames[istNow.getDay()];
  if (rule.activeDays && rule.activeDays.length > 0 && !rule.activeDays.includes(currentDay)) {
    return false;
  }

  // 2. Check schedule time window (e.g., 09:00 to 16:00 / 4:00 PM)
  if (rule.scheduleStart && rule.scheduleEnd) {
    const [startH, startM] = rule.scheduleStart.split(":").map(Number);
    const [endH, endM] = rule.scheduleEnd.split(":").map(Number);

    const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return false;
    }
  }

  return true;
};
