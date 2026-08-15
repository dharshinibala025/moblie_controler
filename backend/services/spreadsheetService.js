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
    const oldStudentList = await User.find({ role: "student" }).select("_id email studentId");
    const oldStudentIds = oldStudentList.map((s) => s._id);
    if (oldStudentIds.length > 0) {
      await Promise.all([
        User.deleteMany({ _id: { $in: oldStudentIds } }),
        Device.deleteMany({ userId: { $in: oldStudentIds } }),
        ScannedApp.deleteMany({ studentId: { $in: oldStudentIds } }),
        UsageLog.deleteMany({ studentId: { $in: oldStudentIds } }),
        BlockedAttempt.deleteMany({ studentId: { $in: oldStudentIds } }),
        Notification.deleteMany({ studentId: { $in: oldStudentIds } }),
      ]);
    }

    // Pre-fetch all existing departments, years, sections, classrooms into memory maps
    const allDepts = await Department.find({ institutionId: "KSRCE" });
    const deptMap = new Map();
    allDepts.forEach((d) => {
      deptMap.set(d.code.toUpperCase(), d);
      deptMap.set(d.name.toLowerCase(), d);
    });

    const allYears = await AcademicYear.find({ institutionId: "KSRCE" });
    const yearMap = new Map();
    allYears.forEach((y) => yearMap.set(y.name.toLowerCase(), y));

    const allSections = await Section.find({ institutionId: "KSRCE" });
    const sectionMap = new Map();
    allSections.forEach((s) => sectionMap.set(`${s.name.toUpperCase()}_${s.academicYearId || ''}`, s));

    const allClassrooms = await ClassRoom.find({ institutionId: "KSRCE" });
    const classroomMap = new Map();
    allClassrooms.forEach((c) => classroomMap.set(c.code, c));

    // Pre-fetch existing non-student user emails/IDs to prevent collisions
    const existingUsers = await User.find({}, "email studentId");
    const existingEmailsSet = new Set(existingUsers.map((u) => u.email));
    const existingIdsSet = new Set(existingUsers.map((u) => u.studentId).filter(Boolean));

    const usersToInsert = [];
    const saltRounds = process.env.NODE_ENV === "test" ? 1 : 10;

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
      if (existingEmailsSet.has(email) || existingIdsSet.has(studentId)) {
        duplicateCount++;
        errors.push({
          row: rowNum,
          identifier: studentId,
          reason: `Duplicate student ignored (Account with Register No '${studentId}' or Email '${email}' already exists)`,
        });
        continue;
      }

      existingEmailsSet.add(email);
      existingIdsSet.add(studentId);

      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
      const tempPassword = `STU-${randomSuffix}`;
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days Expiry

      // Resolve department / year / section using pre-fetched Maps or create if missing
      let deptObj = deptName ? (deptMap.get(deptName.toUpperCase()) || deptMap.get(deptName.toLowerCase())) : deptMap.get("CSE");
      if (!deptObj) {
        const codeStr = (deptName || "CSE").toUpperCase();
        deptObj = await Department.create({
          name: deptName || "Computer Science and Engineering",
          code: codeStr,
          institutionId: "KSRCE",
        });
        deptMap.set(codeStr, deptObj);
      }

      const targetYearName = yearName ? (yearName.toLowerCase().includes("year") ? yearName : `${yearName} Year`) : "";
      let yearObj = targetYearName ? yearMap.get(targetYearName.toLowerCase()) : null;
      if (!yearObj && targetYearName) {
        yearObj = await AcademicYear.create({
          name: targetYearName,
          startDate: new Date("2025-06-01"),
          endDate: new Date("2026-04-30"),
          institutionId: "KSRCE",
        });
        yearMap.set(targetYearName.toLowerCase(), yearObj);
      }

      const secKey = secName ? `${secName.toUpperCase()}_${yearObj ? yearObj._id : ''}` : "";
      let secObj = secName ? sectionMap.get(secKey) : null;
      if (!secObj && secName) {
        secObj = await Section.create({
          name: secName.toUpperCase(),
          departmentId: deptObj ? deptObj._id : null,
          academicYearId: yearObj ? yearObj._id : null,
          institutionId: "KSRCE",
        });
        sectionMap.set(secKey, secObj);
      }

      const classCode = deptObj
        ? `${deptObj.code}-${yearObj ? yearObj.name.charAt(0) : "1"}-${secObj ? secObj.name : "A"}`
        : `${yearObj ? yearObj.name.replace(/\s+Year/i, "") : "1"}-${secObj ? secObj.name : "A"}`;

      let classroomObj = classroomMap.get(classCode);
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
        classroomMap.set(classCode, classroomObj);
      }

      usersToInsert.push({
        userData: {
          name,
          email,
          studentId,
          phone,
          plainPassword: tempPassword,
          role: "student",
          institutionId: "KSRCE",
          departmentId: deptObj ? deptObj._id : null,
          academicYearId: yearObj ? yearObj._id : null,
          sectionId: secObj ? secObj._id : null,
          classRoomId: classroomObj ? classroomObj._id : null,
          classId: classCode,
          mustChangePassword: true,
          passwordExpiresAt: expiryDate,
          isActive: true,
          status: "active",
          hasSetPassword: true,
        },
        tempPassword,
      });
    }

    // Parallel password hashing for fast batch insert
    const usersToCreateDoc = await Promise.all(
      usersToInsert.map(async (item) => {
        const hashedPassword = await bcrypt.hash(item.userData.plainPassword, saltRounds);
        const doc = { ...item.userData, password: hashedPassword };
        delete doc.plainPassword;
        return doc;
      })
    );

    if (usersToCreateDoc.length > 0) {
      await User.insertMany(usersToCreateDoc, { ordered: false });
      createdCount = usersToCreateDoc.length;
    }

    // Queue email credentials in background
    const emailQueueEntries = usersToInsert.map((item) => ({
      recipientEmail: item.userData.email,
      recipientName: item.userData.name,
      studentId: item.userData.studentId,
      subject: "Welcome to Smart Classroom Portal — Temporary Login Credentials",
      htmlBody: emailService.buildCredentialEmailHtml({
        name: item.userData.name,
        toEmail: item.userData.email,
        regNo: item.userData.studentId,
        tempPassword: item.tempPassword,
        role: "student",
      }),
      tempPassword: item.tempPassword,
      role: "student",
      status: "pending",
    }));

    if (emailQueueEntries.length > 0) {
      const emailQueuedCount = await this._insertEmailQueueEntries(emailQueueEntries);
      emailSentCount = emailQueuedCount;
      emailFailedCount = emailQueueEntries.length - emailQueuedCount;

      // Trigger immediate email dispatch in background worker
      if (emailQueuedCount > 0) {
        const emailQueueWorker = require("../jobs/emailQueueWorker");
        emailQueueWorker.triggerImmediateProcessing();
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

    const credentialsRoster = usersToInsert.map((item) => ({
      studentId: item.userData.studentId,
      name: item.userData.name,
      email: item.userData.email,
      tempPassword: item.tempPassword,
    }));

    return {
      historyId: history ? history._id : null,
      totalRecords,
      createdCount,
      duplicateCount,
      failedCount,
      emailSentCount,
      emailQueuedCount: emailSentCount,
      emailFailedCount,
      emailConfigured: emailService.isEmailConfigured(),
      credentialsRoster,
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

    // Pre-fetch all existing departments, years, sections, classrooms into memory maps
    const allDepts = await Department.find({ institutionId: "KSRCE" });
    const deptMap = new Map();
    allDepts.forEach((d) => {
      deptMap.set(d.code.toUpperCase(), d);
      deptMap.set(d.name.toLowerCase(), d);
    });

    const allYears = await AcademicYear.find({ institutionId: "KSRCE" });
    const yearMap = new Map();
    allYears.forEach((y) => yearMap.set(y.name.toLowerCase(), y));

    const allSections = await Section.find({ institutionId: "KSRCE" });
    const sectionMap = new Map();
    allSections.forEach((s) => sectionMap.set(`${s.name.toUpperCase()}_${s.academicYearId || ''}`, s));

    const allClassrooms = await ClassRoom.find({ institutionId: "KSRCE" });
    const classroomMap = new Map();
    allClassrooms.forEach((c) => classroomMap.set(c.code, c));

    // Pre-fetch existing non-staff user emails/IDs to prevent collisions
    const existingUsers = await User.find({}, "email employeeId");
    const existingEmailsSet = new Set(existingUsers.map((u) => u.email));
    const existingEmpIdsSet = new Set(existingUsers.map((u) => u.employeeId).filter(Boolean));

    const staffToInsert = [];
    const saltRounds = process.env.NODE_ENV === "test" ? 1 : 10;

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

      if (existingEmailsSet.has(email) || existingEmpIdsSet.has(employeeId)) {
        duplicateCount++;
        errors.push({
          row: rowNum,
          identifier: employeeId,
          reason: `Duplicate staff ignored (Account with Staff ID '${employeeId}' or Email '${email}' already exists)`,
        });
        continue;
      }

      existingEmailsSet.add(email);
      existingEmpIdsSet.add(employeeId);

      let deptObj = deptName ? (deptMap.get(deptName.toUpperCase()) || deptMap.get(deptName.toLowerCase())) : deptMap.get("CSE");
      if (!deptObj) {
        const codeStr = (deptName || "CSE").toUpperCase();
        deptObj = await Department.create({
          name: deptName || "Computer Science and Engineering",
          code: codeStr,
          institutionId: "KSRCE",
        });
        deptMap.set(codeStr, deptObj);
      }

      const targetYearName = yearName ? (yearName.toLowerCase().includes("year") ? yearName : `${yearName} Year`) : "";
      let yearObj = targetYearName ? yearMap.get(targetYearName.toLowerCase()) : null;
      if (!yearObj && targetYearName) {
        yearObj = await AcademicYear.create({
          name: targetYearName,
          startDate: new Date("2025-06-01"),
          endDate: new Date("2026-04-30"),
          institutionId: "KSRCE",
        });
        yearMap.set(targetYearName.toLowerCase(), yearObj);
      }

      const secKey = secName ? `${secName.toUpperCase()}_${yearObj ? yearObj._id : ''}` : "";
      let secObj = secName ? sectionMap.get(secKey) : null;
      if (!secObj && secName) {
        secObj = await Section.create({
          name: secName.toUpperCase(),
          departmentId: deptObj ? deptObj._id : null,
          academicYearId: yearObj ? yearObj._id : null,
          institutionId: "KSRCE",
        });
        sectionMap.set(secKey, secObj);
      }

      const classCode = deptObj
        ? `${deptObj.code}-${yearObj ? yearObj.name.charAt(0) : "1"}-${secObj ? secObj.name : "A"}`
        : `${yearObj ? yearObj.name.replace(/\s+Year/i, "") : "1"}-${secObj ? secObj.name : "A"}`;

      let classroomObj = classroomMap.get(classCode);
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
        classroomMap.set(classCode, classroomObj);
      }

      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
      const tempPassword = `STF-${randomSuffix}`;

      staffToInsert.push({
        userData: {
          name,
          email,
          employeeId,
          plainPassword: tempPassword,
          role: "staff",
          institutionId: "KSRCE",
          departmentId: deptObj ? deptObj._id : null,
          academicYearId: yearObj ? yearObj._id : null,
          sectionId: secObj ? secObj._id : null,
          classRoomId: classroomObj ? classroomObj._id : null,
          classId: classCode,
          mustChangePassword: true,
          passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true,
          status: "active",
          hasSetPassword: true,
        },
        tempPassword,
        classroomObj,
      });
    }

    // Parallel password hashing for fast batch insert
    const staffDocsToCreate = await Promise.all(
      staffToInsert.map(async (item) => {
        const hashedPassword = await bcrypt.hash(item.userData.plainPassword, saltRounds);
        const doc = { ...item.userData, password: hashedPassword };
        delete doc.plainPassword;
        return doc;
      })
    );

    let createdStaffList = [];
    if (staffDocsToCreate.length > 0) {
      createdStaffList = await User.insertMany(staffDocsToCreate, { ordered: false });
      createdCount = createdStaffList.length;
    }

    // Bulk create staff assignments
    const assignmentsToInsert = [];
    createdStaffList.forEach((staffUser, idx) => {
      const originalObj = staffToInsert[idx];
      if (originalObj && originalObj.classroomObj) {
        assignmentsToInsert.push({
          staffId: staffUser._id,
          classId: originalObj.classroomObj._id,
          institutionId: "KSRCE",
          assignedBy: uploadedByUserId || staffUser._id,
          isActive: true,
        });
      }
    });

    if (assignmentsToInsert.length > 0) {
      await StaffAssignment.insertMany(assignmentsToInsert, { ordered: false }).catch(() => {});
    }

    // Queue email credentials in background
    const emailQueueEntries = staffToInsert.map((item) => ({
      recipientEmail: item.userData.email,
      recipientName: item.userData.name,
      studentId: item.userData.employeeId,
      subject: "Welcome to Smart Classroom Portal — Staff Login Credentials",
      htmlBody: emailService.buildCredentialEmailHtml({
        name: item.userData.name,
        toEmail: item.userData.email,
        regNo: item.userData.employeeId,
        tempPassword: item.tempPassword,
        role: "staff",
      }),
      tempPassword: item.tempPassword,
      role: "staff",
      status: "pending",
    }));

    if (emailQueueEntries.length > 0) {
      const emailQueuedCount = await this._insertEmailQueueEntries(emailQueueEntries);
      emailSentCount = emailQueuedCount;
      emailFailedCount = emailQueueEntries.length - emailQueuedCount;

      // Trigger immediate email dispatch in background worker
      if (emailQueuedCount > 0) {
        const emailQueueWorker = require("../jobs/emailQueueWorker");
        emailQueueWorker.triggerImmediateProcessing();
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

    await this._cleanupUnusedStructuralEntities();

    const credentialsRoster = staffToInsert.map((item) => ({
      employeeId: item.userData.employeeId,
      name: item.userData.name,
      email: item.userData.email,
      tempPassword: item.tempPassword,
    }));

    return {
      historyId: history ? history._id : null,
      totalRecords,
      createdCount,
      duplicateCount,
      failedCount,
      emailSentCount,
      emailQueuedCount: emailSentCount,
      emailFailedCount,
      emailConfigured: emailService.isEmailConfigured(),
      credentialsRoster,
      errors,
    };
  }

  /**
   * Inserts queued credential emails into EmailQueue, returning the number of rows
   * actually inserted. Never throws and never silently hides a full failure.
   */
  async _insertEmailQueueEntries(entries) {
    if (!entries || entries.length === 0) return 0;
    try {
      const inserted = await EmailQueue.insertMany(entries, { ordered: false });
      return (inserted || []).length;
    } catch (err) {
      const insertedCount = (err && (err.insertedCount || (err.result && err.result.nInserted))) || 0;
      const failedCount = entries.length - insertedCount;
      logger.warn(
        `Email queue insert partially failed: ${failedCount}/${entries.length} row(s) rejected. ${err.message}`
      );
      return insertedCount || 0;
    }
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
