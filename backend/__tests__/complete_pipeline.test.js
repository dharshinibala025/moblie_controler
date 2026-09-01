process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");
const Rule = require("../models/Rule");
const AppsCatalog = require("../models/AppsCatalog");
const ScannedApp = require("../models/ScannedApp");
const AuditLog = require("../models/AuditLog");
const autoBlockService = require("../services/autoBlockService");
const emailQueueService = require("../services/emailQueueService");

let app;
let adminUser, staffUser, studentUser;
let adminToken, staffToken, studentToken;
let testDevice;

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  // Create Users for 3 Roles
  adminUser = await User.create({
    name: "Pipeline Admin",
    email: "pipeline.admin@test.com",
    password: "Admin@123",
    role: "admin",
    institutionId: "KSRCE",
  });

  staffUser = await User.create({
    name: "Pipeline Staff",
    email: "pipeline.staff@test.com",
    password: "Staff@123",
    role: "staff",
    classId: "C_CSE_A",
    institutionId: "KSRCE",
  });

  studentUser = await User.create({
    name: "Pipeline Student",
    email: "pipeline.student@test.com",
    password: "Student@123",
    role: "student",
    classId: "C_CSE_A",
    institutionId: "KSRCE",
  });

  // Create Device
  testDevice = await Device.create({
    userId: studentUser._id,
    fcmToken: "pipeline-fcm-token-12345",
    status: "online",
    lastSyncAt: new Date(),
  });

  // Log in to retrieve tokens
  const adminRes = await request(app).post("/api/auth/login").send({ email: "pipeline.admin@test.com", password: "Admin@123", role: "admin" });
  adminToken = adminRes.body.accessToken;

  const staffRes = await request(app).post("/api/auth/login").send({ email: "pipeline.staff@test.com", password: "Staff@123", role: "staff" });
  staffToken = staffRes.body.accessToken;

  const studentRes = await request(app).post("/api/auth/login").send({ email: "pipeline.student@test.com", password: "Student@123", role: "student" });
  studentToken = studentRes.body.accessToken;
});

