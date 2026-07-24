process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Rule = require("../models/Rule");
const AppsCatalog = require("../models/AppsCatalog");

let app;
let adminToken, staffToken, studentToken;
let adminUser, staffUser, studentUser, student2User;

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
    name: "Test Admin",
    email: "admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "INST001",
  });

  staffUser = await User.create({
    name: "Test Staff",
    email: "staff@test.com",
    password: "Staff@123",
    role: "staff",
    classId: "C101",
    institutionId: "INST001",
  });

  studentUser = await User.create({
    name: "Test Student",
    email: "student@test.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  });

  student2User = await User.create({
    name: "Student Other Class",
    email: "student2@test.com",
    password: "Student@123",
    role: "student",
    classId: "C102",
    institutionId: "INST001",
  });

  await Device.create({
    userId: studentUser._id,
    fcmToken: "test-fcm-token-1",
    status: "online",
    lastSyncAt: new Date(),
  });

  await AppsCatalog.create({
    packageName: "com.instagram.android",
    appName: "Instagram",
    category: "social",
  });
  await AppsCatalog.create({
    packageName: "com.google.android.youtube",
    appName: "YouTube",
    category: "entertainment",
  });
  await AppsCatalog.create({
    packageName: "com.whatsapp",
    appName: "WhatsApp",
    category: "social",
  });

  const loginAdmin = await request(app).post("/auth/login").send({ email: "admin@test.com", password: "Admin@123" });
  adminToken = loginAdmin.body.token;

  const loginStaff = await request(app).post("/auth/login").send({ email: "staff@test.com", password: "Staff@123" });
  staffToken = loginStaff.body.token;

  const loginStudent = await request(app).post("/auth/login").send({ email: "student@test.com", password: "Student@123" });
  studentToken = loginStudent.body.token;
});

describe("AUTH - Login", () => {
  test("POST /auth/login with correct credentials returns 200 + token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".")).toHaveLength(3);
  });

  test("POST /auth/login with wrong password returns 401 (no field leak)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("POST /auth/login with non-existent email returns 401 (same message)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@test.com", password: "whatever" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("POST /auth/login with missing fields returns 400", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).toBe(400);
  });

  test("POST /auth/login with invalid email format returns 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "notanemail", password: "123456" });
    expect(res.status).toBe(400);
  });
});

describe("AUTH - Protected Routes", () => {
  test("Any protected route with no token returns 401", async () => {
    const res = await request(app).get("/admin/rules");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  test("Any protected route with invalid token returns 401", async () => {
    const res = await request(app)
      .get("/admin/rules")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });

  test("Any protected route with wrong role returns 403", async () => {
    const res = await request(app)
      .get("/admin/rules")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  test("Staff token accessing admin route returns 403", async () => {
    const res = await request(app)
      .get("/admin/rules")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });

  test("Student token accessing admin route returns 403", async () => {
    const res = await request(app)
      .get("/admin/devices")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});

describe("AUTH - Staff Scope Check", () => {
  test("Staff accessing own class data returns 200", async () => {
    const res = await request(app)
      .get("/staff/classes/C101/live")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
  });

  test("Staff accessing another class returns 403 (scope check)", async () => {
    const res = await request(app)
      .get("/staff/classes/C102/live")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain("scope");
  });
});

describe("ADMIN - Rules", () => {
  test("POST /admin/rules creates a rule (201)", async () => {
    const res = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon", "Tue"],
        targetClassId: "C101",
      });

    expect(res.status).toBe(201);
    expect(res.body.blockedApps).toContain("com.instagram.android");
    expect(res.body.targetClassId).toBe("C101");
    expect(res.body.status).toBe("draft");
  });

  test("POST /admin/rules with missing required fields returns 400", async () => {
    const res = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ blockedApps: ["com.instagram.android"] });

    expect(res.status).toBe(400);
  });

  test("GET /admin/rules returns list of rules", async () => {
    await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    const res = await request(app)
      .get("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("PATCH /admin/rules/:id updates a rule", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .patch(`/admin/rules/${ruleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "active" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("active");
  });

  test("POST /admin/rules/:id/command with valid transitions updates status", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "active",
      });

    const ruleId = createRes.body._id;

    const pauseRes = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "pause" });

    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.status).toBe("paused");
  });

  test("POST /admin/rules/:id/command with invalid transition returns 400", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "draft",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "pause" });

    expect(res.status).toBe(400);
  });
});

