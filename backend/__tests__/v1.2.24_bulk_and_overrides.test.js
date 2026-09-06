process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const mongoose = require("mongoose");
const { connect, closeDatabase } = require("./setup");
const app = require("../app");
const User = require("../models/User");
const Rule = require("../models/Rule");
const Device = require("../models/Device");
const autoBlockService = require("../services/autoBlockService");

const ClassRoom = require("../models/ClassRoom");

let adminToken;
let staffToken;

beforeAll(async () => {
  await connect();
  // Clear collections for clean test execution
  await User.deleteMany({});
  await Rule.deleteMany({});
  await Device.deleteMany({});
  await ClassRoom.deleteMany({});

  // Seed ClassRooms
  const dummyId = new mongoose.Types.ObjectId();
  const targetClassIds = ["CSE-1-A", "CSE-1-B", "CSE-2-A", "CSE-3-A"];
  for (const cid of targetClassIds) {
    await ClassRoom.create({
      name: cid,
      code: cid,
      departmentId: dummyId,
      sectionId: dummyId,
      academicYearId: dummyId,
      institutionId: "KSRCE",
    });
  }

  // Seed test Admin user
  const adminUser = await User.create({
    name: "System Admin",
    email: "admin_test@ksrce.ac.in",
    password: "Password123!",
    role: "admin",
    status: "active",
  });

  // Seed test Staff user
  const staffUser = await User.create({
    name: "Staff Member",
    email: "staff_test@ksrce.ac.in",
    password: "Password123!",
    role: "staff",
    status: "active",
    classId: "CSE-3-A",
  });

  // Log in to obtain JWT tokens
  const adminLogin = await request(app)
    .post("/auth/login")
    .send({ email: "admin_test@ksrce.ac.in", password: "Password123!" });
  adminToken = adminLogin.body.accessToken;

  const staffLogin = await request(app)
    .post("/auth/login")
    .send({ email: "staff_test@ksrce.ac.in", password: "Password123!" });
  staffToken = staffLogin.body.accessToken;
});

afterAll(async () => {
  await closeDatabase();
});

describe("FocusSync v1.2.24 — Bulk Rules & Override Endpoints Test Suite", () => {
  test("1. POST /admin/rules/bulk applies restrictions to string class IDs without 0/16 failure", async () => {
    const targetClassIds = ["CSE-1-A", "CSE-1-B", "CSE-2-A", "CSE-3-A"];
    const res = await request(app)
      .post("/admin/rules/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        targetClassIds,
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        status: "active",
        reason: "Classroom Policy Restriction",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.applied).toBe(4);
    expect(res.body.total).toBe(4);

    // Verify rules created in MongoDB
    const rulesInDb = await Rule.find({ targetClassId: { $in: targetClassIds } });
    expect(rulesInDb.length).toBe(4);
  });

  test("2. POST /admin/override/pause handles string class IDs without CastError (Invalid resource ID)", async () => {
    const res = await request(app)
      .post("/admin/override/pause")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        targetClassIds: ["CSE-1-A", "CSE-1-B"],
        reason: "Admin paused restriction",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.override).toBe("paused");
    expect(res.body.error).toBeUndefined();
  });

  test("3. POST /admin/override/resume handles string class IDs without CastError (Invalid resource ID)", async () => {
    const res = await request(app)
      .post("/admin/override/resume")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        targetClassIds: ["CSE-1-A", "CSE-1-B"],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.override).toBe("resumed");
    expect(res.body.error).toBeUndefined();
  });

  test("4. autoBlockService defaults to fail-open (scheduleActive = false) when no active rule exists", async () => {
    // Clear rules
    await Rule.deleteMany({});

    const student = await User.create({
      name: "Student Test",
      email: `student_${Date.now()}@ksrce.ac.in`,
      password: "Password123!",
      role: "student",
      classId: "CSE-3-A",
      status: "active",
    });

    const now = new Date("2026-08-26T10:30:00Z"); // 10:30 AM
    const policy = await autoBlockService.getStudentPolicy({ student, now });

    expect(policy.scheduleActive).toBe(false);
    expect(policy.status).toBe("inactive");
    expect(policy.blockedPackages.length).toBe(0);
  });

  test("5. autoBlockService auto-unblocks at 04:00 PM (16:00) even if active rule exists", async () => {
    const student = await User.findOne({ role: "student" });

    // Create an active rule with scheduleEnd "16:00"
    await Rule.create({
      targetClassId: "CSE-3-A",
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      status: "active",
      reason: "Class Policy",
      createdBy: new mongoose.Types.ObjectId(),
    });

    // Test time at 04:30 PM (16:30) — after 4 PM
    const afterFourPm = new Date("2026-08-26T16:30:00+05:30");
    const policy = await autoBlockService.getStudentPolicy({ student, now: afterFourPm });

    expect(policy.scheduleActive).toBe(false);
    expect(policy.status).toBe("inactive");
    expect(policy.blockedPackages.length).toBe(0);
  });
});
