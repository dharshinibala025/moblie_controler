require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const staffRoutes = require("./routes/staff.routes");
const studentRoutes = require("./routes/student.routes");
const { generalLimiter, userLimiter } = require("./middleware/rateLimiter");
const errorMiddleware = require("./middleware/errorMiddleware");
const logger = require("./utils/logger");

const app = express();

if (process.env.TRUST_PROXY) {
  app.set("trust proxy", parseInt(process.env.TRUST_PROXY) || 1);
}

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

app.use("/auth", authRoutes);
app.use("/admin", userLimiter, adminRoutes);
app.use("/staff", userLimiter, staffRoutes);
app.use("/student", userLimiter, studentRoutes);
app.use("/policy", userLimiter, require("./routes/policy.routes"));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorMiddleware);

module.exports = app;
