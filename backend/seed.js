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
const logger = require("./utils/logger");

const INSTITUTION_ID = "KSRCE";

const excelPath = path.join(__dirname, "Smart_Classroom_Complete_Import_Template.xlsx");

let adminData = {
  name: "System Administrator",
  email: "admin@ksrce.ac.in",
  password: "Admin@123456",
  role: "admin",
  employeeId: "ADM001",
};

let staffData = {
  name: "Class Staff",
  email: "staff1@ksrce.ac.in",
  password: "Temp@123",
  role: "staff",
  employeeId: "STF001",
};

let studentsData = [
  { name: "Dharani V V", email: "vvdharani57cse24_27@ksrce.ac.in", studentId: "221CS001", password: "Temp@123" },
  { name: "Cyril Christopher J", email: "cyrilchristopherj28cse24_27@ksrce.ac.in", studentId: "221CS002", password: "Temp@123" },
  { name: "Ashok Linga", email: "ashoklinga2006cse24_27@ksrce.ac.in", studentId: "221CS003", password: "Temp@123" },
  { name: "Francis Fernando V", email: "francisfernandov07cse24_27@ksrce.ac.in", studentId: "221CS004", password: "Temp@123" },
  { name: "Prasanna Aizen", email: "prasannaaizencse24_27@ksrce.ac.in", studentId: "221CS005", password: "Temp@123" },
  { name: "Preethi S", email: "preethis15112004cse24_27@ksrce.ac.in", studentId: "221CS006", password: "Temp@123" },
  { name: "Deepa Ramoorthy", email: "deeparamoorthy11cse24_27@ksrce.ac.in", studentId: "221CS007", password: "Temp@123" },
  { name: "Dharshini Karuppusamy", email: "dharshinikaruppusamy2007CSE24_27@ksrce.ac.in", studentId: "221CS008", password: "Temp@123" },
  { name: "D Sri", email: "dsri29697cse24_27@ksrce.ac.in", studentId: "221CS009", password: "Temp@123" },
  { name: "Aagalya", email: "aagalya558cse24_27@ksrce.ac.in", studentId: "221CS010", password: "Temp@123" },
  { name: "Darflin Shilka", email: "darflinshilka10acse24_27@ksrce.ac.in", studentId: "221CS011", password: "Temp@123" },
  { name: "Darshni Raj", email: "darshniraj47cse24_27@ksrce.ac.in", studentId: "221CS012", password: "Temp@123" },
];

if (fs.existsSync(excelPath)) {
  try {
    const wb = xlsx.readFile(excelPath);
    if (wb.Sheets["Admin"]) {
      const adminRows = xlsx.utils.sheet_to_json(wb.Sheets["Admin"]);
      if (adminRows.length > 0) {
        adminData = {
          name: adminRows[0]["Name"] || adminData.name,
          email: adminRows[0]["Email"] || adminData.email,
          password: adminRows[0]["Temporary Password"] || adminData.password,
          role: "admin",
          employeeId: adminRows[0]["Admin ID"] || adminData.employeeId,
        };
      }
    }

    if (wb.Sheets["Staff"]) {
      const staffRows = xlsx.utils.sheet_to_json(wb.Sheets["Staff"]);
      if (staffRows.length > 0) {
        staffData = {
          name: staffRows[0]["Staff Name"] || staffData.name,
          email: staffRows[0]["Email"] || staffData.email,
          password: staffRows[0]["Temporary Password"] || staffData.password,
          role: "staff",
          employeeId: staffRows[0]["Employee ID"] || staffData.employeeId,
        };
      }
    }

    if (wb.Sheets["Students"]) {
      const studentRows = xlsx.utils.sheet_to_json(wb.Sheets["Students"]);
      if (studentRows.length > 0) {
        studentsData = studentRows.map((r, idx) => ({
          name: r["Student Name"] || `Student ${idx + 1}`,
          email: String(r["Email"] || "").trim(),
          studentId: String(r["Register No"] || `221CS00${idx + 1}`).trim(),
          password: String(r["Temporary Password"] || "Temp@123").trim(),
        }));
      }
    }
    
    // Ensure primary developer account vvdharani57cse24_27@ksrce.ac.in is included
    const hasDharani = studentsData.some((s) => s.email.toLowerCase() === "vvdharani57cse24_27@ksrce.ac.in");
    if (!hasDharani) {
      studentsData.unshift({
        name: "Dharani V V",
        email: "vvdharani57cse24_27@ksrce.ac.in",
        studentId: "221CS000",
        password: "Temp@123",
      });
    }
    logger.info("Successfully imported credentials from Smart_Classroom_Complete_Import_Template.xlsx");
  } catch (e) {
    logger.warn(`Failed to parse excel file, using default dataset: ${e.message}`);
  }
}

