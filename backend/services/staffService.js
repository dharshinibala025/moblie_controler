const User = require("../models/User");
const StaffAssignment = require("../models/StaffAssignment");
const auditService = require("./auditService");
const { ConflictError } = require("../utils/AppError");

class StaffService {
  async createStaff(staffData, userId, role, scopeInstitutionId) {
    const { name, email, tempPassword, classIds, institutionId } = staffData;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      password: tempPassword,
      role: "staff",
      classId: classIds && classIds.length > 0 ? classIds[0] : null,
      institutionId: institutionId || scopeInstitutionId,
      mustChangePassword: true,
      hasSetPassword: true,
      hasAcceptedTerms: false,
      status: "active",
      isActive: true,
    });

    if (classIds && classIds.length > 0) {
      for (const classId of classIds) {
        await StaffAssignment.findOneAndUpdate(
          { staffId: staff._id, classId },
          { staffId: staff._id, classId, institutionId: institutionId || scopeInstitutionId, assignedBy: userId, isActive: true },
          { upsert: true, new: true }
        );
      }
    }

    await auditService.logAction(
      userId,
      role,
      "staff.create",
      { type: "user", id: staff._id },
      { name, email, classIds }
    );
    return staff;
  }

  async getStaffClasses(staffId) {
    const assignments = await StaffAssignment.find({ staffId, isActive: true })
      .populate("classId", "name code");
    return assignments.map((a) => a.classId);
  }
}

module.exports = new StaffService();
