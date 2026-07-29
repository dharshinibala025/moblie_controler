const xlsx = require("xlsx");
const User = require("../models/User");
const Device = require("../models/Device");
const BlockedAttempt = require("../models/BlockedAttempt");

class ExportService {
  async exportStudentsToExcel() {
    const students = await User.find({ role: "student" })
      .populate("departmentId", "code name")
      .populate("academicYearId", "name")
      .populate("sectionId", "name")
      .sort({ name: 1 });

    const rows = students.map((s, idx) => ({
      SNo: idx + 1,
      RegisterNumber: s.studentId || "N/A",
      StudentName: s.name,
      Email: s.email,
      Department: s.departmentId ? s.departmentId.code : "CSE",
      Year: s.academicYearId ? s.academicYearId.name : "1st Year",
      Section: s.sectionId ? s.sectionId.name : "A",
      ClassId: s.classId || "CSE-1-A",
      AccountStatus: s.active ? "Active" : "Disabled",
      CreatedDate: s.createdAt ? s.createdAt.toISOString().split("T")[0] : "",
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Students");

    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  async exportStaffToExcel() {
    const staffMembers = await User.find({ role: "staff" })
      .populate("departmentId", "name code")
      .sort({ name: 1 });

    const rows = staffMembers.map((s, idx) => ({
      SNo: idx + 1,
      EmployeeID: s.employeeId || "N/A",
      StaffName: s.name,
      Email: s.email,
      Department: s.departmentId ? s.departmentId.name : "Computer Science",
      ClassId: s.classId || "CSE-1-A",
      AccountStatus: s.active ? "Active" : "Disabled",
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Staff");

    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  async exportDevicesToExcel() {
    const devices = await Device.find()
      .populate("userId", "name role studentId employeeId email")
      .sort({ updatedAt: -1 });

    const rows = devices.map((d, idx) => ({
      SNo: idx + 1,
      DeviceHardwareID: d.deviceId,
      User: d.userId ? d.userId.name : "Unassigned",
      UserRole: d.userId ? d.userId.role : "student",
      Manufacturer: d.manufacturer || "Android",
      Model: d.deviceModel || "Smartphone",
      OSVersion: d.osVersion || "14",
      DeviceStatus: d.status,
      LastSeen: d.lastSeenAt ? d.lastSeenAt.toISOString() : "",
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Devices");

    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  async exportBlockedAttemptsToExcel() {
    const attempts = await BlockedAttempt.find()
      .populate("studentId", "name studentId email classId")
      .sort({ attemptedAt: -1, createdAt: -1 })
      .limit(1000);

    const rows = attempts.map((a, idx) => ({
      SNo: idx + 1,
      StudentName: a.studentId ? a.studentId.name : "Student",
      RegisterNumber: a.studentId ? a.studentId.studentId : "N/A",
      PackageName: a.packageName,
      Reason: a.reason || "Restricted during class hours (09:00 AM - 04:00 PM)",
      Timestamp: a.attemptedAt || a.createdAt,
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Blocked_Attempts");

    return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}

module.exports = new ExportService();
