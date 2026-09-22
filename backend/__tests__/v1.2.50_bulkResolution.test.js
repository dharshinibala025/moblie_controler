process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const mongoose = require("mongoose");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Rule = require("../models/Rule");
const ClassRoom = require("../models/ClassRoom");

let app;
let adminToken;
let room;
let studentLegacy, studentCase, studentExact, studentOther;

const dummyId = () => new mongoose.Types.ObjectId();

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();
  await User.deleteMany({});
  await Device.deleteMany({});
  await Rule.deleteMany({});
  await ClassRoom.deleteMany({});

  const admin = await User.create({
    name: "Resolution Admin",
    email: "resolution-admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "INST001",
  });
  const login = await request(app)
    .post("/auth/login")
    .send({ email: "resolution-admin@test.com", password: "Admin@123" });
  adminToken = login.body.accessToken || login.body.token;

  // ClassRoom whose code is the admin-facing "CSE-2-A" format.
  room = await ClassRoom.create({
    name: "CSE Second Year - A",
    code: "CSE-2-A",
    departmentId: dummyId(),
    sectionId: dummyId(),
    academicYearId: dummyId(),
    institutionId: "INST001",
  });

  // A student whose stored classId is the LEGACY spaced spreadsheet format —
  // linked to the room only by classRoomId. This is the historical production
  // data-shape that used to make bulk apply resolve ZERO students.
  studentLegacy = await User.create({
    name: "Legacy Format",
    email: "legacy@test.com",
    password: "Student@123",
    role: "student",
    classId: "CSE 2nd Year - Section A",
    classRoomId: room._id,
    institutionId: "INST001",
  });

  // Case-drift student: stored in lowercase while the room code is uppercase.
  studentCase = await User.create({
    name: "Case Drift",
    email: "case@test.com",
    password: "Student@123",
    role: "student",
    classId: "cse-2-a",
    classRoomId: room._id,
    institutionId: "INST001",
  });

  // Exact match student with no classRoomId link (classId string only).
  studentExact = await User.create({
    name: "Exact",
    email: "exact@test.com",
    password: "Student@123",
    role: "student",
    classId: "CSE-2-A",
    classRoomId: null,
    institutionId: "INST001",
  });

  // A class that must NOT be touched by a CSE-2-A bulk apply.
  studentOther = await User.create({
    name: "Other",
    email: "other@test.com",
    password: "Student@123",
    role: "student",
    classId: "EEE-1-A",
    institutionId: "INST001",
  });

  for (const s of [studentLegacy, studentCase, studentExact, studentOther]) {
    await Device.create({ userId: s._id, status: "online" });
  }
});

const bulkApply = async (classIds) =>
  request(app)
    .post("/admin/rules/bulk")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      blockedApps: ["SocialMedia"],
      scheduleStart: "00:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      targetClassIds: classIds,
      status: "active",
      reason: "Resolution Fix Test",
    });

describe("Bulk apply resolves real delivery targets (v1.2.50)", () => {
  test("resolves legacy/case/exact students via ClassRoom + classId and reports counts", async () => {
    const res = await bulkApply(["CSE-2-A"]);
    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(1);
    expect(res.body.total).toBe(1);
    expect(res.body.resolved).toHaveLength(1);
    const info = res.body.resolved[0];
    expect(info.classId).toBe("CSE-2-A");
    expect(info.studentsMatched).toBe(3);
    expect(info.devicesMatched).toBe(3);
    expect(new Set(info.resolvedClassIds)).toEqual(
      new Set(["CSE 2nd Year - Section A", "cse-2-a", "CSE-2-A"])
    );

    const rule = await Rule.findOne({ targetClassId: "CSE-2-A" });
    expect(rule).not.toBeNull();
    expect(new Set(rule.resolvedClassIds)).toEqual(
      new Set(["CSE 2nd Year - Section A", "cse-2-a", "CSE-2-A"])
    );
    expect(rule.resolvedClassRoomIds.map(String)).toEqual([room._id.toString()]);

    expect(await Rule.countDocuments({ targetClassId: "EEE-1-A" })).toBe(0);
  });

  test("case-insensitive admin code still resolves via the ClassRoom", async () => {
    const res = await bulkApply(["cse-2-a"]);
    expect(res.status).toBe(200);
    expect(res.body.resolved[0].studentsMatched).toBe(3);
    expect(res.body.resolved[0].classroomId).toBe(room._id.toString());
  });

  test("/api/policy/latest returns an ACTIVE policy for a legacy student after bulk apply", async () => {
    const device = await Device.findOne({ userId: studentLegacy._id });

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "legacy@test.com", password: "Student@123" });
    const studentToken = login.body.accessToken || login.body.token;

    const before = await request(app)
      .get(`/api/policy/latest?deviceId=${device._id}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(before.status).toBe(200);
    expect(before.body.status).toBe("inactive");

    await bulkApply(["CSE-2-A"]);

    // Replay guard throttles the same deviceId within 2s unless realtime.
    await new Promise((resolve) => setTimeout(resolve, 2100));

    const after = await request(app)
      .get(`/api/policy/latest?deviceId=${device._id}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(after.status).toBe(200);
    expect(after.body.status).toBe("active");
    expect(after.body.source).toBe("rule");
    expect(after.body.blockedPackages.length).toBeGreaterThan(0);
    expect(after.body.scheduleEnd).toBe("16:00");
  });

  test("unknown class code resolves to zero matched students and reports it", async () => {
    const res = await bulkApply(["UNKNOWN-9-Z"]);
    expect(res.status).toBe(200);
    expect(res.body.applied).toBe(1);
    expect(res.body.resolved[0].studentsMatched).toBe(0);
    expect(res.body.resolved[0].devicesMatched).toBe(0);
    expect(res.body.resolved[0].classroomId).toBeNull();
  });
});