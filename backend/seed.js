require("dotenv").config();

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const xlsx = require("xlsx");

const connectDB = require("./config/db");
const User = require("./models/User");
const Department = require("./models/Department");
const AcademicYear = require("./models/AcademicYear");
const Section = require("./models/Section");
const ClassRoom = require("./models/ClassRoom");
const StaffAssignment = require("./models/StaffAssignment");
const AppsCatalog = require("./models/AppsCatalog");
const Rule = require("./models/Rule");
const ScannedApp = require("./models/ScannedApp");
const Device = require("./models/Device");

const INSTITUTION_ID = "KSRCE";

const excelPath = fs.existsSync(path.join(__dirname, "Smart_Classroom_Complete_Import_Template.xlsx"))
  ? path.join(__dirname, "Smart_Classroom_Complete_Import_Template.xlsx")
  : path.join(__dirname, "..", "Smart_Classroom_Complete_Import_Template.xlsx");

const seed = async () => {
  try {
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Seed template file not found at ${excelPath}. Please ensure the Excel file is present.`);
    }

    await connectDB();
    const logger = require("./utils/logger");
    logger.info("Connected to MongoDB for Seeding");

    // Drop all existing collections for clean state
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
    }
    logger.info("Dropped all old collections from MongoDB Atlas");

    // Parse Excel Workbook
    const wb = xlsx.readFile(excelPath);
    if (!wb.Sheets["Admin"] || !wb.Sheets["Staff"] || !wb.Sheets["Students"]) {
      throw new Error("Missing required sheets in the Excel file. Must contain: Admin, Staff, Students.");
    }

    const adminRows = xlsx.utils.sheet_to_json(wb.Sheets["Admin"]);
    const staffRows = xlsx.utils.sheet_to_json(wb.Sheets["Staff"]);
    const studentRows = xlsx.utils.sheet_to_json(wb.Sheets["Students"]);

    if (adminRows.length === 0 || staffRows.length === 0 || studentRows.length === 0) {
      throw new Error("Excel sheets must contain at least one record for Admin, Staff, and Students.");
    }

    // 1. Create Default Department
    const dept = await Department.create({
      name: "Computer Science and Engineering",
      code: "CSE",
      institutionId: INSTITUTION_ID,
    });
    logger.info(`Department created: ${dept.code}`);

    // Trackers to avoid duplicate DB insertions
    const yearMap = new Map();
    const sectionMap = new Map();
    const classroomMap = new Map();

    const getOrCreateYear = async (yearName) => {
      if (!yearName) return null;
      const targetYearName = String(yearName).toLowerCase().includes("year") ? String(yearName) : `${yearName} Year`;
      if (yearMap.has(targetYearName)) return yearMap.get(targetYearName);

      let found = await AcademicYear.findOne({ name: new RegExp(targetYearName, "i") });
      if (!found) {
        found = await AcademicYear.create({
          name: targetYearName,
          startDate: new Date("2025-06-01"),
          endDate: new Date("2026-04-30"),
          institutionId: INSTITUTION_ID,
        });
      }
      yearMap.set(targetYearName, found);
      return found;
    };

    const getOrCreateSection = async (secName, yearObj) => {
      if (!secName || !yearObj) return null;
      const key = `${String(secName).toUpperCase()}_${yearObj._id}`;
      if (sectionMap.has(key)) return sectionMap.get(key);

      let found = await Section.findOne({ name: new RegExp(secName, "i"), academicYearId: yearObj._id });
      if (!found) {
        found = await Section.create({
          name: String(secName).toUpperCase(),
          departmentId: dept._id,
          academicYearId: yearObj._id,
          institutionId: INSTITUTION_ID,
        });
      }
      sectionMap.set(key, found);
      return found;
    };

    const getOrCreateClassroom = async (yearObj, secObj) => {
      if (!yearObj || !secObj) return null;
      const classCode = `${dept.code}-${yearObj.name.charAt(0)}-${secObj.name}`;
      if (classroomMap.has(classCode)) return classroomMap.get(classCode);

      let found = await ClassRoom.findOne({ code: classCode });
      if (!found) {
        found = await ClassRoom.create({
          name: `${dept.code} ${yearObj.name} - Section ${secObj.name}`,
          code: classCode,
          departmentId: dept._id,
          sectionId: secObj._id,
          academicYearId: yearObj._id,
          institutionId: INSTITUTION_ID,
        });
      }
      classroomMap.set(classCode, found);
      return found;
    };

    // 2. Create Admin Account
    const adminRow = adminRows[0];
    const admin = await User.create({
      name: adminRow["Name"],
      email: adminRow["Email"],
      password: adminRow["Temporary Password"] || "Admin@123456",
      role: "admin",
      employeeId: adminRow["Admin ID"],
      institutionId: INSTITUTION_ID,
      mustChangePassword: false,
      hasSetPassword: true,
      hasAcceptedTerms: true,
      termsAcceptedAt: new Date(),
      status: "active",
      isActive: true,
    });
    logger.info(`Admin created: ${admin.email}`);

    // 3. Create Staff Accounts
    const emailService = require("./services/emailService");
    for (const row of staffRows) {
      const name = row["Name"];
      const email = String(row["Domain Email"] || "").trim().toLowerCase();
      const employeeId = row["Staff ID"];
      const password = row["Temporary Password"] || "Temp@123";
      const yearName = row["Year"];
      const secName = row["Assigned Section"];

      const yearObj = await getOrCreateYear(yearName);
      const secObj = await getOrCreateSection(secName, yearObj);
      const classroomObj = await getOrCreateClassroom(yearObj, secObj);

      const staffUser = await User.create({
        name,
        email,
        password,
        role: "staff",
        employeeId,
        departmentId: dept._id,
        academicYearId: yearObj ? yearObj._id : null,
        sectionId: secObj ? secObj._id : null,
        classRoomId: classroomObj ? classroomObj._id : null,
        classId: classroomObj ? classroomObj.code : null,
        institutionId: INSTITUTION_ID,
        mustChangePassword: true,
        hasSetPassword: false,
        hasAcceptedTerms: false,
        status: "active",
        isActive: true,
        registeredBy: admin._id,
      });
      logger.info(`Staff created: ${staffUser.email}`);

      if (classroomObj) {
        await StaffAssignment.create({
          staffId: staffUser._id,
          classId: classroomObj._id,
          institutionId: INSTITUTION_ID,
          assignedBy: admin._id,
        });
      }

      try {
        await emailService.sendTemporaryPasswordEmail({
          toEmail: staffUser.email,
          name: staffUser.name,
          tempPassword: password,
          role: "staff",
        });
      } catch (err) {
        logger.warn(`Failed to send credential email to staff ${staffUser.email}: ${err.message}`);
      }
    }

    // 4. Create Student Accounts
    for (const row of studentRows) {
      const name = row["Name"];
      const email = String(row["Domain Id"] || "").trim().toLowerCase();
      const studentId = row["Reg No"];
      const password = row["Temporary Password"] || "Temp@123";
      const yearName = row["YEAR"];
      const secName = row["SEC"];

      const yearObj = await getOrCreateYear(yearName);
      const secObj = await getOrCreateSection(secName, yearObj);
      const classroomObj = await getOrCreateClassroom(yearObj, secObj);

      const studentUser = await User.create({
        name,
        email,
        password,
        role: "student",
        studentId,
        departmentId: dept._id,
        academicYearId: yearObj ? yearObj._id : null,
        sectionId: secObj ? secObj._id : null,
        classRoomId: classroomObj ? classroomObj._id : null,
        classId: classroomObj ? classroomObj.code : null,
        institutionId: INSTITUTION_ID,
        mustChangePassword: true,
        hasSetPassword: false,
        hasAcceptedTerms: false,
        status: "active",
        isActive: true,
        registeredBy: admin._id,
      });
      logger.info(`Student created: ${studentUser.email} (${studentUser.studentId})`);

      try {
        await emailService.sendTemporaryPasswordEmail({
          toEmail: studentUser.email,
          name: studentUser.name,
          studentId: studentUser.studentId,
          tempPassword: password,
          role: "student",
        });
      } catch (err) {
        logger.warn(`Failed to send credential email to student ${studentUser.email}: ${err.message}`);
      }
    }

    // 5. Seed Social Media Registry
    const socialApps = [
      { packageName: "com.instagram.android", appName: "Instagram", category: "social", isSocialMedia: true },
      { packageName: "com.facebook.katana", appName: "Facebook", category: "social", isSocialMedia: true },
      { packageName: "com.facebook.lite", appName: "Facebook Lite", category: "social", isSocialMedia: true },
      { packageName: "com.facebook.orca", appName: "Messenger", category: "social", isSocialMedia: true },
      { packageName: "com.whatsapp", appName: "WhatsApp", category: "social", isSocialMedia: true },
      { packageName: "com.whatsapp.w4b", appName: "WhatsApp Business", category: "social", isSocialMedia: true },
      { packageName: "org.telegram.messenger", appName: "Telegram", category: "social", isSocialMedia: true },
      { packageName: "org.thunderdog.challegram", appName: "Telegram X", category: "social", isSocialMedia: true },
      { packageName: "org.thoughtcrime.securesms", appName: "Signal", category: "social", isSocialMedia: true },
      { packageName: "com.snapchat.android", appName: "Snapchat", category: "social", isSocialMedia: true },
      { packageName: "com.discord", appName: "Discord", category: "social", isSocialMedia: true },
      { packageName: "com.twitter.android", appName: "X (Twitter)", category: "social", isSocialMedia: true },
      { packageName: "com.threads.app", appName: "Threads", category: "social", isSocialMedia: true },
      { packageName: "com.linkedin.android", appName: "LinkedIn", category: "social", isSocialMedia: true },
      { packageName: "com.pinterest", appName: "Pinterest", category: "social", isSocialMedia: true },
      { packageName: "com.reddit.frontpage", appName: "Reddit", category: "social", isSocialMedia: true },
      { packageName: "com.tumblr", appName: "Tumblr", category: "social", isSocialMedia: true },
      { packageName: "com.zhiliaoapp.musically", appName: "TikTok", category: "social", isSocialMedia: true },
      { packageName: "com.ss.android.ugc.trill", appName: "TikTok Lite", category: "social", isSocialMedia: true }
    ];
    await AppsCatalog.insertMany(socialApps);
    logger.info("Successfully seeded master social media app registry.");

    // 6. Seed active policy rules for each unique classroom created
    const ruleMap = new Map();
    const createdClassrooms = Array.from(classroomMap.values());
    for (const classroom of createdClassrooms) {
      const defaultRule = await Rule.create({
        createdBy: admin._id,
        institutionId: INSTITUTION_ID,
        targetScope: { type: "class", targetId: classroom.code },
        targetClassId: classroom.code,
        blockedApps: [
          "com.instagram.android",
          "com.facebook.katana",
          "com.snapchat.android",
          "com.zhiliaoapp.musically",
          "com.twitter.android",
          "com.facebook.orca",
          "com.threads.app",
          "com.reddit.frontpage"
        ],
        scheduleStart: "09:00",
        scheduleEnd: "16:00",
        activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        reason: "Smart Classroom Social Media Policy — Active Class Hours Restriction",
        status: "active",
        policyVersion: 1,
      });
      ruleMap.set(classroom.code, defaultRule);
      logger.info(`Active Restriction Rule created for classroom: ${classroom.code}`);
    }

    // 7. Seed device configurations & app logs for all students
    const sampleAppsInventory = [
      { packageName: "com.instagram.android", appName: "Instagram", category: "social" },
      { packageName: "com.facebook.katana", appName: "Facebook", category: "social" },
      { packageName: "com.whatsapp", appName: "WhatsApp", category: "social" },
      { packageName: "com.snapchat.android", appName: "Snapchat", category: "social" },
      { packageName: "org.telegram.messenger", appName: "Telegram", category: "social" },
      { packageName: "com.google.android.youtube", appName: "YouTube", category: "entertainment" },
      { packageName: "com.android.chrome", appName: "Google Chrome", category: "utilities" }
    ];

    const createdStudents = await User.find({ role: "student" });
    for (const studentUser of createdStudents) {
      const studentDeviceId = `device_${studentUser.studentId || studentUser._id.toString()}`;
      const defaultRule = ruleMap.get(studentUser.classId);

      const device = await Device.create({
        userId: studentUser._id,
        deviceId: studentDeviceId,
        fcmToken: `fcm_token_${studentUser.studentId}`,
        platform: "android",
        osVersion: "14",
        appVersion: "1.0.0",
        deviceModel: "Android Smartphone",
        status: "online",
        isCompliant: true,
        lastKnownCommand: defaultRule ? {
          ruleId: defaultRule._id,
          action: "start",
          serverTimestamp: new Date(),
          policyVersion: 1,
        } : null,
      });

      const appsToInsert = sampleAppsInventory.map((app) => ({
        studentId: studentUser._id,
        deviceId: device._id,
        packageName: app.packageName,
        appName: app.appName,
        category: app.category,
        scannedAt: new Date(),
      }));
      await ScannedApp.insertMany(appsToInsert);

      const Notification = require("./models/Notification");
      await Notification.insertMany([
        {
          studentId: studentUser._id,
          title: "Department HOD / Admin Instruction",
          message: "HOD Notice: Mobile usage during active class & lab hours is strictly restricted to educational tools. Ensure your device synchronization is active.",
          type: "general",
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 15),
        },
        {
          studentId: studentUser._id,
          title: "Social Media Policy Active",
          message: `Classroom restriction policy active for ${studentUser.classId || "Class"}. Social media applications are restricted between 09:00 AM and 04:00 PM.`,
          type: "restriction",
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        }
      ]);
    }
    logger.info(`Device registries initialized for all ${createdStudents.length} students.`);

    const totalUsers = await User.countDocuments();
    console.log("\n====================================");
    console.log("  EXCEL DATABASE SEED COMPLETE");
    console.log("====================================");
    console.log(`  Total Users:  ${totalUsers}`);
    console.log(`  Classrooms:   ${createdClassrooms.length}`);
    console.log("====================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`Excel seed process failed: ${err.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
