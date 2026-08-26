const User = require("../models/User");
const Rule = require("../models/Rule");
const Device = require("../models/Device");
const ScannedApp = require("../models/ScannedApp");
const { getEmergencyUnblock } = require("../utils/emergencyHelper");
const { getISTDate } = require("../utils/istTime");
const logger = require("../utils/logger");

const DEFAULT_WINDOW = {
  scheduleStart: "09:00",
  scheduleEnd: "16:00",
  activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const SOCIAL_MEDIA_PACKAGES = [
  "com.instagram.android",
  "com.whatsapp",
  "org.telegram.messenger",
  "com.snapchat.android",
  "com.twitter.android",
  "com.facebook.katana",
  "com.google.android.youtube",
  "com.instagram.barcelona", // Threads
  "com.discord",
];

const GAMES_PACKAGES = [
  "com.dts.freefireth",  // Free Fire
  "com.tencent.ig",      // PUBG
  "com.pubg.imobile",    // BGMI
];

const ENTERTAINMENT_PACKAGES = [
  "in.startv.hotstar",       // Hotstar
  "com.jio.media.ondemand",  // JioCinema
  "com.netflix.mediaclient",
  "com.netmirror",
  "com.sun.nxt",
  "com.amazon.avod.thirdpartyclient", // Prime Video
  "com.airtel.tv",           // Airtel Xstream
  "com.graymatrix.did",      // Zee5
];

// Only social media apps are auto-blocked by default.
// Games and entertainment remain available for EXPLICIT rule targeting
// but are NOT included in the default auto-block set.
const AUTO_BLOCK_PACKAGES = [
  ...SOCIAL_MEDIA_PACKAGES,
  // Note: GAMES_PACKAGES and ENTERTAINMENT_PACKAGES intentionally excluded.
  // Add "com.android.vending" (Play Store) only when admin explicitly adds it.
];

const CATEGORY_TO_PACKAGES = {
  social: SOCIAL_MEDIA_PACKAGES,
  games: GAMES_PACKAGES,
  entertainment: ENTERTAINMENT_PACKAGES,
};

// Android Settings app — blocked only while restrictions are active AND the
// student has completed setup (both Accessibility + Overlay granted), so they
// cannot revoke permissions mid-class. Never part of the always-on list.
const SETTINGS_PACKAGE = "com.android.settings";

// Rule blockedApps can contain tokens like "SocialMedia"/"Games" or raw package names.
const TOKEN_TO_CATEGORY = {
  socialmedia: "social",
  social: "social",
  games: "games",
  game: "games",
  gaming: "games",
  entertainment: "entertainment",
  streaming: "entertainment",
  all: "all",
  allapps: "all",
};

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Manual-start semantics: enforcement starts the moment an admin/staff applies
// a rule (the start time is NOT a gate). Only the end time (auto-stop) and the
// configured active days limit enforcement on the phone side.
const isRuleWithinEndTime = (rule, now) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = toMinutes(rule.scheduleEnd);
  return currentMinutes < endMinutes;
};

const isRuleActiveDay = (rule, now) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[now.getDay()];
  const days = rule.activeDays && rule.activeDays.length > 0
    ? rule.activeDays
    : DEFAULT_WINDOW.activeDays;
  return days.includes(dayName);
};

// Resolve the concrete package list enforced by a set of rules (used to build
// the FCM/socket payloads so devices receive a complete policy in one message).
const resolvePackagesFromRules = (rules) => {
  const blocked = new Set(AUTO_BLOCK_PACKAGES);
  for (const rule of rules || []) {
    for (const token of rule.blockedApps || []) {
      if (!token) continue;
      const category = TOKEN_TO_CATEGORY[String(token).toLowerCase().replace(/[^a-z]/g, "")] ||
        TOKEN_TO_CATEGORY[String(token).toLowerCase()];
      if (category) {
        (CATEGORY_TO_PACKAGES[category] || []).forEach((pkg) => blocked.add(pkg));
      } else {
        blocked.add(token);
      }
    }
  }
  // Settings is always part of an active restriction policy so permission
  // revocation is impossible mid-class (time-bounded by the end time).
  blocked.add(SETTINGS_PACKAGE);
  return Array.from(blocked);
};

const isDefaultWindowActive = (now) => {
  const istNow = getISTDate(now);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDay = dayNames[istNow.getDay()];
  if (!DEFAULT_WINDOW.activeDays.includes(currentDay)) {
    return false;
  }
  const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();
  return currentMinutes >= toMinutes(DEFAULT_WINDOW.scheduleStart) &&
    currentMinutes < toMinutes(DEFAULT_WINDOW.scheduleEnd);
};

