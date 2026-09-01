process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const User = require("../models/User");
const Device = require("../models/Device");

let app;
let testUser, testDevice, refreshToken;

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  testUser = await User.create({
    name: "Test User",
    email: "user@test.com",
    password: "User@123",
    role: "student",
    institutionId: "INST001",
  });

  testDevice = await Device.create({
    userId: testUser._id,
    fcmToken: "test-fcm-token",
    status: "online",
    lastSyncAt: new Date(),
  });
});

describe("TestSprite Verification Suite", () => {
  test("Login with valid email and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "User@123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    refreshToken = res.body.refreshToken;
  });

  test("Login rejects invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "WrongPassword" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).not.toBe("Route not found");
  });

  test("Login with role context included", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "User@123", role: "student" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  test("Refresh access token with a valid refresh token", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "user@test.com", password: "User@123" });
    const validRefreshToken = loginRes.body.refreshToken;

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: validRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  test("Refresh access token without authentication credentials", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "invalid-token" });

    expect([400, 401, 403]).toContain(res.status);
    expect(res.body).not.toEqual({ error: "Route not found" });
  });

  test("Refresh access token without a refresh token body", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({});

    expect([400, 401, 403]).toContain(res.status);
    expect(res.body).not.toEqual({ error: "Route not found" });
  });

  test("Logout with authenticated session returns success", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "user@test.com", password: "User@123" });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`)
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out successfully");
  });

  test("Get latest device policy for a real device", async () => {
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "user@test.com", password: "User@123" });

    const res = await request(app)
      .get(`/api/policy/latest?deviceId=${testDevice._id}`)
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("policyVersion");
  });

  test("Get latest device policy without authentication", async () => {
    const res = await request(app)
      .get(`/api/policy/latest?deviceId=${testDevice._id}`);

    expect([401, 403]).toContain(res.status);
    expect(res.body).not.toEqual({ error: "Route not found" });
  });
});