describe("ADMIN - Devices", () => {
  test("GET /admin/devices returns registered devices", async () => {
    const res = await request(app)
      .get("/admin/devices")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("ADMIN - Catalog", () => {
  test("GET /admin/catalog returns app catalog", async () => {
    const res = await request(app)
      .get("/admin/catalog")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("PATCH /admin/catalog/:packageName updates catalog entry", async () => {
    const res = await request(app)
      .patch("/admin/catalog/com.instagram.android")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ category: "social", isDangerous: true });

    expect(res.status).toBe(200);
    expect(res.body.isDangerous).toBe(true);
  });
});

describe("ADMIN - Reports", () => {
  test("GET /admin/reports/daily without classId returns 400", async () => {
    const res = await request(app)
      .get("/admin/reports/daily")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  test("GET /admin/reports/daily with classId returns report", async () => {
    const res = await request(app)
      .get("/admin/reports/daily?classId=C101")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.classId).toBe("C101");
    expect(typeof res.body.totalStudents).toBe("number");
  });

  test("GET /admin/reports/student/:id returns report", async () => {
    const res = await request(app)
      .get(`/admin/reports/student/${studentUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("ADMIN - Audit Log", () => {
  test("GET /admin/audit-log returns audit entries", async () => {
    const res = await request(app)
      .get("/admin/audit-log")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs).toBeDefined();
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });
});

describe("ADMIN - Staff Management", () => {
  test("POST /admin/staff creates a staff account", async () => {
    const res = await request(app)
      .post("/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Staff",
        email: "newstaff@test.com",
        password: "Staff@123",
        classId: "C101",
      });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("staff");
    expect(res.body.name).toBe("New Staff");
    expect(res.body.password).toBeUndefined();
  });

  test("POST /admin/staff with duplicate email returns 409", async () => {
    const res = await request(app)
      .post("/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Dup Staff",
        email: "staff@test.com",
        password: "Staff@123",
        classId: "C101",
      });

    expect(res.status).toBe(409);
  });
});

describe("STUDENT - Device Registration", () => {
  test("POST /student/device/register creates/updates device", async () => {
    const res = await request(app)
      .post("/student/device/register")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ fcmToken: "new-fcm-token-123" });

    expect(res.status).toBe(201);
    expect(res.body.deviceId).toBeDefined();
    expect(res.body.status).toBe("online");
  });
});

describe("STUDENT - App Scan", () => {
  test("POST /student/scan processes scan and returns flagged apps", async () => {
    const createRule = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android", "com.google.android.youtube"],
        scheduleStart: "00:00",
        scheduleEnd: "23:59",
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        targetClassId: "C101",
        status: "active",
      });

    const res = await request(app)
      .post("/student/scan")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        apps: [
          { packageName: "com.instagram.android", appName: "Instagram" },
          { packageName: "com.whatsapp", appName: "WhatsApp" },
          { packageName: "com.google.android.youtube", appName: "YouTube" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.scannedCount).toBe(3);
    expect(res.body.flaggedApps).toContain("com.instagram.android");
    expect(res.body.flaggedApps).toContain("com.google.android.youtube");
    expect(res.body.flaggedApps).not.toContain("com.whatsapp");
  });
});

describe("STUDENT - Usage Logs", () => {
  test("POST /student/usage records usage from registered device", async () => {
    const res = await request(app)
      .post("/student/usage")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        logs: [
          {
            packageName: "com.instagram.android",
            durationMs: 120000,
            wasBlockedAttempt: true,
            timestamp: new Date().toISOString(),
          },
          {
            packageName: "com.whatsapp",
            durationMs: 300000,
            wasBlockedAttempt: false,
            timestamp: new Date().toISOString(),
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.recordedCount).toBe(2);
  });

  test("POST /student/usage from unregistered device returns 403", async () => {
    const unregisteredStudent = await User.create({
      name: "No Device",
      email: "nodevice@test.com",
      password: "Test@123",
      role: "student",
      classId: "C101",
    });

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "nodevice@test.com", password: "Test@123" });
    const noDeviceToken = loginRes.body.token;

    const res = await request(app)
      .post("/student/usage")
      .set("Authorization", `Bearer ${noDeviceToken}`)
      .send({
        logs: [
          {
            packageName: "com.whatsapp",
            durationMs: 60000,
            wasBlockedAttempt: false,
          },
        ],
      });

    expect(res.status).toBe(403);
  });
});

describe("STUDENT - Command Acknowledgment", () => {
  test("POST /student/command/ack acknowledges a command", async () => {
    const rule = await Rule.create({
      createdBy: adminUser._id,
      blockedApps: ["com.instagram.android"],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon"],
      targetClassId: "C101",
      status: "active",
    });

    const res = await request(app)
      .post("/student/command/ack")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        ruleId: rule._id.toString(),
        receivedAt: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.acknowledged).toBe(true);
  });

  test("POST /student/command/ack with tamper detected logs audit entry", async () => {
    const rule = await Rule.create({
      createdBy: adminUser._id,
      blockedApps: ["com.instagram.android"],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon"],
      targetClassId: "C101",
      status: "active",
    });

    const res = await request(app)
      .post("/student/command/ack")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        ruleId: rule._id.toString(),
        receivedAt: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
        tamperDetected: true,
        tamperDetails: { reason: "accessibility_service_disabled" },
      });

    expect(res.status).toBe(200);
    expect(res.body.acknowledged).toBe(true);

    const device = await Device.findOne({ userId: studentUser._id });
    expect(device.isCompliant).toBe(false);
  });
});

describe("STAFF - Read-Only Routes", () => {
  test("GET /staff/classes/:id/live returns live student data", async () => {
    const res = await request(app)
      .get("/staff/classes/C101/live")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.classId).toBe("C101");
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(typeof res.body.totalStudents).toBe("number");
  });

  test("GET /staff/classes/:id/activity returns activity data", async () => {
    const res = await request(app)
      .get("/staff/classes/C101/activity")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.classId).toBe("C101");
  });

  test("Staff accessing another class returns 403", async () => {
    const res = await request(app)
      .get("/staff/classes/C102/live")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });
});

describe("MISC - Health Check", () => {
  test("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("MISC - 404 Handler", () => {
  test("GET /nonexistent returns 404", async () => {
    const res = await request(app).get("/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("MISC - Malformed Bodies", () => {
  test("POST /auth/login with malformed JSON returns 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{ invalid json }");

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("ADMIN - Reports (Extended)", () => {
  test("GET /admin/reports/weekly without classId returns 400", async () => {
    const res = await request(app)
      .get("/admin/reports/weekly")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("classId is required");
  });

  test("GET /admin/reports/weekly with classId returns report", async () => {
    const res = await request(app)
      .get("/admin/reports/weekly?classId=C101")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.classId).toBe("C101");
    expect(typeof res.body.totalStudents).toBe("number");
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(Array.isArray(res.body.topApps)).toBe(true);
  });

  test("GET /admin/reports/overview returns institution overview", async () => {
    const res = await request(app)
      .get("/admin/reports/overview")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].classId).toBeDefined();
  });

  test("GET /admin/reports/export without classId returns 400", async () => {
    const res = await request(app)
      .get("/admin/reports/export")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("classId is required");
  });

  test("GET /admin/reports/export with format=json returns report", async () => {
    const res = await request(app)
      .get("/admin/reports/export?classId=C101&format=json")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.classId).toBe("C101");
  });

  test("GET /admin/reports/export with format=pdf returns PDF buffer", async () => {
    const res = await request(app)
      .get("/admin/reports/export?classId=C101&format=pdf")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.body).toBeDefined();
  });
});

describe("ADMIN - Rule Filtering", () => {
  beforeEach(async () => {
    await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.whatsapp"],
        scheduleStart: "08:00",
        scheduleEnd: "17:00",
        activeDays: ["Tue"],
        targetClassId: "C102",
      });
  });

  test("GET /admin/rules with targetClassId filter returns only matching rules", async () => {
    const res = await request(app)
      .get("/admin/rules?targetClassId=C101")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((rule) => {
      expect(rule.targetClassId).toBe("C101");
    });
  });

  test("GET /admin/rules with status filter returns only matching rules", async () => {
    await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.tiktok"],
        scheduleStart: "10:00",
        scheduleEnd: "14:00",
        activeDays: ["Wed"],
        targetClassId: "C101",
        status: "active",
      });

    const res = await request(app)
      .get("/admin/rules?status=active")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((rule) => {
      expect(rule.status).toBe("active");
    });
  });
});

describe("ADMIN - Device Filtering", () => {
  test("GET /admin/devices with classId filter returns only matching devices", async () => {
    await Device.create({
      userId: student2User._id,
      fcmToken: "test-fcm-token-2",
      status: "online",
      lastSyncAt: new Date(),
    });

    const res = await request(app)
      .get("/admin/devices?classId=C101")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});

describe("ADMIN - Rule State Machine", () => {
  test("draft -> active via command/start", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "draft",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "start" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("active");
  });

  test("active -> paused via command/pause", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "active",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "pause" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("paused");
  });

  test("active -> stopped via command/stop", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "active",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "stop" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("stopped");
  });

  test("paused -> active via command/start", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "active",
      });

    const ruleId = createRes.body._id;

    await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "pause" });

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "start" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("active");
  });

  test("paused -> stopped via command/stop", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "active",
      });

    const ruleId = createRes.body._id;

    await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "pause" });

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "stop" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("stopped");
  });

  test("draft -> pause is invalid (400)", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "draft",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "pause" });

    expect(res.status).toBe(400);
  });

  test("draft -> stop is invalid (400)", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "draft",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "stop" });

    expect(res.status).toBe(400);
  });

  test("stopped -> start is invalid (400)", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "active",
      });

    const ruleId = createRes.body._id;

    await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "stop" });

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "start" });

    expect(res.status).toBe(400);
  });
});

describe("VALIDATION - Edge Cases", () => {
  test("POST /auth/login with short password returns 400", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });

  test("POST /admin/rules with invalid scheduleStart format returns 400", async () => {
    const res = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "25:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    expect(res.status).toBe(400);
  });

  test("POST /admin/rules with invalid activeDays enum returns 400", async () => {
    const res = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Funday"],
        targetClassId: "C101",
      });

    expect(res.status).toBe(400);
  });

  test("POST /admin/rules with empty blockedApps returns 400", async () => {
    const res = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: [],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    expect(res.status).toBe(400);
  });

  test("POST /admin/rules with invalid status enum returns 400", async () => {
    const res = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "invalid_status",
      });

    expect(res.status).toBe(400);
  });

  test("POST /admin/rules/:id/command with invalid action returns 400", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    const ruleId = createRes.body._id;

    const res = await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "invalid_action" });

    expect(res.status).toBe(400);
  });

  test("POST /admin/catalog with invalid category enum returns 400", async () => {
    const res = await request(app)
      .patch("/admin/catalog/com.instagram.android")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ category: "invalid_category" });

    expect(res.status).toBe(400);
  });

  test("POST /admin/staff with invalid email returns 400", async () => {
    const res = await request(app)
      .post("/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Bad Email Staff",
        email: "not-an-email",
        password: "Staff@123",
        classId: "C101",
      });

    expect(res.status).toBe(400);
  });

  test("POST /admin/staff with short password returns 400", async () => {
    const res = await request(app)
      .post("/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Short Pass Staff",
        email: "shortpass@test.com",
        password: "123",
        classId: "C101",
      });

    expect(res.status).toBe(400);
  });

  test("POST /admin/staff with missing classId returns 400", async () => {
    const res = await request(app)
      .post("/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "No Class Staff",
        email: "noclass@test.com",
        password: "Staff@123",
      });

    expect(res.status).toBe(400);
  });

  test("POST /admin/rules with unknown fields is stripped (stripUnknown)", async () => {
    const res = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        injectedField: "should be stripped",
      });

    expect(res.status).toBe(201);
    expect(res.body.injectedField).toBeUndefined();
  });
});

describe("AUDIT TRAIL - End-to-End", () => {
  test("Creating a rule writes an audit entry", async () => {
    await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    const res = await request(app)
      .get("/admin/audit-log?action=rule.create")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
    expect(res.body.logs[0].action).toBe("rule.create");
  });

  test("Updating a rule writes an audit entry", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
      });

    const ruleId = createRes.body._id;

    await request(app)
      .patch(`/admin/rules/${ruleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ blockedApps: ["com.whatsapp"] });

    const res = await request(app)
      .get("/admin/audit-log?action=rule.update")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
    expect(res.body.logs[0].action).toBe("rule.update");
  });

  test("Sending a command writes an audit entry", async () => {
    const createRes = await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C101",
        status: "active",
      });

    const ruleId = createRes.body._id;

    await request(app)
      .post(`/admin/rules/${ruleId}/command`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "pause" });

    const res = await request(app)
      .get("/admin/audit-log?action=rule.command")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
    expect(res.body.logs[0].action).toBe("rule.command");
  });

  test("Creating staff writes an audit entry", async () => {
    await request(app)
      .post("/admin/staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Audit Staff",
        email: "auditstaff@test.com",
        password: "Staff@123",
        classId: "C101",
      });

    const res = await request(app)
      .get("/admin/audit-log?action=staff.create")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
    expect(res.body.logs[0].action).toBe("staff.create");
  });

  test("Audit log pagination works with page and limit", async () => {
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/admin/rules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          blockedApps: ["com.instagram.android"],
          scheduleStart: "09:00",
          scheduleEnd: "16:00",
          activeDays: ["Mon"],
          targetClassId: "C101",
        });
    }

    const res = await request(app)
      .get("/admin/audit-log?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
  });
});