/**
 * Build a Rule query that matches every scope a student belongs to.
 */
const buildScopeRuleQuery = (student) => {
  return {
    $or: [
      { targetClassId: student.classId },
      { "targetScope.type": "student", "targetScope.targetId": student._id.toString() },
      { "targetScope.type": "class", "targetScope.targetId": student.classId },
      { "targetScope.type": "institution", "targetScope.targetId": student.institutionId || "KSRCE" },
      ...(student.departmentId ? [{ "targetScope.type": "department", "targetScope.targetId": student.departmentId.toString() }] : []),
      ...(student.academicYearId ? [{ "targetScope.type": "year", "targetScope.targetId": student.academicYearId.toString() }] : []),
    ],
  };
};

/**
 * Resolve every package that should be blocked for a student right now.
 * Combines the always-on social/games/entertainment auto list with any
 * per-student scanned apps of those categories plus explicit rule blockedApps.
 */
const resolveBlockedPackages = async (studentId, rules) => {
  const blocked = new Set(AUTO_BLOCK_PACKAGES);

  try {
    const scannedApps = await ScannedApp.find({
      studentId,
      removedAt: null,
    }).lean();

    for (const app of scannedApps) {
      // Only auto-block social media apps from student's scanned list.
      // Games and entertainment apps are intentionally not included.
      if (app.category === "social") {
        blocked.add(app.packageName);
      }
    }

    for (const rule of rules || []) {
      for (const token of rule.blockedApps || []) {
        if (!token) continue;
        const category = TOKEN_TO_CATEGORY[String(token).toLowerCase().replace(/[^a-z]/g, "")] ||
          TOKEN_TO_CATEGORY[String(token).toLowerCase()];
        if (category) {
          (CATEGORY_TO_PACKAGES[category] || []).forEach((pkg) => blocked.add(pkg));
          if (category === "all") {
            scannedApps.forEach((app) => blocked.add(app.packageName));
          }
          scannedApps
            .filter((app) => app.category === category)
            .forEach((app) => blocked.add(app.packageName));
        } else {
          // Assume raw package name
          blocked.add(token);
        }
      }
    }
  } catch (err) {
    logger.error("Error resolving blocked packages:", err);
  }

  return Array.from(blocked);
};

/**
 * Compute the live enforcement policy for a student.
 * @param {{student: Object, device: Object|null, now?: Date}} params
 */
const getStudentPolicy = async ({ student, device = null, now }) => {
  const istNow = getISTDate(now);
  const rules = await Rule.find({
    ...buildScopeRuleQuery(student),
    status: { $in: ["active", "paused", "stopped"] },
  }).sort({ updatedAt: -1 }).lean();

  const activeRules = rules.filter((rule) => rule.status === "active");
  const hasAnyRule = rules.length > 0;
  const emergencyActive = getEmergencyUnblock(student.classId);

  // Effective schedule window for UI/device scheduling
  let scheduleStart = DEFAULT_WINDOW.scheduleStart;
  let scheduleEnd = DEFAULT_WINDOW.scheduleEnd;
  let activeDays = DEFAULT_WINDOW.activeDays;
  let source = "default";

  if (hasAnyRule) {
    const primary = rules[0];
    scheduleStart = primary.scheduleStart;
    scheduleEnd = primary.scheduleEnd;
    if (primary.activeDays && primary.activeDays.length > 0) {
      activeDays = primary.activeDays;
    }
    source = "rule";
  }

  // Schedule is enforced either by an active rule (manual-start: blocking begins
  // the moment the rule is applied, regardless of the clock) OR, when no rule has
  // ever been configured, by the built-in default 09:00 - 16:00 window.
  let scheduleActive = false;
  if (activeRules.length > 0) {
    const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();
    const endMinutes = toMinutes(scheduleEnd || "16:00");
    // Auto-unblock automatically at 04:00 PM (or end of schedule window):
    if (currentMinutes >= endMinutes) {
      scheduleActive = false;
    } else {
      scheduleActive = true;
    }
  } else {
    // If Admin/Staff has NOT manually applied a restriction policy, apps remain 100% UNBLOCKED.
    scheduleActive = false;
  }

  let status;
  let restrictionReason;

  if (device && device.status === "blocked") {
    status = "active";
    restrictionReason = "Device blocked manually by administrator";
  } else if (emergencyActive) {
    status = "inactive";
    restrictionReason = "Emergency unblock active (restrictions temporarily lifted)";
  } else if (scheduleActive) {
    status = "active";
    restrictionReason = hasAnyRule
      ? "Inside restricted timing window (social media and games blocked)"
      : `Default classroom control active (${DEFAULT_WINDOW.scheduleStart} - ${DEFAULT_WINDOW.scheduleEnd}): social media and games blocked`;
  } else {
    status = "inactive";
    restrictionReason = "Outside restricted timing window (social media and games unblocked)";
  }

  const blockedPackages = status === "active"
    ? await resolveBlockedPackages(student._id, activeRules)
    : [];

  // Block the Android Settings app during an active restriction window so the
  // student cannot revoke permissions mid-class. Always applied while active
  // (enforcement is time-bounded: after the end time the overlay auto-stops and
  // Settings becomes usable again).
  if (
    status === "active" &&
    !blockedPackages.includes(SETTINGS_PACKAGE)
  ) {
    blockedPackages.push(SETTINGS_PACKAGE);
  }

  let maxPolicyVersion = 0;
  for (const rule of rules) {
    maxPolicyVersion = Math.max(maxPolicyVersion, rule.policyVersion || 1);
  }

  return {
    policyVersion: maxPolicyVersion,
    blockedPackages,
    restrictionReason,
    status,
    scheduleStart,
    scheduleEnd,
    activeDays,
    scheduleActive: status === "active",
    source,
    emergency: emergencyActive ? "active" : "inactive",
    classId: student.classId,
    nextUnlockAt: status === "active" ? computeNextBoundary(istNow, scheduleEnd, activeDays) : null,
  };
};

