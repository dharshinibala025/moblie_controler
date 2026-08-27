process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Rule = require("../models/Rule");
const ScannedApp = require("../models/ScannedApp");
const autoBlockService = require("../services/autoBlockService");
const emergencyHelper = require("../utils/emergencyHelper");

let app;
let studentUser, studentOtherClass, staffUser, adminUser;
let adminToken, staffToken, studentToken;

const insideWindow = () => new Date(2026, 7, 17, 10, 30, 0); // Monday 10:30
const outsideWindow = () => new Date(2026, 7, 17, 17, 30, 0); // Monday 17:30

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();
  emergencyHelper.setEmergencyUnblock(false);
  emergencyHelper.setClassEmergencyUnblock("C101", false);
  emergencyHelper.setClassEmergencyUnblock("C102", false);

  adminUser = await User.create({
    name: "Policy Admin",
    email: "policy-admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "INST001",
  });

  staffUser = await User.create({
    name: "Policy Staff",
    email: "policy-staff@test.com",
    password: "Staff@123",
    role: "staff",
    classId: "C101",
    institutionId: "INST001",
  });

  studentUser = await User.create({
    name: "Policy Student",
    email: "policy-student@test.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  });

  studentOtherClass = await User.create({
    name: "Other Student",
    email: "policy-student2@test.com",
    password: "Student@123",
    role: "student",
    classId: "C102",
    institutionId: "INST001",
  });

  const loginAdmin = await request(app).post("/auth/login").send({ email: "policy-admin@test.com", password: "Admin@123" });
  adminToken = loginAdmin.body.accessToken || loginAdmin.body.token;

  const loginStaff = await request(app).post("/auth/login").send({ email: "policy-staff@test.com", password: "Staff@123" });
  staffToken = loginStaff.body.accessToken || loginStaff.body.token;

  const loginStudent = await request(app).post("/auth/login").send({ email: "policy-student@test.com", password: "Student@123" });
  studentToken = loginStudent.body.accessToken || loginStudent.body.token;
});

describe("autoBlockService - Default 09:00-16:00 window", () => {
  test("no rules -> fail-open inactive with no blocked packages", async () => {
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    expect(policy.status).toBe("inactive");
    expect(policy.source).toBe("default");
    expect(policy.scheduleStart).toBe("09:00");
    expect(policy.scheduleEnd).toBe("16:00");
    expect(policy.blockedPackages).toEqual([]);
    expect(policy.scheduleActive).toBe(false);
  });

  test("no rules + outside window -> inactive with no blocked packages", async () => {
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: outsideWindow() });
    expect(policy.status).toBe("inactive");
    expect(policy.blockedPackages).toEqual([]);
  });
});

describe("autoBlockService - Rule scheduling", () => {
  test("active rule inside its window -> active, source rule", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "10:00",
      scheduleEnd: "14:00",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      status: "active",
      policyVersion: 2,
    });
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    expect(policy.status).toBe("active");
    expect(policy.source).toBe("rule");
    expect(policy.scheduleStart).toBe("10:00");
    expect(policy.scheduleEnd).toBe("14:00");
    expect(policy.blockedPackages).toContain("com.instagram.android");
    expect(policy.policyVersion).toBe(2);
  });

  test("paused rule inside its window -> inactive (pause honored)", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "10:00",
      scheduleEnd: "14:00",
      activeDays: ["Mon"],
      status: "paused",
    });
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    expect(policy.status).toBe("inactive");
  });

  test("blockedApps token 'Games' maps to game packages", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["Games"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon"],
      status: "active",
    });
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    expect(policy.blockedPackages).toContain("com.dts.freefireth");
    expect(policy.blockedPackages).toContain("com.tencent.ig");
  });

  test("raw package name in blockedApps is blocked directly", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["com.anycustom.app"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon"],
      status: "active",
    });
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    expect(policy.blockedPackages).toContain("com.anycustom.app");
  });

  test("scanned social/games apps are auto-included during active window", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon"],
      status: "active",
    });
    const device = await Device.create({ userId: studentUser._id, status: "online" });
    await ScannedApp.create({
      studentId: studentUser._id,
      deviceId: device._id,
      packageName: "com.custom.tikapp",
      appName: "CustomTik",
      category: "social",
    });
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    expect(policy.blockedPackages).toContain("com.custom.tikapp");
  });
});

