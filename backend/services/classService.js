const User = require("../models/User");
const Device = require("../models/Device");
const usageService = require("./usageService");

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

class ClassService {
  async getClassLiveStatus(classId, staffUserId = null) {
    const mongoose = require("mongoose");
    const query = { role: "student" };

    if (staffUserId) {
      const staffUser = await User.findById(staffUserId);
      if (staffUser) {
        if (staffUser.academicYearId && staffUser.sectionId) {
          if (staffUser.departmentId) query.departmentId = staffUser.departmentId;
          query.academicYearId = staffUser.academicYearId;
          query.sectionId = staffUser.sectionId;
        }
      }
    }

    if (mongoose.Types.ObjectId.isValid(classId)) {
      query.$or = [{ classRoomId: classId }, { classId: classId }];
    } else {
      query.classId = classId;
    }

    const students = await User.find(query).select("name email studentId");

    const studentIds = students.map((s) => s._id);

    const devices = await Device.find({
      userId: { $in: studentIds },
    }).select("userId status lastSyncAt fcmToken deviceModel screenTime");

    const deviceMap = new Map(
      devices.map((d) => [d.userId.toString(), d])
    );

    const BlockedAttempt = require("../models/BlockedAttempt");

    // Fetch attempts count for each student in a single aggregation query
    const attemptsMap = new Map();
    const attemptsData = await BlockedAttempt.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: "$studentId", count: { $sum: 1 } } }
    ]);
    attemptsData.forEach((item) => {
      attemptsMap.set(item._id.toString(), item.count);
    });

    const liveData = students.map((student) => {
      const device = deviceMap.get(student._id.toString());
      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        rollNo: student.studentId || "",
        isOnline: device && device.lastSyncAt
          ? (Date.now() - new Date(device.lastSyncAt).getTime()) < ONLINE_THRESHOLD_MS
          : false,
        lastSyncAt: device ? device.lastSyncAt : null,
        deviceStatus: device ? device.status : "unknown",
        deviceModel: device ? (device.deviceInfo?.deviceModel || device.status) : "None",
        screenTime: device ? (device.status === 'blocked' ? "Blocked" : "Active") : "Offline", // Screen time placeholder or derived
        attempts: attemptsMap.get(student._id.toString()) || 0,
      };
    });

    return {
      classId,
      students: liveData,
      totalStudents: liveData.length,
      onlineStudents: liveData.filter((s) => s.isOnline).length,
    };
  }

  async resolveStudentForClass(classId, studentId, staffUserId = null) {
    if (studentId) {
      // Validate that student actually belongs to staff scope if staffUserId is passed
      const query = { _id: studentId, role: "student" };
      if (staffUserId) {
        const staffUser = await User.findById(staffUserId);
        if (staffUser) {
          if (staffUser.academicYearId && staffUser.sectionId) {
            if (staffUser.departmentId) query.departmentId = staffUser.departmentId;
            query.academicYearId = staffUser.academicYearId;
            query.sectionId = staffUser.sectionId;
          }
        }
      }
      const exists = await User.exists(query);
      return exists ? studentId : null;
    }

    const mongoose = require("mongoose");
    const query = { role: "student" };

    if (staffUserId) {
      const staffUser = await User.findById(staffUserId);
      if (staffUser) {
        if (staffUser.academicYearId && staffUser.sectionId) {
          if (staffUser.departmentId) query.departmentId = staffUser.departmentId;
          query.academicYearId = staffUser.academicYearId;
          query.sectionId = staffUser.sectionId;
        }
      }
    }

    if (mongoose.Types.ObjectId.isValid(classId)) {
      query.$or = [{ classRoomId: classId }, { classId: classId }];
    } else {
      query.classId = classId;
    }
    const student = await User.findOne(query).select("_id");
    return student ? student._id : null;
  }

  async getStudentActivity(classId, studentId, startDate, endDate, staffUserId = null) {
    const targetStudentId = await this.resolveStudentForClass(classId, studentId, staffUserId);
    if (!targetStudentId) {
      return { activity: [], classId };
    }
    const activity = await usageService.getUsageByStudent(
      targetStudentId,
      startDate,
      endDate
    );
    return { activity, classId };
  }
}

module.exports = new ClassService();