const computeNextBoundary = (now, scheduleEnd, activeDays) => {
  try {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const [eh, em] = String(scheduleEnd).split(":").map(Number);
    const candidate = new Date(now);
    candidate.setHours(eh, em, 0, 0);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = (eh || 0) * 60 + (em || 0);
    if (endMinutes > nowMinutes && activeDays.includes(dayNames[now.getDay()])) {
      return candidate.toISOString();
    }
    for (let d = 1; d <= 7; d += 1) {
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + d);
      if (activeDays.includes(dayNames[nextDay.getDay()])) {
        nextDay.setHours(eh, em, 0, 0);
        return nextDay.toISOString();
      }
    }
  } catch (err) {
    logger.error("Error computing next boundary:", err);
  }
  return null;
};

/**
 * Resolve the currently enforced window for a whole class (used by the
 * schedule engine). Mirrors getStudentPolicy without per-device overrides.
 * @param {string} classId
 * @param {Date} now
 */
const getClassWindow = async (classId, now) => {
  const istNow = getISTDate(now);
  const rules = await Rule.find({
    targetClassId: classId,
    status: { $in: ["active", "paused", "stopped"] },
  }).sort({ updatedAt: -1 }).lean();

  const activeRules = rules.filter((rule) => rule.status === "active");
  const hasAnyRule = rules.length > 0;

  let scheduleStart = DEFAULT_WINDOW.scheduleStart;
  let scheduleEnd = DEFAULT_WINDOW.scheduleEnd;
  let activeDays = DEFAULT_WINDOW.activeDays;

  if (hasAnyRule) {
    const primary = rules[0];
    scheduleStart = primary.scheduleStart;
    scheduleEnd = primary.scheduleEnd;
    if (primary.activeDays && primary.activeDays.length > 0) {
      activeDays = primary.activeDays;
    }
  }

  let active = false;
  if (activeRules.length > 0) {
    // Manual-start: the class window counts as "active" from the moment a rule
    // is applied until its end time, so the engine auto-stops at end time but
    // NEVER auto-pauses immediately after an apply (which used to happen when
    // the window was gated by the start time).
    active = activeRules.some(
      (rule) => isRuleWithinEndTime(rule, istNow) && isRuleActiveDay(rule, istNow)
    );
  } else if (!hasAnyRule) {
    active = isDefaultWindowActive(istNow);
  }

  return {
    classId,
    active,
    scheduleStart,
    scheduleEnd,
    activeDays,
    source: hasAnyRule ? "rule" : "default",
  };
};

module.exports = {
  getStudentPolicy,
  getClassWindow,
  resolveBlockedPackages,
  resolvePackagesFromRules,
  isDefaultWindowActive,
  buildScopeRuleQuery,
  DEFAULT_WINDOW,
  AUTO_BLOCK_PACKAGES,
  SETTINGS_PACKAGE,
};