const seed = async () => {
  try {
    await connectDB();
    logger.info("Connected to MongoDB");

    // Drop all existing collections for clean state
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
    }
    logger.info("Dropped all old collections from MongoDB Atlas");

    // 1. Create Department
    const dept = await Department.create({
      name: "Computer Science and Engineering",
      code: "CSE",
      institutionId: INSTITUTION_ID,
    });
    logger.info(`Department created: ${dept.code}`);

    // 2. Create Academic Year
    const year = await AcademicYear.create({
      name: "2025-2026",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-04-30"),
      institutionId: INSTITUTION_ID,
    });
    logger.info(`Academic Year created: ${year.name}`);

    // 3. Create Section
    const section = await Section.create({
      name: "A",
      departmentId: dept._id,
      academicYearId: year._id,
      institutionId: INSTITUTION_ID,
    });
    logger.info(`Section created: ${section.name}`);

    // 4. Create Class
    const classroom = await ClassRoom.create({
      name: "CSE Second Year - Section A",
      code: "CSE-II-A",
      departmentId: dept._id,
      sectionId: section._id,
      academicYearId: year._id,
      institutionId: INSTITUTION_ID,
    });
    logger.info(`Class created: ${classroom.code} (${classroom._id})`);

    // 5. Create Admin (Bootstrap account)
    const admin = await User.create({
      name: adminData.name,
      email: adminData.email,
      password: adminData.password,
      role: "admin",
      employeeId: adminData.employeeId,
      institutionId: INSTITUTION_ID,
      mustChangePassword: false,
      hasSetPassword: true,
      hasAcceptedTerms: true,
      termsAcceptedAt: new Date(),
      status: "active",
      isActive: true,
    });
    logger.info(`Admin created: ${admin.email}`);

    // 6. Create Staff (Must Change Password on First Login)
    const staff = await User.create({
      name: staffData.name,
      email: staffData.email,
      password: staffData.password,
      role: "staff",
      employeeId: staffData.employeeId,
      classId: classroom.code,
      classRoomId: classroom._id,
      departmentId: dept._id,
      institutionId: INSTITUTION_ID,
      mustChangePassword: true,
      hasSetPassword: true,
      hasAcceptedTerms: false,
      status: "active",
      isActive: true,
      registeredBy: admin._id,
    });
    logger.info(`Staff created: ${staff.email}`);

    // Assign staff to class
    await StaffAssignment.create({
      staffId: staff._id,
      classId: classroom._id,
      institutionId: INSTITUTION_ID,
      assignedBy: admin._id,
    });
    logger.info(`Staff assigned to class: ${classroom.code}`);

    // 7. Create 11 Real Students (Must Change Password on First Login)
    for (const s of studentsData) {
      const student = await User.create({
        name: s.name,
        email: s.email,
        password: s.password,
        role: "student",
        studentId: s.studentId,
        classId: classroom.code,
        classRoomId: classroom._id,
        departmentId: dept._id,
        academicYearId: year._id,
        sectionId: section._id,
        institutionId: INSTITUTION_ID,
        mustChangePassword: true,
        hasSetPassword: true,
        hasAcceptedTerms: false,
        status: "active",
        isActive: true,
        registeredBy: admin._id,
      });
      logger.info(`Student created: ${student.email} (${student.studentId})`);
    }

    // Summary Log Output
    const totalUsers = await User.countDocuments();

    console.log("\n====================================");
    console.log("  SPREADSHEET SEED COMPLETE");
    console.log("====================================");
    console.log(`  Institution:  ${INSTITUTION_ID}`);
    console.log(`  Classroom:    ${classroom.code}`);
    console.log(`  Total Users:  ${totalUsers}`);
    console.log("====================================\n");

    console.log("IMPORTED CREDENTIALS:");
    console.log("====================================");
    console.log(`Admin:  ${adminData.email} / ${adminData.password}`);
    console.log(`Staff:  ${staffData.email} / ${staffData.password} (mustChangePassword=true)`);
    console.log(`Students (${studentsData.length} Real Accounts - all mustChangePassword=true):`);
    for (const s of studentsData) {
      console.log(`  ${s.studentId} | ${s.email} | ${s.password}`);
    }
    const emailService = require("./services/emailService");
    await emailService.sendDeveloperCredentialRoster({
      admin: adminData,
      staff: staffData,
      students: studentsData,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
