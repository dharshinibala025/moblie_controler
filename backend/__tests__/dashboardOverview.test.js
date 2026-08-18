process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Session = require("../models/Session");

let app;
let adminToken;

const TWO_MIN_MS = 2 * 60 * 1000;

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
    name: "Overview Admin",
    email: "overview-admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "INST001",
  });

  const loginRes = await request(app)
    .post("/auth/login")
    .send({ email: "overview-admin@test.com", password: "Admin@123" });
  adminToken = loginRes.body.accessToken || loginRes.body.token;
});

test("GET /admin/dashboard/overview returns real counts (no mock values)", async () => {
  const studentA = await User.create({
    name: "Student A",
    email: "overview-a@test.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  });
  await User.create({
    name: "Student B",
    email: "overview-b@test.com",
    password: "Student@123",
    role: "student",
    classId: "C102",
    institutionId: "INST001",
  });
  await User.create({
    name: "Staff One",
    email: "overview-staff@test.com",
    password: "Staff@123",
    role: "staff",
    classId: "C101",
    institutionId: "INST001",
  });
  // Outside the admin's institution - must NOT be counted.
  const otherInstStudent = await User.create({
    name: "Other Inst",
    email: "overview-other@test.com",
    password: "Student@123",
    role: "student",
    classId: "Z999",
    institutionId: "OTHER-INST",
  });

  // 2 devices synced within the last 2 minutes (connected now).
  await Device.create({ userId: studentA._id, status: "online", lastSyncAt: new Date(Date.now() - 30000) });
  await Device.create({ userId: otherInstStudent._id, status: "online", lastSyncAt: new Date(Date.now() - 10000) });
  // 1 stale device (older than 2 min) - not connected.
  await Device.create({ userId: (await User.create({
    name: "Stale Student",
    email: "overview-stale@test.com",
    password: "Student@123",
    role: "student",
    classId: "C103",
    institutionId: "INST001",
  }))._id, status: "online", lastSyncAt: new Date(Date.now() - 10 * 60 * 1000) });
  // 1 blocked device in institution.
  const blockedStudent = await User.create({
    name: "Blocked Student",
    email: "overview-blocked@test.com",
    password: "Student@123",
    role: "student",
    classId: "C104",
    institutionId: "INST001",
  });
  await Device.create({ userId: blockedStudent._id, status: "blocked", lastSyncAt: new Date() });

  // Sessions this week (2 this week, 1 last month).
  await Session.create({
    userId: studentA._id,
    refreshTokenHash: "hash-week-1",
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
  });
  await Session.create({
    userId: blockedStudent._id,
    refreshTokenHash: "hash-week-2",
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(Date.now() - 60000),
  });
  await Session.create({
    userId: studentA._id,
    refreshTokenHash: "hash-old",
    expiresAt: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 40 * 86400000),
  });

  const res = await request(app)
    .get("/admin/dashboard/overview")
    .set("Authorization", `Bearer ${adminToken}`);

  expect(res.status).toBe(200);

  const stats = Object.fromEntries(res.body.stats.map((s) => [s.id, s]));
  // Real user counts, scoped to INST001 (excludes OTHER-INST + its device):
  // students = A, B, stale, blocked = 4 (OTHER-INST student excluded).
  expect(stats["total-students"].value).toBe("4");
  expect(stats["total-staff"].value).toBe("1");
  // Connected = INST001 devices synced within 2 min: studentA(30s ago) + blocked(now) = 2.
  // (OTHER-INST device excluded; stale device older than 2 min excluded.)
  expect(stats["connected-phones"].value).toBe("2");
  expect(stats["blocked-phones"].value).toBe("1");

  // No hardcoded mock trend strings anywhere.
  const trendValues = res.body.stats.map((s) => s.trend).filter((t) => t !== null);
  expect(trendValues.every((t) => /^\d+%$/.test(t))).toBe(true);
  expect(res.body.stats.find((s) => s.id === "total-students").trend).toBeNull();

  // Real weekly session count (this-week sessions only): 2 seeded + 1 from the admin login above.
  expect(res.body.usageSummary.sessionsThisWeek).toBe(3);

  // Recent activities is always a real (possibly empty) array - never fake.
  expect(Array.isArray(res.body.recentActivities)).toBe(true);
});

test("dashboard overview with no data returns zeroed real counts", async () => {
  const res = await request(app)
    .get("/admin/dashboard/overview")
    .set("Authorization", `Bearer ${adminToken}`);

  expect(res.status).toBe(200);
  const stats = Object.fromEntries(res.body.stats.map((s) => [s.id, s]));
  expect(stats["total-students"].value).toBe("0");
  expect(stats["total-staff"].value).toBe("0");
  expect(stats["connected-phones"].value).toBe("0");
  expect(stats["blocked-phones"].value).toBe("0");
  expect(res.body.usageSummary.sessionsThisWeek).toBe(1); // the admin login session only
});