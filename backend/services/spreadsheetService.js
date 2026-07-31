const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");
const AcademicYear = require("../models/AcademicYear");
const Section = require("../models/Section");
const ClassRoom = require("../models/ClassRoom");
const SpreadsheetUploadHistory = require("../models/SpreadsheetUploadHistory");
const EmailQueue = require("../models/EmailQueue");
const emailService = require("./emailService");
const auditService = require("./auditService");
const logger = require("../utils/logger");

class SpreadsheetService {
  /**
   * Process Student Spreadsheet Upload (.xlsx / .csv) directly uploaded from Mobile App Storage
   */
  async processStudentUpload(fileBuffer, fileName, uploadedByUserId, role = "admin") {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("No file uploaded. Please select an Excel file (.xlsx or .csv) from your device storage.");
    }

    // Read uploaded file buffer in memory
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.Sheets["Students"] ? "Students" : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    let totalRecords = rawRows.length;
    let createdCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;
    const errors = [];
    const createdUsersForEmail = [];

    const defaultDept = await Department.findOne({ code: "CSE" });
    const defaultYear = await AcademicYear.findOne({ name: "1st Year" });
    const defaultSec = await Section.findOne({ name: "A" });
    const defaultClass = await ClassRoom.findOne({ code: "CSE-1-A" });

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // 1-indexed header + 1

      const email = String(row["Email"] || row["email"] || "").trim().toLowerCase();
      const studentId = String(
        row["Register Number"] ||
        row["RegisterNo"] ||
        row["RegisterNumber"] ||
        row["RegNo"] ||
        row["studentId"] ||
        ""
      ).trim();
      const name = String(
        row["Student Name"] ||
        row["StudentName"] ||
        row["Name"] ||
        row["name"] ||
        ""
      ).trim();
      const deptName = String(row["Department"] || row["department"] || "").trim();
      const yearName = String(row["Year"] || row["year"] || row["AcademicYear"] || "").trim();
      const secName = String(row["Section"] || row["section"] || "").trim();
      const phone = String(row["Phone"] || row["phone"] || row["Mobile"] || row["mobile"] || "").trim();

      // Required row validation
      if (!email || !studentId || !name) {
        failedCount++;
        errors.push({
          row: rowNum,
          identifier: studentId || email || `Row ${rowNum}`,
          reason: "Missing required fields (Register Number, Student Name, or Email)",
        });
        continue;
      }

      // Duplicate check: Ignore existing student accounts
      const existingUser = await User.findOne({
        $or: [{ email }, { studentId }],
      });

      if (existingUser) {
        duplicateCount++;
        errors.push({
          row: rowNum,
          identifier: studentId,
          reason: `Duplicate student ignored (Account with Register No '${studentId}' or Email '${email}' already exists)`,
        });
        continue;
      }

      // Generate unique temporary password e.g. STU-XA72Q
      // NOTE: Do NOT pre-hash — Mongoose pre("save") hook will hash it automatically.
      // Pre-hashing causes double-hash which makes bcrypt.compare always fail (Invalid credentials).
      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
      const tempPassword = `STU-${randomSuffix}`;
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days Expiry

      // Resolve department / year / section
      let deptObj = defaultDept;
      if (deptName) {
        const found = await Department.findOne({
          $or: [{ name: new RegExp(deptName, "i") }, { code: new RegExp(deptName, "i") }],
        });
        if (found) deptObj = found;
      }

      let yearObj = defaultYear;
      if (yearName) {
        const found = await AcademicYear.findOne({ name: new RegExp(yearName, "i") });
        if (found) yearObj = found;
      }

      let secObj = defaultSec;
      if (secName) {
        const found = await Section.findOne({ name: new RegExp(secName, "i") });
        if (found) secObj = found;
      }

      const classCode = deptObj && yearObj && secObj ? `${deptObj.code}-${yearObj.name.charAt(0)}-${secObj.name}` : "CSE-1-A";

      const newUser = await User.create({
        name,
        email,
        studentId,
        phone,
        password: tempPassword, // plain-text — Mongoose pre-save hook will hash
        role: "student",
        institutionId: "KSRCE",
        departmentId: deptObj ? deptObj._id : null,
        academicYearId: yearObj ? yearObj._id : null,
        sectionId: secObj ? secObj._id : null,
        classRoomId: defaultClass ? defaultClass._id : null,
        classId: classCode,
        mustChangePassword: true,
        passwordExpiresAt: expiryDate,
        active: true,
      });

