require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("./config/db");
const User = require("./models/User");
const Device = require("./models/Device");
const Rule = require("./models/Rule");
const AppsCatalog = require("./models/AppsCatalog");
const ScannedApp = require("./models/ScannedApp");
const UsageLog = require("./models/UsageLog");
const AuditLog = require("./models/AuditLog");
const logger = require("./utils/logger");

const USERS = [
  {
    name: "Admin User",
    email: "admin@smartclass.com",
    password: "Admin@123",
    role: "admin",
    classId: null,
    institutionId: "INST001",
  },
  {
    name: "Staff User",
    email: "staff@smartclass.com",
    password: "Staff@123",
    role: "staff",
    classId: "C101",
    institutionId: "INST001",
  },
  {
    name: "Alice Student",
    email: "alice@smartclass.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  },
  {
    name: "Bob Student",
    email: "bob@smartclass.com",
    password: "Student@123",
    role: "student",
    classId: "C101",
    institutionId: "INST001",
  },
  {
    name: "Charlie Student",
    email: "charlie@smartclass.com",
    password: "Student@123",
    role: "student",
    classId: "C102",
    institutionId: "INST001",
  },
  {
    name: "Staff Two",
    email: "staff2@smartclass.com",
    password: "Staff@123",
    role: "staff",
    classId: "C102",
    institutionId: "INST001",
  },
];

const APP_CATALOG = [
  { packageName: "com.instagram.android", appName: "Instagram", category: "social", isDangerous: false },
  { packageName: "com.whatsapp", appName: "WhatsApp", category: "social", isDangerous: false },
  { packageName: "com.facebook.katana", appName: "Facebook", category: "social", isDangerous: false },
  { packageName: "com.twitter.android", appName: "X (Twitter)", category: "social", isDangerous: false },
  { packageName: "com.snapchat.android", appName: "Snapchat", category: "social", isDangerous: false },
  { packageName: "com.google.android.youtube", appName: "YouTube", category: "entertainment", isDangerous: false },
  { packageName: "com.netflix.mediaclient", appName: "Netflix", category: "entertainment", isDangerous: false },
  { packageName: "com.spotify.music", appName: "Spotify", category: "entertainment", isDangerous: false },
  { packageName: "com.zhiliaoapp.musically", appName: "TikTok", category: "entertainment", isDangerous: false },
  { packageName: "com.supercell.clashofclans", appName: "Clash of Clans", category: "games", isDangerous: false },
  { packageName: "com.supercell.brawlstars", appName: "Brawl Stars", category: "games", isDangerous: false },
  { packageName: "com.garena.game.codm", appName: "Call of Duty Mobile", category: "games", isDangerous: false },
  { packageName: "com.google.android.apps.docs", appName: "Google Docs", category: "educational", isDangerous: false },
  { packageName: "com.google.android.apps.classroom", appName: "Google Classroom", category: "educational", isDangerous: false },
  { packageName: "com.khanacademy.android", appName: "Khan Academy", category: "educational", isDangerous: false },
  { packageName: "com.microsoft.teams", appName: "Microsoft Teams", category: "productivity", isDangerous: false },
  { packageName: "com.slack", appName: "Slack", category: "productivity", isDangerous: false },
  { packageName: "org.telegram.messenger", appName: "Telegram", category: "social", isDangerous: false },
  { packageName: "com.duolingo", appName: "Duolingo", category: "educational", isDangerous: false },
  { packageName: "com.candyrush", appName: "Candy Crush", category: "games", isDangerous: false },
];

const seed = async () => {
  try {
    await connectDB();
    logger.info("Connected to MongoDB, starting seed...");

    await User.deleteMany({});
    await Device.deleteMany({});
    await Rule.deleteMany({});
    await AppsCatalog.deleteMany({});
    await ScannedApp.deleteMany({});
    await UsageLog.deleteMany({});
    await AuditLog.deleteMany({});
    logger.info("Cleared existing data");

    const createdUsers = [];
    for (const userData of USERS) {
      const user = await User.create(userData);
      createdUsers.push(user);
      logger.info(`Created user: ${user.name} (${user.email}) [${user.role}]`);
    }

    const students = createdUsers.filter((u) => u.role === "student");

    for (const student of students) {
      await Device.create({
        userId: student._id,
        fcmToken: `test-fcm-token-${student.name.toLowerCase().replace(" ", "-")}`,
        status: "online",
        lastSyncAt: new Date(),
      });
      logger.info(`Created device for ${student.name}`);
    }

    for (const app of APP_CATALOG) {
      await AppsCatalog.create(app);
    }
    logger.info(`Created ${APP_CATALOG.length} catalog apps`);

    const adminUser = createdUsers.find((u) => u.role === "admin");

    const rule = await Rule.create({
      createdBy: adminUser._id,
      blockedApps: [
        "com.instagram.android",
        "com.google.android.youtube",
        "com.zhiliaoapp.musically",
        "com.garena.game.codm",
      ],
      scheduleStart: "09:00",
      scheduleEnd: "16:00",
      activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      targetClassId: "C101",
      institutionId: "INST001",
      status: "active",
    });
    logger.info(`Created rule: ${rule._id} (active, targeting C101)`);

    const rule2 = await Rule.create({
      createdBy: adminUser._id,
      blockedApps: ["com.instagram.android", "com.facebook.katana"],
      scheduleStart: "10:00",
      scheduleEnd: "14:00",
      activeDays: ["Mon", "Wed", "Fri"],
      targetClassId: "C102",
      institutionId: "INST001",
      status: "draft",
    });
    logger.info(`Created rule2: ${rule2._id} (draft, targeting C102)`);

    const alice = createdUsers.find((u) => u.email === "alice@smartclass.com");
    const aliceDevice = await Device.findOne({ userId: alice._id });

    const scannedApps = [
      { packageName: "com.instagram.android", appName: "Instagram" },
      { packageName: "com.google.android.youtube", appName: "YouTube" },
      { packageName: "com.whatsapp", appName: "WhatsApp" },
      { packageName: "com.google.android.apps.docs", appName: "Google Docs" },
      { packageName: "com.spotify.music", appName: "Spotify" },
      { packageName: "com.zhiliaoapp.musically", appName: "TikTok" },
      { packageName: "com.garena.game.codm", appName: "Call of Duty Mobile" },
    ];

    for (const app of scannedApps) {
      await ScannedApp.create({
        studentId: alice._id,
        deviceId: aliceDevice._id,
        packageName: app.packageName,
        appName: app.appName,
        category: APP_CATALOG.find((c) => c.packageName === app.packageName)?.category || "uncategorized",
        scannedAt: new Date(),
      });
    }
    logger.info(`Created ${scannedApps.length} scanned apps for Alice`);

    const now = new Date();
    const usageLogs = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      for (const app of ["com.instagram.android", "com.google.android.youtube", "com.whatsapp", "com.spotify.music"]) {
        const durationMs = Math.floor(Math.random() * 3600000) + 600000;
        const wasBlocked = ["com.instagram.android", "com.google.android.youtube"].includes(app);
        usageLogs.push({
          studentId: alice._id,
          deviceId: aliceDevice._id,
          packageName: app,
          durationMs,
          wasBlockedAttempt: wasBlocked,
          timestamp: date,
        });
      }
    }

    await UsageLog.insertMany(usageLogs);
    logger.info(`Created ${usageLogs.length} usage log entries for Alice`);

    await AuditLog.create({
      actorId: adminUser._id,
      actorRole: "admin",
      action: "auth.login",
      target: { type: "auth", id: adminUser._id },
      details: { note: "Seeded" },
      timestamp: new Date(),
    });
    logger.info("Created sample audit log entry");

    logger.info("\n===== SEED COMPLETE =====");
    logger.info("Test accounts:");
    logger.info("  Admin:  admin@smartclass.com  / Admin@123");
    logger.info("  Staff:  staff@smartclass.com  / Staff@123  (class C101)");
    logger.info("  Staff2: staff2@smartclass.com / Staff@123  (class C102)");
    logger.info("  Student: alice@smartclass.com / Student@123 (class C101)");
    logger.info("  Student: bob@smartclass.com   / Student@123 (class C101)");
    logger.info("  Student: charlie@smartclass.com / Student@123 (class C102)");
    logger.info("==========================\n");

    process.exit(0);
  } catch (err) {
    logger.error(`Seed error: ${err.message}`);
    process.exit(1);
  }
};

seed();
