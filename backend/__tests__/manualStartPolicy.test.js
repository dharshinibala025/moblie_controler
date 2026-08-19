process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Rule = require("../models/Rule");
const autoBlockService = require("../services/autoBlockService");
const { resolvePackagesFromRules } = require("../services/autoBlockService");

let studentUser;
let adminUser;

// Monday 10:30 — OUTSIDE the rule window below (which starts at 23:00).
const outsideStartWindow = () => new Date(2026, 7, 17, 10, 30, 0);
// Monday 18:00 — PAST the rule end time (16:00).
const pastEndTime = () => new Date(2026, 7, 17, 18, 0, 0);

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  adminUser = await User.create({
    name: "Manual Admin",
    email: "manual-admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "INST001",
  });

  studentUser = await User.create({
    name: "Manual Student",
    email: "manual-student@test.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  });
});

const makeActiveRule = async (overrides = {}) => {
  return Rule.create({
    createdBy: adminUser._id,
    targetClassId: "C101",
    blockedApps: ["SocialMedia"],
    scheduleStart: "23:00",
    scheduleEnd: "16:00",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    status: "active",
    policyVersion: 1,
    ...overrides,
  });
};

describe("Manual-start semantics (apply = block immediately)", () => {
  test("active rule OUTSIDE its start window still enforces (block now)", async () => {
    await makeActiveRule();
    const policy = await autoBlockService.getStudentPolicy({
      student: studentUser,
      now: outsideStartWindow(),
    });
    expect(policy.status).toBe("active");
    expect(policy.scheduleActive).toBe(true);
    expect(policy.blockedPackages.length).toBeGreaterThan(0);
    expect(policy.blockedPackages).toContain("com.instagram.android");
  });

  test("paused rule is NOT enforced even inside the clock window", async () => {
    await makeActiveRule({ status: "paused" });
    const policy = await autoBlockService.getStudentPolicy({
      student: studentUser,
      now: outsideStartWindow(),
    });
    expect(policy.status).toBe("inactive");
    expect(policy.blockedPackages).toEqual([]);
  });

  test("active rule with past end time is still 'active' server-side (native safety handles auto-stop)", async () => {
    // The schedule engine pauses the rule at its end time; until that tick the
    // policy stays active but the phone's native service self-limits to < end.
    await makeActiveRule();
    const policy = await autoBlockService.getStudentPolicy({
      student: studentUser,
      now: pastEndTime(),
    });
    expect(policy.status).toBe("active");
    expect(policy.nextUnlockAt).not.toBeNull();
  });

  test("getClassWindow counts an active rule outside its start window as active (no auto-pause on apply)", async () => {
    await makeActiveRule();
    const window = await autoBlockService.getClassWindow("C101", outsideStartWindow());
    expect(window.active).toBe(true);
    expect(window.source).toBe("rule");
  });

  test("getClassWindow goes inactive once the end time passes (auto-stop)", async () => {
    await makeActiveRule();
    const window = await autoBlockService.getClassWindow("C101", pastEndTime());
    expect(window.active).toBe(false);
  });

  test("resolvePackagesFromRules expands tokens to concrete packages", async () => {
    const packages = resolvePackagesFromRules([
      {
        blockedApps: ["SocialMedia", "Games", "com.custom.app"],
      },
    ]);
    expect(packages).toContain("com.instagram.android");
    expect(packages).toContain("com.whatsapp");
    expect(packages).toContain("com.dts.freefireth");
    expect(packages).toContain("com.custom.app");
  });

  test("device is enforced as blocked by an active rule", async () => {
    await Device.create({ userId: studentUser._id, status: "blocked" });
    await makeActiveRule();
    const policy = await autoBlockService.getStudentPolicy({
      student: studentUser,
      now: outsideStartWindow(),
    });
    expect(policy.status).toBe("active");
  });
});