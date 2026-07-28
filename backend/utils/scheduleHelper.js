/**
 * Schedule Helper
 * Determines whether a policy rule is currently active based on system time,
 * active days, and daily start/end schedule window (e.g., 09:00 to 16:00).
 */

exports.isRuleActiveNow = (rule, now = new Date()) => {
  if (!rule || rule.status !== "active") {
    return false;
  }

  // 1. Check active days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDay = dayNames[now.getDay()];
  if (rule.activeDays && rule.activeDays.length > 0 && !rule.activeDays.includes(currentDay)) {
    return false;
  }

  // 2. Check schedule time window (e.g., 09:00 to 16:00 / 4:00 PM)
  if (rule.scheduleStart && rule.scheduleEnd) {
    const [startH, startM] = rule.scheduleStart.split(":").map(Number);
    const [endH, endM] = rule.scheduleEnd.split(":").map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return false;
    }
  }

  return true;
};
