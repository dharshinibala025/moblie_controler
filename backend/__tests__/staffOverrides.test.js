process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Rule = require("../models/Rule");
const Device = require("../models/Device");

let app;
let staffUser;
let staffToken;
let studentUser;

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  staffUser = await User.create({
    name: "Staff Mentor",
    email: "staff-mentor@test.com",
    password: "Password@123",
    role: "staff",
    department: "CSE",
    classId: "CSE-3-A",
    institutionId: "INST001",
  });

  studentUser = await User.create({
    name: "Student One",
    email: "student-one@test.com",
    password: "Password@123",
    role: "student",
    department: "CSE",
    classId: "CSE-3-A",
    institutionId: "INST001",
  });

  await Device.create({
    userId: studentUser._id,
    status: "online",
    isBlocked: true,
  });

  const loginRes = await request(app)
    .post("/auth/login")
    .send({ email: "staff-mentor@test.com", password: "Password@123" });

  staffToken = loginRes.body.token || loginRes.body.accessToken;
});

describe("Staff Class Override Endpoints", () => {
  test("POST /staff/classes/:id/override/pause pauses active rule for assigned class", async () => {
    // Create active rule for CSE-3-A
    await Rule.create({
      targetClassId: "CSE-3-A",
      blockedApps: ["com.instagram.android", "SocialMedia"],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      status: "active",
      reason: "Class Hours",
      createdBy: staffUser._id,
      institutionId: "INST001",
    });

    const res = await request(app)
      .post("/staff/classes/CSE-3-A/override/pause")
      .set("Authorization", `Bearer ${staffToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.override).toBe("paused");
    expect(res.body.classId).toBe("CSE-3-A");

    const updatedRule = await Rule.findOne({ targetClassId: "CSE-3-A" });
    expect(updatedRule.status).toBe("paused");
  });

  test("POST /staff/classes/:id/override/resume resumes paused rule for assigned class", async () => {
    // Create paused rule for CSE-3-A
    await Rule.create({
      targetClassId: "CSE-3-A",
      blockedApps: ["com.instagram.android", "SocialMedia"],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      status: "paused",
      reason: "Class Hours",
      createdBy: staffUser._id,
      institutionId: "INST001",
    });

    const res = await request(app)
      .post("/staff/classes/CSE-3-A/override/resume")
      .set("Authorization", `Bearer ${staffToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.override).toBe("resumed");
    expect(res.body.classId).toBe("CSE-3-A");

    const updatedRule = await Rule.findOne({ targetClassId: "CSE-3-A" });
    expect(updatedRule.status).toBe("active");
  });

  test("Staff cannot pause/resume an unassigned class", async () => {
    const res = await request(app)
      .post("/staff/classes/ECE-1-B/override/pause")
      .set("Authorization", `Bearer ${staffToken}`)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Access denied/);
  });
});
