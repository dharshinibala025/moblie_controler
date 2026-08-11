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

    // Basic file validation to prevent SheetJS infinite loop / freeze on corrupt zip/excel files
    const isXlsx = String(fileName || "").toLowerCase().endsWith(".xlsx");
    if (isXlsx) {
      if (fileBuffer.length < 100) {
        throw new Error("Invalid or corrupted Excel file (file size is too small).");
      }
      if (!fileBuffer.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]))) {
        throw new Error("Invalid or corrupted Excel file (missing ZIP End of Central Directory signature).");
      }
    }

    // Read uploaded file buffer in memory
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.Sheets["Students"] ? "Students" : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      throw new Error("No student records found in the uploaded file. Please ensure the Excel sheet is not empty and contains the student data.");
    }

    let totalRecords = rawRows.length;
    let createdCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;
    const errors = [];
    const createdUsersForEmail = [];

    // First, remove old student members, their devices, scanned apps, usage logs, blocked attempts, and notifications
    const Device = require("../models/Device");
    const ScannedApp = require("../models/ScannedApp");
    const UsageLog = require("../models/UsageLog");
    const BlockedAttempt = require("../models/BlockedAttempt");
    const Notification = require("../models/Notification");
    const oldStudentList = await User.find({ role: "student" });
    const oldStudentIds = oldStudentList.map((s) => s._id);
    if (oldStudentIds.length > 0) {
      await User.deleteMany({ _id: { $in: oldStudentIds } });
      await Device.deleteMany({ userId: { $in: oldStudentIds } });
      await ScannedApp.deleteMany({ studentId: { $in: oldStudentIds } });
      await UsageLog.deleteMany({ studentId: { $in: oldStudentIds } });
      await BlockedAttempt.deleteMany({ studentId: { $in: oldStudentIds } });
      await Notification.deleteMany({ studentId: { $in: oldStudentIds } });
    }

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // 1-indexed header + 1

      // Normalize row keys
      const normalizedRow = {};
      for (const k of Object.keys(row || {})) {
        const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        normalizedRow[normKey] = row[k];
      }

      const email = String(
        normalizedRow["email"] ||
        normalizedRow["emailid"] ||
        normalizedRow["emailaddress"] ||
        normalizedRow["mail"] ||
        normalizedRow["domainid"] ||
        normalizedRow["domain"] ||
        normalizedRow["domainemail"] ||
        ""
      ).trim().toLowerCase();

      const studentId = String(
        normalizedRow["registernumber"] ||
        normalizedRow["registerno"] ||
        normalizedRow["regno"] ||
        normalizedRow["rollno"] ||
        normalizedRow["rollnumber"] ||
        normalizedRow["studentid"] ||
        normalizedRow["id"] ||
        ""
      ).trim();

      const name = String(
        normalizedRow["studentname"] ||
        normalizedRow["name"] ||
        normalizedRow["fullname"] ||
        ""
      ).trim();

      const deptName = String(
        normalizedRow["department"] ||
        normalizedRow["dept"] ||
        normalizedRow["branch"] ||
        ""
      ).trim();

      const yearName = String(
        normalizedRow["year"] ||
        normalizedRow["academicyear"] ||
        normalizedRow["batch"] ||
        ""
      ).trim();

      const secName = String(
        normalizedRow["section"] ||
        normalizedRow["sec"] ||
        ""
      ).trim();

      const phone = String(
        normalizedRow["phone"] ||
        normalizedRow["mobile"] ||
        normalizedRow["contact"] ||
        normalizedRow["phonenumber"] ||
        ""
      ).trim();

      // Required row validation
      if (!email || !studentId || !name || !yearName || !secName) {
        failedCount++;
        errors.push({
          row: rowNum,
          identifier: studentId || email || `Row ${rowNum}`,
          reason: "Missing required fields (Reg No, Name, Domain Id, YEAR, or SEC)",
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
      let deptObj = null;
      if (deptName) {
        let found = await Department.findOne({
          $or: [{ name: new RegExp(deptName, "i") }, { code: new RegExp(deptName, "i") }],
        });
        if (!found) {
          found = await Department.create({
            name: deptName,
            code: deptName.toUpperCase(),
            institutionId: "KSRCE",
          });
        }
        deptObj = found;
      } else {
        let found = await Department.findOne({ code: "CSE" });
        if (!found) {
          found = await Department.create({
            name: "Computer Science and Engineering",
            code: "CSE",
            institutionId: "KSRCE",
          });
        }
        deptObj = found;
      }

      let yearObj = null;
      const targetYearName = yearName ? (yearName.toLowerCase().includes("year") ? yearName : `${yearName} Year`) : "";
      if (targetYearName) {
        let found = await AcademicYear.findOne({ name: new RegExp(targetYearName, "i") });
        if (!found) {
          found = await AcademicYear.create({
            name: targetYearName,
            startDate: new Date("2025-06-01"),
            endDate: new Date("2026-04-30"),
            institutionId: "KSRCE",
          });
        }
        yearObj = found;
      }

      let secObj = null;
      if (secName) {
        let found = await Section.findOne({
          name: secName.toUpperCase(),
          academicYearId: yearObj ? yearObj._id : null,
        });
        if (!found) {
          found = await Section.create({
            name: secName.toUpperCase(),
            departmentId: deptObj ? deptObj._id : null,
            academicYearId: yearObj ? yearObj._id : null,
            institutionId: "KSRCE",
          });
        }
        secObj = found;
      }

      const classCode = deptObj
        ? `${deptObj.code}-${yearObj.name.charAt(0)}-${secObj.name}`
        : `${yearObj.name.replace(/\s+Year/i, "")}-${secObj.name}`;

      let classroomObj = await ClassRoom.findOne({ code: classCode });
      if (!classroomObj && yearObj && secObj) {
        classroomObj = await ClassRoom.create({
          name: deptObj
            ? `${deptObj.code} ${yearObj.name} - Section ${secObj.name}`
            : `${yearObj.name} - Section ${secObj.name}`,
          code: classCode,
          departmentId: deptObj ? deptObj._id : null,
          sectionId: secObj ? secObj._id : null,
          academicYearId: yearObj ? yearObj._id : null,
          institutionId: "KSRCE",
        });
      }

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
        classRoomId: classroomObj ? classroomObj._id : null,
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

    // Clean up unused structural entities to prevent showing orphaned mock data
    await this._cleanupUnusedStructuralEntities();

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

    // Basic file validation to prevent SheetJS infinite loop / freeze on corrupt zip/excel files
    const isXlsx = String(fileName || "").toLowerCase().endsWith(".xlsx");
    if (isXlsx) {
      if (fileBuffer.length < 100) {
        throw new Error("Invalid or corrupted Excel file (file size is too small).");
      }
      if (!fileBuffer.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]))) {
        throw new Error("Invalid or corrupted Excel file (missing ZIP End of Central Directory signature).");
      }
    }

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.Sheets["Staff"] ? "Staff" : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      throw new Error("No staff records found in the uploaded file. Please ensure the Excel sheet is not empty and contains the staff data.");
    }

    let totalRecords = rawRows.length;
    let createdCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;
    const errors = [];
    const createdUsersForEmail = [];

    // First, remove old staff members, their assignments, and their devices
    const StaffAssignment = require("../models/StaffAssignment");
    const Device = require("../models/Device");
    const oldStaffList = await User.find({ role: "staff" });
    const oldStaffIds = oldStaffList.map((s) => s._id);
    if (oldStaffIds.length > 0) {
      await User.deleteMany({ _id: { $in: oldStaffIds } });
      await StaffAssignment.deleteMany({ staffId: { $in: oldStaffIds } });
      await Device.deleteMany({ userId: { $in: oldStaffIds } });
    }

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2;

      // Normalize row keys
      const normalizedRow = {};
      for (const k of Object.keys(row || {})) {
        const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        normalizedRow[normKey] = row[k];
      }

      const employeeId = String(
        normalizedRow["staffid"] ||
        normalizedRow["employeeid"] ||
        normalizedRow["staffnameid"] ||
        normalizedRow["id"] ||
        ""
      ).trim();

      const name = String(
        normalizedRow["name"] ||
        normalizedRow["staffname"] ||
        normalizedRow["fullname"] ||
        ""
      ).trim();

      const email = String(
        normalizedRow["email"] ||
        normalizedRow["emailid"] ||
        normalizedRow["emailaddress"] ||
        normalizedRow["mail"] ||
        normalizedRow["domainid"] ||
        normalizedRow["domain"] ||
        normalizedRow["domainemail"] ||
        ""
      ).trim().toLowerCase();

      const deptName = String(
        normalizedRow["department"] ||
        normalizedRow["dept"] ||
        normalizedRow["branch"] ||
        ""
      ).trim();

      const yearName = String(
        normalizedRow["year"] ||
        normalizedRow["academicyear"] ||
        normalizedRow["batch"] ||
        ""
      ).trim();

      const secName = String(
        normalizedRow["assignedsection"] ||
        normalizedRow["section"] ||
        normalizedRow["sec"] ||
        ""
      ).trim();

      if (!employeeId || !name || !email || !yearName || !secName) {
        failedCount++;
        errors.push({
          row: rowNum,
          identifier: employeeId || email || `Row ${rowNum}`,
          reason: "Missing required fields (Staff ID, Name, Domain Email, Year, or Assigned Section)",
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

      let deptObj = null;
      if (deptName) {
        let found = await Department.findOne({
          $or: [{ name: new RegExp(deptName, "i") }, { code: new RegExp(deptName, "i") }],
        });
        if (!found) {
          found = await Department.create({
            name: deptName,
            code: deptName.toUpperCase(),
            institutionId: "KSRCE",
          });
        }
        deptObj = found;
      } else {
        let found = await Department.findOne({ code: "CSE" });
        if (!found) {
          found = await Department.create({
            name: "Computer Science and Engineering",
            code: "CSE",
            institutionId: "KSRCE",
          });
        }
        deptObj = found;
      }

      let yearObj = null;
      const targetYearName = yearName ? (yearName.toLowerCase().includes("year") ? yearName : `${yearName} Year`) : "";
      if (targetYearName) {
        let found = await AcademicYear.findOne({ name: new RegExp(targetYearName, "i") });
        if (!found) {
          found = await AcademicYear.create({
            name: targetYearName,
            startDate: new Date("2025-06-01"),
            endDate: new Date("2026-04-30"),
            institutionId: "KSRCE",
          });
        }
        yearObj = found;
      }

      let secObj = null;
      if (secName) {
        let found = await Section.findOne({
          name: secName.toUpperCase(),
          academicYearId: yearObj ? yearObj._id : null,
        });
        if (!found) {
          found = await Section.create({
            name: secName.toUpperCase(),
            departmentId: deptObj ? deptObj._id : null,
            academicYearId: yearObj ? yearObj._id : null,
            institutionId: "KSRCE",
          });
        }
        secObj = found;
      }

      const classCode = deptObj
        ? `${deptObj.code}-${yearObj.name.charAt(0)}-${secObj.name}`
        : `${yearObj.name.replace(/\s+Year/i, "")}-${secObj.name}`;

      let classroomObj = await ClassRoom.findOne({ code: classCode });
      if (!classroomObj && yearObj && secObj) {
        classroomObj = await ClassRoom.create({
          name: deptObj
            ? `${deptObj.code} ${yearObj.name} - Section ${secObj.name}`
            : `${yearObj.name} - Section ${secObj.name}`,
          code: classCode,
          departmentId: deptObj ? deptObj._id : null,
          sectionId: secObj ? secObj._id : null,
          academicYearId: yearObj ? yearObj._id : null,
          institutionId: "KSRCE",
        });
      }

      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
      const tempPassword = `STF-${randomSuffix}`;

      const newStaff = await User.create({
        name,
        email,
        employeeId,
        password: tempPassword,
        role: "staff",
        institutionId: "KSRCE",
        departmentId: deptObj ? deptObj._id : null,
        academicYearId: yearObj ? yearObj._id : null,
        sectionId: secObj ? secObj._id : null,
        classRoomId: classroomObj ? classroomObj._id : null,
        classId: classCode,
        mustChangePassword: true,
        passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        active: true,
      });

      if (classroomObj) {
        await StaffAssignment.findOneAndUpdate(
          { staffId: newStaff._id, classId: classroomObj._id },
          {
            staffId: newStaff._id,
            classId: classroomObj._id,
            institutionId: "KSRCE",
            assignedBy: uploadedByUserId || newStaff._id,
            isActive: true,
          },
          { upsert: true, new: true }
        );
      }

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

    // Clean up unused structural entities to prevent showing orphaned mock data
    await this._cleanupUnusedStructuralEntities();

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
   * Cleans up structural database entities not referenced by any user
   */
  async _cleanupUnusedStructuralEntities() {
    try {
      const User = require("../models/User");
      const Department = require("../models/Department");
      const AcademicYear = require("../models/AcademicYear");
      const Section = require("../models/Section");
      const ClassRoom = require("../models/ClassRoom");
      const Rule = require("../models/Rule");
      const logger = require("../utils/logger");

      // 1. Get all unique ObjectIds and Codes in use by Users
      const activeDeptIds = await User.find({}).distinct("departmentId");
      const activeYearIds = await User.find({}).distinct("academicYearId");
      const activeSectionIds = await User.find({}).distinct("sectionId");
      const activeClassRoomIds = await User.find({}).distinct("classRoomId");
      const activeClassIds = await User.find({}).distinct("classId");

      // 2. Delete ClassRooms not referenced by any student or staff
      const deletedClasses = await ClassRoom.deleteMany({
        _id: { $nin: activeClassRoomIds }
      });

      // 3. Delete Sections not referenced
      const deletedSections = await Section.deleteMany({
        _id: { $nin: activeSectionIds }
      });

      // 4. Delete AcademicYears not referenced
      const deletedYears = await AcademicYear.deleteMany({
        _id: { $nin: activeYearIds }
      });

      // 5. Delete Departments not referenced
      const deletedDepts = await Department.deleteMany({
        _id: { $nin: activeDeptIds }
      });

      // 6. Delete Rules targeting classes that no longer exist or have no active students
      const deletedRules = await Rule.deleteMany({
        targetClassId: { $nin: activeClassIds }
      });

      logger.info(`Structural Cleanup Summary:
- Classrooms deleted: ${deletedClasses.deletedCount}
- Sections deleted: ${deletedSections.deletedCount}
- Academic Years deleted: ${deletedYears.deletedCount}
- Departments deleted: ${deletedDepts.deletedCount}
- Rules deleted: ${deletedRules.deletedCount}`);
    } catch (err) {
      const logger = require("../utils/logger");
      logger.error(`Structural cleanup failed: ${err.message}`);
    }
  }
}

module.exports = new SpreadsheetService();
