require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const staffRoutes = require("./routes/staff.routes");
const studentRoutes = require("./routes/student.routes");
const { generalLimiter, userLimiter } = require("./middleware/rateLimiter");
const emailService = require("./services/emailService");
const errorMiddleware = require("./middleware/errorMiddleware");
const logger = require("./utils/logger");

app.set("trust proxy", 1);

app.use(helmet());

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.use(generalLimiter);

const path = require("path");

app.use("/download", express.static(path.join(__dirname, "public/download")));

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Smart Classroom Mobile Usage Control System API Server is running.",
    healthCheck: "/health",
    apkDownload: "/download/app-release.apk",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health/smtp", (req, res) => {
  res.json({
    emailConfigured: emailService.isEmailConfigured(),
    emailProvider: emailService.activeProvider(),
    brevoConfigured: Boolean(process.env.BREVO_API_KEY),
    smtpConfigured: emailService.isSmtpConfigured(),
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    smtpUser: process.env.SMTP_EMAIL || process.env.SMTP_USER || null,
    fromEmail: process.env.FROM_EMAIL || null,
    appUrl: process.env.APP_URL || null,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/smtp-test", async (req, res) => {
  const result = await emailService.testSmtpConnectivity();
  res.json({
    smtpConfigured: emailService.isSmtpConfigured(),
    ...result,
    timestamp: new Date().toISOString(),
  });
});
const policyRoutes = require("./routes/policy.routes");

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);

app.use("/admin", userLimiter, adminRoutes);
app.use("/api/admin", userLimiter, adminRoutes);

app.use("/staff", userLimiter, staffRoutes);
app.use("/api/staff", userLimiter, staffRoutes);

app.use("/student", userLimiter, studentRoutes);
app.use("/api/student", userLimiter, studentRoutes);

app.use("/policy", userLimiter, policyRoutes);
app.use("/api/policy", userLimiter, policyRoutes);
app.use("/device-policy", userLimiter, policyRoutes);
app.use("/api/device-policy", userLimiter, policyRoutes);

// Direct top-level route forwarders for /login, /refresh, /logout
app.post("/login", (req, res, next) => { req.url = "/login"; authRoutes(req, res, next); });
app.post("/refresh", (req, res, next) => { req.url = "/refresh"; authRoutes(req, res, next); });
app.post("/logout", (req, res, next) => { req.url = "/logout"; authRoutes(req, res, next); });


app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorMiddleware);

module.exports = app;
