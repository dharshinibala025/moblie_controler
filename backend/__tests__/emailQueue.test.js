process.env.JWT_SECRET = "test-secret-for-jest";
process.env.NODE_ENV = "test";

const request = require("supertest");
const xlsx = require("xlsx");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const EmailQueue = require("../models/EmailQueue");
const emailService = require("../services/emailService");
const spreadsheetService = require("../services/spreadsheetService");
const emailQueueWorker = require("../jobs/emailQueueWorker");

let app;

const buildStudentWorkbook = (rows) => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([
    ["Reg No", "Name", "Domain Id", "YEAR", "SEC"],
    ...rows,
  ]);
  xlsx.utils.book_append_sheet(wb, ws, "Students");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

beforeAll(async () => {
  await connect();
  app = require("../app");
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("emailService.getTransporter", () => {
  it("connects to an explicit IPv4 literal with a proper TLS servername (Render has no IPv6)", async () => {
    const dns = require("dns");
    const net = require("net");
    const spy = jest
      .spyOn(dns.promises, "lookup")
      .mockResolvedValue([{ address: "142.250.72.19", family: 4 }]);
    try {
      const transporter = await emailService.getTransporter();
      const options = transporter.options;
      expect(net.isIP(options.host)).toBe(4);
      expect(options.servername).toBe("smtp.gmail.com");
      expect(options.connectionTimeout).toBe(30000);
      expect(options.greetingTimeout).toBe(30000);
      expect(options.socketTimeout).toBe(120000);
    } finally {
      spy.mockRestore();
    }
  });

  it("falls back to the hostname when IPv4 DNS resolution fails", async () => {
    const dns = require("dns");
    emailService._clearIpv4Cache();
    const spy = jest
      .spyOn(dns.promises, "lookup")
      .mockRejectedValue(new Error("getaddrinfo ENOTFOUND smtp.gmail.com"));
    try {
      const transporter = await emailService.getTransporter();
      expect(transporter.options.host).toBe("smtp.gmail.com");
      expect(transporter.options.servername).toBe("smtp.gmail.com");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("emailService.buildCredentialEmailHtml", () => {  it("renders the recipient details and temporary password into the email body", () => {
    const html = emailService.buildCredentialEmailHtml({
      name: "Alice Test",
      toEmail: "alice@test.com",
      regNo: "221CS001",
      tempPassword: "STU-ABC12",
      role: "student",
    });

    expect(html).toContain("Alice Test");
    expect(html).toContain("221CS001");
    expect(html).toContain("alice@test.com");
    expect(html).toContain("STU-ABC12");
    expect(html).toContain("STUDENT");
  });

  it("falls back to N/A when no register number is provided", () => {
    const html = emailService.buildCredentialEmailHtml({
      name: "Bob",
      toEmail: "bob@test.com",
      tempPassword: "STU-XYZ99",
    });
    expect(html).toContain("N/A");
  });
});

describe("spreadsheetService._insertEmailQueueEntries", () => {
  it("inserts entries that include the required htmlBody and returns the inserted count", async () => {
    const html = emailService.buildCredentialEmailHtml({
      name: "Alice Test",
      toEmail: "alice@test.com",
      regNo: "221CS001",
      tempPassword: "STU-ABC12",
    });

    const insertedCount = await spreadsheetService._insertEmailQueueEntries([
      {
        recipientEmail: "alice@test.com",
        recipientName: "Alice Test",
        studentId: "221CS001",
        subject: "Welcome",
        htmlBody: html,
        tempPassword: "STU-ABC12",
        role: "student",
        status: "pending",
      },
    ]);

    expect(insertedCount).toBe(1);
    const queued = await EmailQueue.findOne({ recipientEmail: "alice@test.com" });
    expect(queued).not.toBeNull();
    expect(queued.htmlBody).toContain("STU-ABC12");
    expect(queued.status).toBe("pending");
  });

  it("never claims success when rows fail validation (missing htmlBody)", async () => {
    const insertedCount = await spreadsheetService._insertEmailQueueEntries([
      {
        recipientEmail: "broken@test.com",
        recipientName: "Broken Row",
        subject: "Welcome",
        tempPassword: "STU-BROKEN",
        role: "student",
        status: "pending",
      },
    ]);

    expect(insertedCount).toBe(0);
    const count = await EmailQueue.countDocuments({ recipientEmail: "broken@test.com" });
    expect(count).toBe(0);
  });
});

describe("emailQueueWorker.processQueue", () => {
  it("dispatches pending jobs and marks them sent, passing studentId through", async () => {
    const sendSpy = jest
      .spyOn(emailService, "sendTemporaryPasswordEmail")
      .mockResolvedValue({ success: true });

    await EmailQueue.create([
      {
        recipientEmail: "a@test.com",
        recipientName: "A",
        subject: "Welcome",
        htmlBody: "<p>hi</p>",
        tempPassword: "STU-AAA",
        role: "student",
        studentId: "221CS001",
        status: "pending",
        nextRetryAt: new Date(Date.now() - 1000),
      },
      {
        recipientEmail: "b@test.com",
        recipientName: "B",
        subject: "Welcome",
        htmlBody: "<p>hi</p>",
        tempPassword: "STU-BBB",
        role: "student",
        studentId: "221CS002",
        status: "pending",
        nextRetryAt: new Date(Date.now() - 1000),
      },
    ]);

    await emailQueueWorker.processQueue();

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: "a@test.com", studentId: "221CS001" })
    );

    const jobs = await EmailQueue.find({});
    for (const job of jobs) {
      expect(job.status).toBe("sent");
      expect(job.sentAt).toBeInstanceOf(Date);
    }
  });

  it("keeps jobs pending with backoff when dispatch fails", async () => {
    jest
      .spyOn(emailService, "sendTemporaryPasswordEmail")
      .mockResolvedValue({ success: false, error: "SMTP down" });

    await EmailQueue.create({
      recipientEmail: "c@test.com",
      recipientName: "C",
      subject: "Welcome",
      htmlBody: "<p>hi</p>",
      tempPassword: "STU-CCC",
      role: "student",
      status: "pending",
      nextRetryAt: new Date(Date.now() - 1000),
    });

    await emailQueueWorker.processQueue();

    const job = await EmailQueue.findOne({ recipientEmail: "c@test.com" });
    expect(job.status).toBe("pending");
    expect(job.attempts).toBe(1);
    expect(job.lastError).toBe("SMTP down");
    expect(job.nextRetryAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("POST /admin/students/upload (end-to-end)", () => {
  it("creates users AND queues credential emails with a valid htmlBody, returning honest counts", async () => {
    jest
      .spyOn(emailService, "sendTemporaryPasswordEmail")
      .mockResolvedValue({ success: true });

    const User = require("../models/User");
    await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      password: "Admin@123",
      role: "admin",
      institutionId: "INST001",
    });

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123", role: "admin" });
    const token = loginRes.body?.accessToken || loginRes.body?.tempToken;

    const buffer = buildStudentWorkbook([
      ["221CS001", "Alice Test", "alice@test.com", "1", "A"],
      ["221CS002", "Bob Test", "bob@test.com", "1", "A"],
    ]);

    const res = await request(app)
      .post("/admin/students/upload")
      .set("Authorization", `Bearer ${token}`)
      .send({ fileBase64: buffer.toString("base64"), fileName: "students.xlsx" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.createdCount).toBe(2);
    expect(res.body.emailQueuedCount).toBe(2);
    expect(res.body.emailSentCount).toBe(2);
    expect(res.body.emailFailedCount).toBe(0);

    // Every queued email must carry the required htmlBody (regression guard)
    const queued = await EmailQueue.find({});
    expect(queued.length).toBeGreaterThanOrEqual(2);
    for (const job of queued) {
      expect(job.htmlBody).toBeTruthy();
      expect(job.htmlBody).toContain(job.tempPassword);
    }
  });
});