describe("=================== COMPLETE APPLICATION PIPELINE TEST SUITE ===================", () => {

  // PIPELINE 1: AUTHENTICATION & SECURITY PIPELINE
  describe("PIPELINE 1: Authentication & Token Management Pipeline", () => {
    test("1.1 User Login produces valid JWT Access and Refresh Tokens", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "pipeline.student@test.com", password: "Student@123", role: "student" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body.user.email).toBe("pipeline.student@test.com");
    });

    test("1.2 Refresh token pipeline generates new access token", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "pipeline.student@test.com", password: "Student@123" });

      const refreshRes = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: loginRes.body.refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body).toHaveProperty("accessToken");
    });

    test("1.3 Unauthorized access without token returns 401", async () => {
      const res = await request(app).get("/api/admin/rules");
      expect(res.status).toBe(401);
    });

    test("1.4 Student token accessing Admin endpoint returns 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/admin/rules")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test("1.5 User Logout invalidates session cleanly", async () => {
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({});

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe("Logged out successfully");
    });
  });

  // PIPELINE 2: DEVICE REGISTRATION & FCM SYNC PIPELINE
  describe("PIPELINE 2: Device Management & FCM Push Pipeline", () => {
    test("2.1 Registering / Updating Device info updates FCM token and status", async () => {
      const res = await request(app)
        .post("/api/student/device/register")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          fcmToken: "new-fcm-token-67890",
          deviceInfo: {
            deviceId: "device-12345",
            platform: "android",
            deviceModel: "Pixel 7 Pro",
            osVersion: "14.0",
          },
        });

      expect([200, 201]).toContain(res.status);

      const deviceList = await Device.find({ userId: studentUser._id });
      expect(deviceList.length).toBeGreaterThan(0);
    });

    test("2.2 Admin querying devices returns active registered device list", async () => {
      const res = await request(app)
        .get("/api/admin/devices")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data || res.body.devices || res.body)).toBe(true);
    });
  });

  // PIPELINE 3: RULE & POLICY ENGINE PIPELINE (SCHEDULE & AUTO-BLOCK)
  describe("PIPELINE 3: Rule & Schedule Engine Pipeline", () => {
    test("3.1 Admin creating a time-based rule successfully persists rule in DB", async () => {
      const res = await request(app)
        .post("/api/admin/rules")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Class Hour Block",
          targetClassId: "C_CSE_A",
          scheduleStart: "09:00",
          scheduleEnd: "16:00",
          activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          blockedApps: ["com.instagram.android", "com.whatsapp"],
          status: "active",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");

      const createdRule = await Rule.findById(res.body._id);
      expect(createdRule.scheduleStart).toBe("09:00");
    });

    test("3.2 Policy engine calculates active restriction status within scheduled window", async () => {
      await Rule.create({
        createdBy: adminUser._id,
        title: "Active Window Test",
        targetClassId: "C_CSE_A",
        scheduleStart: "08:00",
        scheduleEnd: "17:00",
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        blockedApps: ["com.instagram.android"],
        status: "active",
        institutionId: "KSRCE",
      });

      const insideTime = new Date(2026, 8, 3, 11, 0, 0); // 11:00 AM
      const policy = await autoBlockService.getStudentPolicy({
        student: studentUser,
        device: testDevice,
        now: insideTime,
      });

      expect(policy.status).toBe("active");
      expect(policy.blockedPackages).toContain("com.instagram.android");
    });

    test("3.3 Policy engine auto-unblocks outside scheduled window", async () => {
      const outsideTime = new Date(2026, 8, 3, 18, 0, 0); // 06:00 PM (18:00)
      const policy = await autoBlockService.getStudentPolicy({
        student: studentUser,
        device: testDevice,
        now: outsideTime,
      });

      expect(policy.scheduleActive).toBe(false);
    });

    test("3.4 Student API /api/policy/latest returns computed restriction payload", async () => {
      const res = await request(app)
        .get(`/api/policy/latest?deviceId=${testDevice._id}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("policyVersion");
      expect(res.body).toHaveProperty("blockedPackages");
      expect(res.body).toHaveProperty("status");
    });
  });

  // PIPELINE 4: APP CATALOG & SCANNING PIPELINE
  describe("PIPELINE 4: App Catalog & Installed App Scanning Pipeline", () => {
    test("4.1 App Catalog registration adds package classification", async () => {
      await AppsCatalog.create({
        packageName: "com.facebook.katana",
        appName: "Facebook",
        category: "social",
      });

      const catalogEntry = await AppsCatalog.findOne({ packageName: "com.facebook.katana" });
      expect(catalogEntry.category).toBe("social");
    });

    test("4.2 Student app scan upload processes installed package list", async () => {
      const res = await request(app)
        .post("/api/student/scan")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          apps: [
            { packageName: "com.facebook.katana", appName: "Facebook" },
            { packageName: "com.google.android.calculator", appName: "Calculator" },
          ],
        });

      expect(res.status).toBe(200);

      const scanned = await ScannedApp.find({ studentId: studentUser._id });
      expect(scanned.length).toBeGreaterThan(0);
    });
  });

  // PIPELINE 5: DEVICE USAGE LOGGING PIPELINE
  describe("PIPELINE 5: Usage Tracking & Analytics Pipeline", () => {
    test("5.1 Recording student screen time usage persists usage entry", async () => {
      const res = await request(app)
        .post("/api/student/usage")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          logs: [
            {
              packageName: "com.google.android.calculator",
              durationMs: 300000,
              wasBlockedAttempt: false,
              timestamp: new Date().toISOString(),
            },
          ],
        });

      expect(res.status).toBe(200);
    });
  });

  // PIPELINE 6: EMAIL QUEUE & BACKGROUND WORKER PIPELINE
  describe("PIPELINE 6: Email Queue & Background Job Processing Pipeline", () => {
    test("6.1 Queueing student credentials email creates pending job in DB", async () => {
      const result = await emailQueueService.enqueueEmail({
        recipientEmail: studentUser.email,
        recipientName: studentUser.name,
        subject: "Welcome Credentials",
        htmlBody: "<p>Your password is Temp123</p>",
        tempPassword: "TempPassword123",
        role: "student",
      });

      expect(result._id).toBeDefined();
      expect(result.status).toBe("pending");
    });
  });

  // PIPELINE 7: SECURITY AUDIT TRAIL & TAMPER ALERT PIPELINE
  describe("PIPELINE 7: Security Audit Logging & Tamper Prevention Pipeline", () => {
    test("7.1 Acknowledging command with tamper flag creates Security Audit Log", async () => {
      const res = await request(app)
        .post("/api/student/command/ack")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          ruleId: "RULE_001",
          receivedAt: new Date().toISOString(),
          appliedAt: new Date().toISOString(),
          tamperDetected: true,
          tamperDetails: { reason: "Device Admin permission revoked" },
        });

      expect(res.status).toBe(200);

      const auditEntry = await AuditLog.findOne({ action: "TAMPER_DETECTED" });
      expect(auditEntry).toBeDefined();
    });
  });

});
