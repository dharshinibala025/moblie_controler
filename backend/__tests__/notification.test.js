process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Notification = require("../models/Notification");

let app;
let studentUser;
let staffToken, studentToken;

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  await User.create({
    name: "Notification Staff",
    email: "notif-staff@test.com",
    password: "Staff@123",
    role: "staff",
    classId: "C101",
    institutionId: "INST001",
  });

  studentUser = await User.create({
    name: "Notification Student",
    email: "notif-student@test.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  });

  await Device.create({ userId: studentUser._id, status: "online" });

  const loginStaff = await request(app).post("/auth/login").send({ email: "notif-staff@test.com", password: "Staff@123" });
  staffToken = loginStaff.body.accessToken || loginStaff.body.token;

  const loginStudent = await request(app).post("/auth/login").send({ email: "notif-student@test.com", password: "Student@123" });
  studentToken = loginStudent.body.accessToken || loginStudent.body.token;
});

const createActiveRule = async (scheduleEnd = "16:00") => {
  const res = await request(app)
    .post("/staff/classes/C101/rules")
    .set("Authorization", `Bearer ${staffToken}`)
    .send({
      blockedApps: ["SocialMedia"],
      scheduleStart: "09:00",
      scheduleEnd,
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      reason: "Study Hours Policy restriction",
      status: "active",
    });
  return res.body;
};

describe("Rule dispatch notifications - dedupe", () => {
  test("staff creating an active rule creates exactly one notification per student", async () => {
    const rule = await createActiveRule();
    expect(rule._id).toBeDefined();

    const notifications = await Notification.find({ studentId: studentUser._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain("activated class restrictions");
  });

  test("re-dispatching an already-active rule (repeat Set Restriction click) does not stack duplicate notifications", async () => {
    const rule = await createActiveRule();
    expect((await Notification.find({ studentId: studentUser._id }))).toHaveLength(1);

    // Updating an already-active rule dispatches 'start' again (ruleService else-branch).
    const updateRes = await request(app)
      .patch(`/staff/classes/C101/rules/${rule._id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        scheduleEnd: "17:00",
        reason: "Study Hours Policy restriction",
        status: "active",
      });
    expect(updateRes.status).toBe(200);

    const notifications = await Notification.find({ studentId: studentUser._id });
    expect(notifications).toHaveLength(1);
  });
});

describe("Student notification auto-clear on read", () => {
  test("marking a notification read deletes it from the student list", async () => {
    const notif = await Notification.create({
      studentId: studentUser._id,
      title: "Policy Restriction Paused",
      message: "Admin Instruction: Study Hours Policy restriction",
      type: "restriction",
      read: false,
    });

    const res = await request(app)
      .post(`/student/notifications/${notif._id}/read`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);

    const after = await Notification.findById(notif._id);
    expect(after).toBeNull();
  });

  test("a student cannot clear another student's notification", async () => {
    const otherStudent = await User.create({
      name: "Other Student",
      email: "notif-other@test.com",
      password: "Student@123",
      role: "student",
      classId: "C102",
      institutionId: "INST001",
    });

    const notif = await Notification.create({
      studentId: otherStudent._id,
      title: "Classroom Restriction Activated",
      message: "Admin Instruction: Study Hours Policy restriction",
      type: "restriction",
      read: false,
    });

    const res = await request(app)
      .post(`/student/notifications/${notif._id}/read`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);

    // Notification still exists because it belongs to a different student.
    expect(await Notification.findById(notif._id)).not.toBeNull();
  });
});

describe("Role-aware restriction notifications (Admin/Staff/System)", () => {
  const createActiveRule = async () => {
    const res = await request(app)
      .post("/staff/classes/C101/rules")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        blockedApps: ["SocialMedia"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        reason: "Study Hours Policy restriction",
        status: "active",
      });
    return res.body;
  };

  test("staff pause -> 'Restriction Paused' notification", async () => {
    const rule = await createActiveRule();

    await request(app)
      .patch(`/staff/classes/C101/rules/${rule._id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "paused", reason: "Study Hours Policy restriction" });

    const notifs = await Notification.find({ studentId: studentUser._id });
    expect(notifs).toHaveLength(1);
    expect(notifs[0].title).toContain("Restriction Paused");
    expect(notifs[0].message).toContain("paused class restrictions");
  });

  test("staff resume -> 'Restriction Resumed' notification", async () => {
    const rule = await createActiveRule();
    await request(app)
      .patch(`/staff/classes/C101/rules/${rule._id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "paused" });

    await request(app)
      .patch(`/staff/classes/C101/rules/${rule._id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "active", reason: "Study Hours Policy restriction" });

    const notifs = await Notification.find({ studentId: studentUser._id });
    expect(notifs).toHaveLength(1);
    expect(notifs[0].title).toContain("Restriction Resumed");
    expect(notifs[0].message).toContain("activated class restrictions");
  });

  test("new restriction notification replaces a prior unread one even when reason changes", async () => {
    const rule = await createActiveRule();
    expect(await Notification.countDocuments({ studentId: studentUser._id })).toBe(1);

    await request(app)
      .patch(`/staff/classes/C101/rules/${rule._id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "active", reason: "Updated reason text" });

    const notifs = await Notification.find({ studentId: studentUser._id });
    expect(notifs).toHaveLength(1);
    expect(notifs[0].message).toContain("activated class restrictions");
  });

  test("sendCommand with notify:false creates no student notification (silent auto-stop)", async () => {
    const rule = await createActiveRule();
    const ruleService = require("../services/ruleService");

    await ruleService.sendCommand(rule._id, "pause", "Schedule window closed - auto-pause", null, { notify: false });

    const notifs = await Notification.find({ studentId: studentUser._id });
    expect(notifs).toHaveLength(1);
    expect(notifs[0].title).toContain("Restriction Started");
  });
});

describe("Student notification pruning - one restriction card max", () => {
  test("GET /student/notifications prunes duplicate unread restriction cards, keeping the newest", async () => {
    await Notification.insertMany([
      { studentId: studentUser._id, title: "Classroom Restriction Activated", message: "Admin Instruction: a", type: "restriction", read: false, createdAt: new Date(Date.now() - 60000) },
      { studentId: studentUser._id, title: "Classroom Restriction Activated", message: "Admin Instruction: b", type: "restriction", read: false, createdAt: new Date(Date.now() - 40000) },
      { studentId: studentUser._id, title: "Policy Restriction Paused", message: "Admin Instruction: c", type: "restriction", read: false, createdAt: new Date(Date.now() - 20000) },
    ]);

    const res = await request(app)
      .get("/student/notifications")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].message).toBe("Admin Instruction: c");

    expect(await Notification.countDocuments({ studentId: studentUser._id })).toBe(1);
  });

  test("unread-count drops after pruning duplicates", async () => {
    await Notification.insertMany([
      { studentId: studentUser._id, title: "Classroom Restriction Activated", message: "Admin Instruction: a", type: "restriction", read: false },
      { studentId: studentUser._id, title: "Classroom Restriction Activated", message: "Admin Instruction: b", type: "restriction", read: false },
    ]);

    const res = await request(app)
      .get("/student/notifications/unread-count")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(1);
  });
});