describe("autoBlockService - Overrides", () => {
  test("class emergency unblock overrides active rule", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon"],
      status: "active",
    });
    emergencyHelper.setClassEmergencyUnblock("C101", true);
    const policy = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    expect(policy.status).toBe("inactive");
    expect(policy.blockedPackages).toEqual([]);
    expect(policy.emergency).toBe("active");
  });

  test("class emergency is scoped - other class unaffected", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon"],
      status: "active",
    });
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C102",
      blockedApps: ["SocialMedia"],
      scheduleStart: "00:00",
      scheduleEnd: "23:59",
      activeDays: ["Mon"],
      status: "active",
    });
    emergencyHelper.setClassEmergencyUnblock("C101", true);
    const own = await autoBlockService.getStudentPolicy({ student: studentUser, now: insideWindow() });
    const other = await autoBlockService.getStudentPolicy({ student: studentOtherClass, now: insideWindow() });
    expect(own.emergency).toBe("active");
    expect(own.status).toBe("inactive");
    expect(other.emergency).toBe("inactive");
    expect(other.status).toBe("active");
  });
});

describe("API - /policy/latest", () => {
  test("returns policy envelope with default window fields", async () => {
    const device = await Device.create({
      userId: studentUser._id,
      fcmToken: "fcm-policy-test",
      status: "online",
    });
    const res = await request(app)
      .get(`/policy/latest?deviceId=${device._id}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.policyVersion).toBe("number");
    expect(Array.isArray(res.body.blockedPackages)).toBe(true);
    expect(res.body.scheduleStart).toBe("09:00");
    expect(res.body.scheduleEnd).toBe("16:00");
    expect(typeof res.body.scheduleActive).toBe("boolean");
    expect(["default", "rule"]).toContain(res.body.source);
  });

  test("missing deviceId returns 400", async () => {
    const res = await request(app)
      .get("/policy/latest")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(400);
  });
});

describe("API - Staff emergency unblock is class-scoped", () => {
  test("staff emergency-unblock-all scopes to assigned class C101", async () => {
    await Device.create({ userId: studentUser._id, status: "online" });
    await Device.create({ userId: studentOtherClass._id, status: "online" });

    const res = await request(app)
      .post("/staff/emergency-unblock-all")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.scope).toBe("assigned-classes");
    expect(res.body.classIds).toContain("C101");

    expect(emergencyHelper.getEmergencyUnblock("C101")).toBe(true);
    expect(emergencyHelper.getEmergencyUnblock("C102")).toBe(false);
  });

  test("admin emergency-unblock-all remains global", async () => {
    const res = await request(app)
      .post("/admin/emergency-unblock-all")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(emergencyHelper.getEmergencyUnblock("C101")).toBe(true);
    expect(emergencyHelper.getEmergencyUnblock("C102")).toBe(true);
  });
});

describe("API - Student apps reflects live schedule", () => {
  test("GET /student/apps returns apps with schedule envelope", async () => {
    const device = await Device.create({ userId: studentUser._id, status: "online" });
    await ScannedApp.create({
      studentId: studentUser._id,
      deviceId: device._id,
      packageName: "com.instagram.android",
      appName: "Instagram",
      category: "social",
    });

    const res = await request(app)
      .get("/student/apps")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.apps).toHaveLength(1);
    expect(typeof res.body.scheduleStart).toBe("string");
    expect(["default", "rule"]).toContain(res.body.source);
  });
});

describe("API - Admin override routes accept optional classId", () => {
  test("POST /admin/override/pause with classId only pauses that class", async () => {
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C101",
      blockedApps: ["SocialMedia"],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      institutionId: "INST001",
      status: "active",
    });
    await Rule.create({
      createdBy: adminUser._id,
      targetClassId: "C102",
      blockedApps: ["SocialMedia"],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      institutionId: "INST001",
      status: "active",
    });

    const res = await request(app)
      .post("/admin/override/pause")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ classId: "C101" });

    expect(res.status).toBe(200);
    expect(res.body.affectedRules).toBe(1);

    const c101 = await Rule.findOne({ targetClassId: "C101" });
    const c102 = await Rule.findOne({ targetClassId: "C102" });
    expect(c101.status).toBe("paused");
    expect(c102.status).toBe("active");
  });
});
