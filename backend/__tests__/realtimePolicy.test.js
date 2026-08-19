process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Rule = require("../models/Rule");
const autoBlockService = require("../services/autoBlockService");

let app;
let adminToken;
let adminUserRef;

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  const adminUser = await User.create({
    name: "Realtime Admin",
    email: "realtime-admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "INST001",
  });
  adminUserRef = adminUser._id;

  const loginRes = await request(app)
    .post("/auth/login")
    .send({ email: "realtime-admin@test.com", password: "Admin@123" });
  adminToken = loginRes.body.accessToken || loginRes.body.token;
});

test("resolvePackagesFromRules returns resolved package names (not tokens) plus Settings", () => {
  const packages = autoBlockService.resolvePackagesFromRules([
    { blockedApps: ["SocialMedia", "Games"] },
    { blockedApps: ["com.custom.app"] },
  ]);

  expect(Array.isArray(packages)).toBe(true);
  // Social-media package resolved from the category token.
  expect(packages).toContain("com.instagram.android");
  expect(packages).toContain("com.whatsapp");
  // Games package resolved from the category token.
  expect(packages).toContain("com.dts.freefireth");
  // Raw package tokens are passed through.
  expect(packages).toContain("com.custom.app");
  // Settings is always part of an active restriction policy.
  expect(packages).toContain("com.android.settings");
});

test("getStudentPolicy includes Settings when active even without device permissions", async () => {
  const student = await User.create({
    name: "Policy Student",
    email: "policy-student@test.com",
    password: "Student@123",
    role: "student",
    classId: "C100",
    institutionId: "INST001",
  });

  await Rule.create({
    targetClassId: "C100",
    targetScope: { type: "class", targetId: "C100" },
    scheduleStart: "09:00",
    scheduleEnd: "16:00",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    blockedApps: ["SocialMedia"],
    reason: "Class hours",
    status: "active",
    policyVersion: 2,
    createdBy: adminUserRef,
  });

  // No device passed, no permissions reported: Settings must STILL be blocked
  // while the policy is active (permission gate removed).
  const policy = await autoBlockService.getStudentPolicy({ student, device: null, now: new Date() });

  expect(policy.status).toBe("active");
  expect(policy.blockedPackages).toContain("com.android.settings");
  expect(policy.blockedPackages).toContain("com.instagram.android");
});

test("getStudentPolicy resolves scanned social apps for the student", async () => {
  const student = await User.create({
    name: "Scan Student",
    email: "scan-student@test.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  });

  const ScannedApp = require("../models/ScannedApp");
  const Device = require("../models/Device");
  const device = await Device.create({
    userId: student._id,
    deviceId: "dev-scan-123",
    status: "online",
  });
  await ScannedApp.create({
    studentId: student._id,
    deviceId: device._id,
    packageName: "com.example.mysocialapp",
    appName: "My Social",
    category: "social",
  });

  await Rule.create({
    targetClassId: "C101",
    targetScope: { type: "class", targetId: "C101" },
    scheduleStart: "09:00",
    scheduleEnd: "16:00",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    blockedApps: ["SocialMedia"],
    reason: "Class hours",
    status: "active",
    policyVersion: 1,
    createdBy: adminUserRef,
  });

  const policy = await autoBlockService.getStudentPolicy({ student, device, now: new Date() });

  // Device-specific social app from the student's scan is included.
  expect(policy.blockedPackages).toContain("com.example.mysocialapp");
  expect(policy.blockedPackages).toContain("com.android.settings");
});

test("processScan preserves the device-reported category so the app gets blocked", async () => {
  const student = await User.create({
    name: "Scan Category Student",
    email: "scan-cat@test.com",
    password: "Student@123",
    role: "student",
    classId: "C102",
    institutionId: "INST001",
  });

  const Device = require("../models/Device");
  const ScannedApp = require("../models/ScannedApp");
  const scanService = require("../services/scanService");
  const device = await Device.create({
    userId: student._id,
    deviceId: "dev-cat-123",
    status: "online",
  });

  // The phone classifies this app as social even though it is not in any
  // static list / catalog. processScan must KEEP that category.
  const result = await scanService.processScan(student._id.toString(), device._id.toString(), [
    {
      packageName: "com.unknown.socialapp",
      appName: "Unknown Social",
      versionName: "1.0.0",
      isSystemApp: false,
      isGame: false,
      isSocial: true,
      category: "social",
    },
  ]);

  expect(result.scannedCount).toBe(1);

  const stored = await ScannedApp.findOne({
    studentId: student._id,
    packageName: "com.unknown.socialapp",
    removedAt: null,
  }).lean();
  expect(stored).toBeTruthy();
  expect(stored.category).toBe("social");

  await Rule.create({
    targetClassId: "C102",
    targetScope: { type: "class", targetId: "C102" },
    scheduleStart: "09:00",
    scheduleEnd: "16:00",
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    blockedApps: ["SocialMedia"],
    reason: "Class hours",
    status: "active",
    policyVersion: 1,
    createdBy: adminUserRef,
  });

  const policy = await autoBlockService.getStudentPolicy({ student, device, now: new Date() });
  // Because the category was preserved, the scanned app lands in the blocked list.
  expect(policy.blockedPackages).toContain("com.unknown.socialapp");
});