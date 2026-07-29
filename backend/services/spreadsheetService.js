const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const Department = require("../models/Department");
const AcademicYear = require("../models/AcademicYear");
const Section = require("../models/Section");
const ClassRoom = require("../models/ClassRoom");
const SpreadsheetUploadHistory = require("../models/SpreadsheetUploadHistory");
const emailService = require("./emailService");
const auditService = require("./auditService");
const logger = require("../utils/logger");

class SpreadsheetService {
  /**
   * Process Student Spreadsheet Upload (.xlsx / .csv)
   */
  async processStudentUpload(fileBuffer, fileName, uploadedByUserId, role = "admin") {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    let createdCount = 0;
    let skippedCount = 0;
    let emailSentCount = 0;
    const errors = [];
    const createdUsersForEmail = [];

    const defaultDept = await Department.findOne({ code: "CSE" });
    const defaultYear = await AcademicYear.findOne({ name: "1st Year" });
    const defaultSec = await Section.findOne({ name: "A" });
    const defaultClass = await ClassRoom.findOne({ code: "CSE-1-A" });

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2; // 1-indexed header + 1

      const studentId = String(row["Register Number"] || row["RegisterNo"] || row["studentId"] || "").trim();
      const name = String(row["Student Name"] || row["Name"] || row["name"] || "").trim();
      const email = String(row["Email"] || row["email"] || "").trim().toLowerCase();
      const deptName = String(row["Department"] || row["department"] || "").trim();
      const yearName = String(row["Year"] || row["year"] || "").trim();
      const secName = String(row["Section"] || row["section"] || "").trim();

      if (!studentId || !name || !email) {
        skippedCount++;
        errors.push({ row: rowNum, identifier: studentId || email || `Row ${rowNum}`, reason: "Missing required fields (Register Number, Name, or Email)" });
        continue;
      }

      // Check existing user by email or studentId
      const existingUser = await User.findOne({
        $or: [{ email }, { studentId }],
      });

      if (existingUser) {
        skippedCount++;
        errors.push({ row: rowNum, identifier: studentId, reason: `Account with Register No (${studentId}) or Email (${email}) already exists` });
        continue;
      }

      // Resolve department / year / section if provided
      let deptObj = defaultDept;
      if (deptName) {
        const found = await Department.findOne({ $or: [{ name: new RegExp(deptName, "i") }, { code: new RegExp(deptName, "i") }] });
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

      // Generate secure random temporary password e.g. Temp@<randomHex6>
      const tempPassword = `Temp@${crypto.randomBytes(3).toString("hex")}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const classCode = deptObj && yearObj && secObj ? `${deptObj.code}-${yearObj.name.charAt(0)}-${secObj.name}` : "CSE-1-A";

      const newUser = await User.create({
        name,
        email,
        studentId,
        password: hashedPassword,
        role: "student",
        institutionId: "KSRCE",
        departmentId: deptObj ? deptObj._id : null,
        academicYearId: yearObj ? yearObj._id : null,
        sectionId: secObj ? secObj._id : null,
        classRoomId: defaultClass ? defaultClass._id : null,
        classId: classCode,
        mustChangePassword: true,
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

    // Deliver credentials emails
    for (const studentData of createdUsersForEmail) {
      try {
        await emailService.sendDeveloperCredentialRoster({
          students: [studentData],
        });
        emailSentCount++;
      } catch (err) {
        logger.error(`Failed to send credential email to ${studentData.email}: ${err.message}`);
      }
    }

    // Record upload history
    const history = await SpreadsheetUploadHistory.create({
      uploadedBy: uploadedByUserId,
      fileName,
      uploadType: "student",
      totalRows: rawRows.length,
      createdCount,
      skippedCount,
      emailSentCount,
      errors,
      institutionId: "KSRCE",
    });

    await auditService.logAction(
      uploadedByUserId,
      role,
      "spreadsheet.upload.student",
      { type: "spreadsheet", id: history._id },
      { fileName, createdCount, skippedCount, emailSentCount }
    );

    return {
      historyId: history._id,
      totalRows: rawRows.length,
      createdCount,
      skippedCount,
      emailSentCount,
      errors,
    };
  }

  /**
   * Process Staff Spreadsheet Upload (.xlsx / .csv)
   */
  async processStaffUpload(fileBuffer, fileName, uploadedByUserId, role = "admin") {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    let createdCount = 0;
    let skippedCount = 0;
    let emailSentCount = 0;
    const errors = [];
    const createdUsersForEmail = [];

    const defaultDept = await Department.findOne({ code: "CSE" });

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      const rowNum = index + 2;

      const employeeId = String(row["Staff ID"] || row["EmployeeID"] || row["employeeId"] || "").trim();
      const name = String(row["Name"] || row["Staff Name"] || row["name"] || "").trim();
      const email = String(row["Email"] || row["email"] || "").trim().toLowerCase();
      const deptName = String(row["Department"] || row["department"] || "").trim();

      if (!employeeId || !name || !email) {
        skippedCount++;
        errors.push({ row: rowNum, identifier: employeeId || email || `Row ${rowNum}`, reason: "Missing required fields (Staff ID, Name, or Email)" });
        continue;
      }

      const existingUser = await User.findOne({
        $or: [{ email }, { employeeId }],
      });

      if (existingUser) {
        skippedCount++;
        errors.push({ row: rowNum, identifier: employeeId, reason: `Staff account with Staff ID (${employeeId}) or Email (${email}) already exists` });
        continue;
      }

      let deptObj = defaultDept;
      if (deptName) {
        const found = await Department.findOne({ $or: [{ name: new RegExp(deptName, "i") }, { code: new RegExp(deptName, "i") }] });
        if (found) deptObj = found;
      }

      const tempPassword = `Temp@${crypto.randomBytes(3).toString("hex")}`;
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
        await emailService.sendDeveloperCredentialRoster({
          staff: staffItem,
        });
        emailSentCount++;
      } catch (err) {
        logger.error(`Failed to send credential email to ${staffItem.email}: ${err.message}`);
      }
    }

    const history = await SpreadsheetUploadHistory.create({
      uploadedBy: uploadedByUserId,
      fileName,
      uploadType: "staff",
      totalRows: rawRows.length,
      createdCount,
      skippedCount,
      emailSentCount,
      errors,
      institutionId: "KSRCE",
    });

    await auditService.logAction(
      uploadedByUserId,
      role,
      "spreadsheet.upload.staff",
      { type: "spreadsheet", id: history._id },
      { fileName, createdCount, skippedCount, emailSentCount }
    );

    return {
      historyId: history._id,
      totalRows: rawRows.length,
      createdCount,
      skippedCount,
      emailSentCount,
      errors,
    };
  }
}

module.exports = new SpreadsheetService();