describe("INSTITUTION SCOPING - Isolation", () => {
  let inst2AdminToken;

  beforeEach(async () => {
    const inst2Admin = await User.create({
      name: "Inst2 Admin",
      email: "admin2@test.com",
      password: "Admin@123",
      role: "admin",
      institutionId: "INST002",
    });

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "admin2@test.com", password: "Admin@123" });
    inst2AdminToken = loginRes.body.token;
  });

  test("Admin from INST001 cannot see rules from INST002", async () => {
    await request(app)
      .post("/admin/rules")
      .set("Authorization", `Bearer ${inst2AdminToken}`)
      .send({
        blockedApps: ["com.instagram.android"],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon"],
        targetClassId: "C201",
      });

    const res = await request(app)
      .get("/admin/rules")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const inst2Rules = res.body.filter((r) => r.targetClassId === "C201");
    expect(inst2Rules.length).toBe(0);
  });

  test("Admin from INST001 cannot see devices from INST002", async () => {
    const inst2Student = await User.create({
      name: "Inst2 Student",
      email: "inst2student@test.com",
      password: "Student@123",
      role: "student",
      classId: "C201",
      institutionId: "INST002",
    });

    await Device.create({
      userId: inst2Student._id,
      fcmToken: "inst2-fcm-token",
      status: "online",
      lastSyncAt: new Date(),
    });

    const res = await request(app)
      .get("/admin/devices")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const inst2Devices = res.body.filter((d) => {
      return d.userId && d.userId.classId === "C201";
    });
    expect(inst2Devices.length).toBe(0);
  });

  test("Admin from INST001 cannot see audit logs from INST002", async () => {
    const inst2Staff = await User.create({
      name: "Inst2 Staff",
      email: "inst2staff@test.com",
      password: "Staff@123",
      role: "staff",
      classId: "C201",
      institutionId: "INST002",
    });

    await request(app)
      .post("/admin/staff")
      .set("Authorization", `Bearer ${inst2AdminToken}`)
      .send({
        name: "Another Inst2 Staff",
        email: "inst2staff2@test.com",
        password: "Staff@123",
        classId: "C201",
      });

    const res = await request(app)
      .get("/admin/audit-log")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const inst2Logs = res.body.logs.filter((log) => {
      return log.target && log.target.id && log.details && log.details.targetClassId === "C201";
    });
    expect(inst2Logs.length).toBe(0);
  });
});