      createdCount++;
      createdUsersForEmail.push({
        name: newUser.name,
        email: newUser.email,
        studentId: newUser.studentId,
        password: tempPassword,
      });
    }

    // AUTOMATIC EMAIL DISPATCH: Send temporary password ONLY to that student's email address
    for (const studentData of createdUsersForEmail) {
      try {
        const emailResult = await emailService.sendTemporaryPasswordEmail({
          toEmail: studentData.email,
          name: studentData.name,
          tempPassword: studentData.password,
          role: "student",
        });

        if (emailResult.success) {
          emailSentCount++;
        } else {
          emailFailedCount++;
          // Queue for background retry engine if direct send fails
          await EmailQueue.create({
            recipientEmail: studentData.email,
            recipientName: studentData.name,
            studentId: studentData.studentId,
            subject: "Welcome to Smart Classroom Portal — Temporary Login Credentials",
            tempPassword: studentData.password,
            role: "student",
            status: "pending",
            lastError: emailResult.error || "Initial dispatch failed",
          }).catch(() => {});
        }
      } catch (err) {
        emailFailedCount++;
        logger.error(`Failed to send credential email to ${studentData.email}: ${err.message}`);
      }
    }

    // Audit and upload history recording
    let validUploadedBy = uploadedByUserId;
    if (!mongoose.Types.ObjectId.isValid(validUploadedBy)) {
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) validUploadedBy = adminUser._id;
    }

    let history = null;
    if (mongoose.Types.ObjectId.isValid(validUploadedBy)) {
      history = await SpreadsheetUploadHistory.create({
        uploadedBy: validUploadedBy,
        fileName,
        uploadType: "student",
        totalRows: totalRecords,
        createdCount,
        skippedCount: duplicateCount + failedCount,
        emailSentCount,
        errors,
        institutionId: "KSRCE",
      });

      await auditService.logAction(
        validUploadedBy,
        role,
        "spreadsheet.upload.student",
        { type: "spreadsheet", id: history._id },
        { fileName, totalRecords, createdCount, duplicateCount, failedCount, emailSentCount }
      ).catch((err) => logger.warn(`Audit log notice: ${err.message}`));
    }

    return {
      historyId: history ? history._id : null,
      totalRecords,
      createdCount,
      duplicateCount,
      failedCount,
      emailSentCount,
      emailFailedCount,
      errors,
    };
  }

  /**
   * Process Staff Spreadsheet Upload (.xlsx / .csv) directly uploaded from Mobile App Storage
   */
  async processStaffUpload(fileBuffer, fileName, uploadedByUserId, role = "admin") {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("No file uploaded. Please select a staff Excel file (.xlsx or .csv) from your device storage.");
    }

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.Sheets["Staff"] ? "Staff" : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    let totalRecords = rawRows.length;
    let createdCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;
    const errors = [];
    const createdUsersForEmail = [];

    const defaultDept = await Department.findOne({ code: "CSE" });

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2;

      const employeeId = String(
        row["Staff ID"] || row["EmployeeID"] || row["employeeId"] || row["StaffId"] || ""
      ).trim();
      const name = String(row["Name"] || row["Staff Name"] || row["StaffName"] || row["name"] || "").trim();
      const email = String(row["Email"] || row["email"] || "").trim().toLowerCase();
      const deptName = String(row["Department"] || row["department"] || "").trim();

      if (!employeeId || !name || !email) {
        failedCount++;
        errors.push({
          row: rowNum,
          identifier: employeeId || email || `Row ${rowNum}`,
          reason: "Missing required fields (Staff ID, Name, or Email)",
        });
        continue;
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { employeeId }],
      });

      if (existingUser) {
        duplicateCount++;
        errors.push({
          row: rowNum,
          identifier: employeeId,
          reason: `Duplicate staff ignored (Account with Staff ID '${employeeId}' or Email '${email}' already exists)`,
        });
        continue;
      }

      let deptObj = defaultDept;
      if (deptName) {
        const found = await Department.findOne({
          $or: [{ name: new RegExp(deptName, "i") }, { code: new RegExp(deptName, "i") }],
        });
        if (found) deptObj = found;
      }

      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
      const tempPassword = `STF-${randomSuffix}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const newStaff = await User.create({
        name,
        email,
        employeeId,
        password: hashedPassword,
        role: "staff",
        institutionId: "KSRCE",
        departmentId: deptObj ? deptObj._id : null,
        classId: "CSE-1-A",
        mustChangePassword: true,
        passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        active: true,
      });

      createdCount++;
      createdUsersForEmail.push({
        name: newStaff.name,
        email: newStaff.email,
        employeeId: newStaff.employeeId,
        password: tempPassword,
      });
    }

    for (const staffItem of createdUsersForEmail) {
      try {
        const emailResult = await emailService.sendTemporaryPasswordEmail({
          toEmail: staffItem.email,
          name: staffItem.name,
          tempPassword: staffItem.password,
          role: "staff",
        });

        if (emailResult.success) {
          emailSentCount++;
        } else {
          emailFailedCount++;
          await EmailQueue.create({
            recipientEmail: staffItem.email,
            recipientName: staffItem.name,
            subject: "Welcome to Smart Classroom Portal — Staff Login Credentials",
            tempPassword: staffItem.password,
            role: "staff",
            status: "pending",
            lastError: emailResult.error || "Initial dispatch failed",
          }).catch(() => {});
        }
      } catch (err) {
        emailFailedCount++;
        logger.error(`Failed to send credential email to ${staffItem.email}: ${err.message}`);
      }
    }

    let validUploadedBy = uploadedByUserId;
    if (!mongoose.Types.ObjectId.isValid(validUploadedBy)) {
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) validUploadedBy = adminUser._id;
    }

    let history = null;
    if (mongoose.Types.ObjectId.isValid(validUploadedBy)) {
      history = await SpreadsheetUploadHistory.create({
        uploadedBy: validUploadedBy,
        fileName,
        uploadType: "staff",
        totalRows: totalRecords,
        createdCount,
        skippedCount: duplicateCount + failedCount,
        emailSentCount,
        errors,
        institutionId: "KSRCE",
      });

      await auditService.logAction(
        validUploadedBy,
        role,
        "spreadsheet.upload.staff",
        { type: "spreadsheet", id: history._id },
        { fileName, totalRecords, createdCount, duplicateCount, failedCount, emailSentCount }
      ).catch((err) => logger.warn(`Audit log notice: ${err.message}`));
    }

    return {
      historyId: history ? history._id : null,
      totalRecords,
      createdCount,
      duplicateCount,
      failedCount,
      emailSentCount,
      emailFailedCount,
      errors,
    };
  }
}

module.exports = new SpreadsheetService();
