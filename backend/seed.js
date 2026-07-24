require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const connectDB = require("./config/db");
const User = require("./models/User");
const Department = require("./models/Department");
const AcademicYear = require("./models/AcademicYear");
const Section = require("./models/Section");
const ClassRoom = require("./models/ClassRoom");
const StaffAssignment = require("./models/StaffAssignment");
const Session = require("./models/Session");
const logger = require("./utils/logger");

const INSTITUTION_ID = "KSRCE";

const ADMIN = {
  name: "System Administrator",
  email: "admin@ksrce.ac.in",
  password: "KsrAdmin@2026",
  role: "admin",
  employeeId: "ADM001",
};

const STAFF = {
  name: "Dr. Priya Sharma",
  email: "priya@ksrce.ac.in",
  password: "Staff@2026",
  role: "staff",
  employeeId: "STF001",
};

const STUDENTS = [
  { name: "Arun Kumar", email: "arun@ksrce.ac.in", studentId: "STU001", password: "Student@2026" },
  { name: "Bharathi Devi", email: "bharathi@ksrce.ac.in", studentId: "STU002", password: "Student@2026" },
  { name: "Chandran Murugan", email: "chandran@ksrce.ac.in", studentId: "STU003", password: "Student@2026" },
  { name: "Deepa Lakshmi", email: "deepa@ksrce.ac.in", studentId: "STU004", password: "Student@2026" },
  { name: "Ezhil Raj", email: "ezhil@ksrce.ac.in", studentId: "STU005", password: "Student@2026" },
  { name: "Fathima Banu", email: "fathima@ksrce.ac.in", studentId: "STU006", password: "Student@2026" },
  { name: "Ganesh Prasad", email: "ganesh@ksrce.ac.in", studentId: "STU007", password: "Student@2026" },
  { name: "Hema Malini", email: "hema@ksrce.ac.in", studentId: "STU008", password: "Student@2026" },
  { name: "Irfan Khan", email: "irfan@ksrce.ac.in", studentId: "STU009", password: "Student@2026" },
  { name: "Janani Sri", email: "janani@ksrce.ac.in", studentId: "STU010", password: "Student@2026" },
];

const seed = async () => {
  try {
    await connectDB();
    logger.info("Connected to MongoDB");

    // Drop all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
    }
    logger.info("Dropped all collections");

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

    // 5. Create Admin
    const admin = await User.create({
      name: ADMIN.name,
      email: ADMIN.email,
      password: ADMIN.password,
      role: "admin",
      employeeId: ADMIN.employeeId,
      institutionId: INSTITUTION_ID,
      hasSetPassword: true,
      hasAcceptedTerms: true,
      termsAcceptedAt: new Date(),
      status: "active",
      isActive: true,
    });
    logger.info(`Admin created: ${admin.email}`);

    // 6. Create Staff
    const staff = await User.create({
      name: STAFF.name,
      email: STAFF.email,
      password: STAFF.password,
      role: "staff",
      employeeId: STAFF.employeeId,
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

    // 7. Create Students
    for (const s of STUDENTS) {
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

    // Summary
    const totalUsers = await User.countDocuments();
    const totalDepts = await Department.countDocuments();
    const totalYears = await AcademicYear.countDocuments();
    const totalSections = await Section.countDocuments();
    const totalClasses = await ClassRoom.countDocuments();
    const totalAssignments = await StaffAssignment.countDocuments();

    console.log("\n====================================");
    console.log("  SEED COMPLETE");
    console.log("====================================");
    console.log(`  Institution:  ${INSTITUTION_ID}`);
    console.log(`  Departments:  ${totalDepts}`);
    console.log(`  Acad Years:   ${totalYears}`);
    console.log(`  Sections:     ${totalSections}`);
    console.log(`  Classes:      ${totalClasses}`);
    console.log(`  Users:        ${totalUsers}`);
    console.log(`  Assignments:  ${totalAssignments}`);
    console.log("====================================\n");

    console.log("LOGIN CREDENTIALS:");
    console.log("====================================");
    console.log(`Admin:  ${ADMIN.email} / ${ADMIN.password}`);
    console.log(`Staff:  ${STAFF.email} / ${STAFF.password} (mustChangePassword)`);
    console.log(`Students (all mustChangePassword=true):`);
    for (const s of STUDENTS) {
      console.log(`  ${s.email} / ${s.password}`);
    }
    console.log("====================================\n");

    console.log(`Class ID for API calls: ${classroom._id}`);
    console.log(`Department ID: ${dept._id}`);
    console.log(`Academic Year ID: ${year._id}`);
    console.log(`Section ID: ${section._id}`);

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