describe("APPERROR - Unit Tests", () => {
  const {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
  } = require("../utils/AppError");

  test("AppError sets statusCode, code, and isOperational", () => {
    const err = new AppError("Custom error", 418, "TEAPOT");
    expect(err.message).toBe("Custom error");
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe("TEAPOT");
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  test("NotFoundError defaults to 404", () => {
    const err = new NotFoundError("User");
    expect(err.message).toBe("User not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  test("NotFoundError with no argument uses default resource name", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Resource not found");
  });

  test("ValidationError sets details array", () => {
    const details = ["field is required", "invalid format"];
    const err = new ValidationError("Bad input", details);
    expect(err.message).toBe("Bad input");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual(details);
  });

  test("UnauthorizedError defaults to 401", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  test("ForbiddenError defaults to 403", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Access denied");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  test("ConflictError defaults to 409", () => {
    const err = new ConflictError();
    expect(err.message).toBe("Resource already exists");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  test("All error classes extend AppError", () => {
    expect(new NotFoundError() instanceof AppError).toBe(true);
    expect(new ValidationError() instanceof AppError).toBe(true);
    expect(new UnauthorizedError() instanceof AppError).toBe(true);
    expect(new ForbiddenError() instanceof AppError).toBe(true);
    expect(new ConflictError() instanceof AppError).toBe(true);
  });
});

describe("ERROR MIDDLEWARE - Edge Cases", () => {
  test("Expired JWT returns 401 with 'Token expired'", async () => {
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { userId: adminUser._id, role: "admin", institutionId: "INST001" },
      process.env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const res = await request(app)
      .get("/admin/rules")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token expired");
  });

  test("Malformed Authorization header returns 401", async () => {
    const res = await request(app)
      .get("/admin/rules")
      .set("Authorization", "NotBearer sometoken");

    expect(res.status).toBe(401);
  });

  test("GET /admin/reports/student/:invalidId returns 400 (CastError)", async () => {
    const res = await request(app)
      .get("/admin/reports/student/invalid-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid resource ID");
  });

  test("PATCH /admin/rules/:invalidId returns 400 (CastError)", async () => {
    const res = await request(app)
      .patch("/admin/rules/invalid-id")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "active" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid resource ID");
  });
});
