process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Rule = require("../models/Rule");
const Notification = require("../models/Notification");
const autoBlockService = require("../services/autoBlockService");
const { SETTINGS_PACKAGE } = require("../services/autoBlockService");

let app;
let adminUser;
let adminToken;
let studentA, studentB;

const insideWindow = () => new Date(2026, 7, 17, 10, 30, 0); // Monday 10:30

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  adminUser = await User.create({
    name: "Bulk Admin",
    email: "bulk-admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "INST001",
  });

  studentA = await User.create({
    name: "Bulk Student A",
    email: "bulk-a@test.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  });

  studentB = await User.create({
    name: "Bulk Student B",
    email: "bulk-b@test.com",
    password: "Student@123",
    role: "student",
    classId: "C102",
    institutionId: "INST001",
  });

  await Device.create({ userId: studentA._id, status: "online" });
  await Device.create({ userId: studentB._id, status: "online" });

  const login = await request(app)
    .post("/auth/login")
    .send({ email: "bulk-admin@test.com", password: "Admin@123" });
  adminToken = login.body.accessToken || login.body.token;
});

const bulkApply = async (classIds) => {
  return request(app)
    .post("/admin/rules/bulk")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      blockedApps: ["SocialMedia"],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      targetClassIds: classIds,
      status: "active",
      reason: "Test Bulk Policy",
    });
};

describe("Admin bulk rule apply", () => {
  test("creates exactly one rule per class in a single request", async () => {
    const res = await bulkApply(["C101", "C102"]);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.applied).toBe(2);
    expect(res.body.total).toBe(2);

    const rules = await Rule.find({ targetClassId: { $in: ["C101", "C102"] } });
    expect(rules).toHaveLength(2);
    for (const rule of rules) {
      expect(rule.status).toBe("active");
    }
  });

  test("re-applying bulk updates the existing rule instead of stacking duplicates", async () => {
    await bulkApply(["C101"]);

    const res = await bulkApply(["C101"]);
    expect(res.body.applied).toBe(1);
    expect(res.body.success).toBe(true);

    const rules = await Rule.find({ targetClassId: "C101" });
    expect(rules).toHaveLength(1);
  });
});

describe("Admin batched pause / resume", () => {
  test("pause flips all active rules to paused and unblocks devices", async () => {
    await bulkApply(["C101", "C102"]);

    const res = await request(app)
      .post("/admin/override/pause")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ targetClassIds: ["C101", "C102"] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.affectedRules) ? res.body.affectedRules.length : res.body.affectedRules).toBe(2);

    expect(await Rule.countDocuments({ status: "paused" })).toBe(2);
    expect(await Device.countDocuments({ status: "active" })).toBe(2);
  });

  test("resume flips paused rules back to active and blocks devices", async () => {
    await bulkApply(["C101", "C102"]);
    await request(app)
      .post("/admin/override/pause")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ targetClassIds: ["C101", "C102"] });

    const res = await request(app)
      .post("/admin/override/resume")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ targetClassIds: ["C101", "C102"] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.affectedRules) ? res.body.affectedRules.length : res.body.affectedRules).toBe(2);

    expect(await Rule.countDocuments({ status: "active" })).toBe(2);
    expect(await Device.countDocuments({ status: "blocked" })).toBe(2);
  });

  test("pause creates exactly one 'Paused' notification per student (batched, deduped)", async () => {
    await bulkApply(["C101", "C102"]);
    await request(app)
      .post("/admin/override/pause")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ targetClassIds: ["C101", "C102"] });

    const pausedNotifs = await Notification.find({ title: { $regex: /Restriction Paused/i } });
    expect(pausedNotifs).toHaveLength(2);
    const studentIds = pausedNotifs.map((n) => n.studentId.toString()).sort();
    expect(studentIds).toEqual([studentA._id.toString(), studentB._id.toString()].sort());
  });

  test("pause with no matching rules affects zero rules", async () => {
    const res = await request(app)
      .post("/admin/override/pause")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ targetClassIds: ["C999"] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.affectedRules) ? res.body.affectedRules.length : res.body.affectedRules).toBe(0);
  });
});

describe("autoBlockService - Android Settings block after setup", () => {
  test("Settings is blocked during an active window only when setup is complete (both permissions)", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      status: "active",
    });

    const completedDevice = await Device.findOneAndUpdate(
      { userId: studentA._id },
      {
        $set: {
          status: "blocked",
          deviceInfo: { accessibilityEnabled: true, overlayEnabled: true },
        },
      },
      { new: true }
    );

    const policy = await autoBlockService.getStudentPolicy({
      student: studentA,
      device: completedDevice,
      now: insideWindow(),
    });
    expect(policy.status).toBe("active");
    expect(policy.blockedPackages).toContain(SETTINGS_PACKAGE);
  });

  test("Settings is blocked whenever the policy is active (setup-independent)", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      status: "active",
    });

    const incompleteDevice = await Device.findOneAndUpdate(
      { userId: studentA._id },
      {
        $set: {
          status: "blocked",
          deviceInfo: { accessibilityEnabled: true, overlayEnabled: false },
        },
      },
      { new: true }
    );

    const policy = await autoBlockService.getStudentPolicy({
      student: studentA,
      device: incompleteDevice,
      now: insideWindow(),
    });
    expect(policy.status).toBe("active");
    // Settings is always part of an active restriction policy so permissions
    // cannot be revoked mid-class (enforcement is time-bounded by the end time).
    expect(policy.blockedPackages).toContain(SETTINGS_PACKAGE);
  });
});
