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
    const Session = require("../models/Session");

    // Fetch active sessions for students
    const activeSessions = await Session.find({
      userId: { $in: studentIds },
      status: "active",
      expiresAt: { $gt: new Date() },
    });
    const activeUserSet = new Set(activeSessions.map((sess) => sess.userId.toString()));

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
      const isBlocked = device ? device.status === "blocked" : false;
      const isLoggedIn = activeUserSet.has(student._id.toString());

      const computedDeviceStatus = isBlocked ? "blocked" : isLoggedIn ? "Logged In" : "No Login";

      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        rollNo: student.studentId || "",
        isOnline: isLoggedIn || (device && device.lastSyncAt ? (Date.now() - new Date(device.lastSyncAt).getTime()) < ONLINE_THRESHOLD_MS : false),
        lastSyncAt: device ? device.lastSyncAt : null,
        deviceStatus: computedDeviceStatus,
        deviceModel: device ? (device.deviceInfo?.deviceModel || device.status) : "None",
        screenTime: isBlocked ? "Blocked" : isLoggedIn ? "Active" : "Offline",
        attempts: attemptsMap.get(student._id.toString()) || 0,
        accessibilityEnabled: device && device.deviceInfo ? device.deviceInfo.accessibilityEnabled !== false : false,
        overlayEnabled: device && device.deviceInfo ? device.deviceInfo.overlayEnabled !== false : false,
        hasDevice: !!device,
      };
    });

    const alerts = [];
    for (const student of liveData) {
      if (!student.hasDevice) {
        alerts.push({
          type: "warning",
          studentId: student.studentId,
          name: student.name,
          message: `${student.name} has not registered/logged into the app yet.`,
        });
      } else if (!student.accessibilityEnabled || !student.overlayEnabled) {
        alerts.push({
          type: "critical",
          studentId: student.studentId,
          name: student.name,
          message: `${student.name} has disabled ${
            !student.accessibilityEnabled ? "Accessibility" : "Overlay"
          } permissions!`,
        });
      }
    }

    return {
      classId,
      students: liveData,
      totalStudents: liveData.length,
      onlineStudents: liveData.filter((s) => s.isOnline).length,
      alerts,
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