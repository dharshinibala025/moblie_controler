const User = require("../models/User");
const Device = require("../models/Device");
const usageService = require("./usageService");

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

class ClassService {
  async getClassLiveStatus(classId) {
    const students = await User.find({
      classId,
      role: "student",
    }).select("name email");

    const studentIds = students.map((s) => s._id);

    const devices = await Device.find({
      userId: { $in: studentIds },
    }).select("userId status lastSyncAt fcmToken");

    const deviceMap = new Map(
      devices.map((d) => [d.userId.toString(), d])
    );

    const liveData = students.map((student) => {
      const device = deviceMap.get(student._id.toString());
      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        isOnline: device && device.lastSyncAt
          ? (Date.now() - new Date(device.lastSyncAt).getTime()) < ONLINE_THRESHOLD_MS
          : false,
        lastSyncAt: device ? device.lastSyncAt : null,
        deviceStatus: device ? device.status : "unknown",
      };
    });

    return {
      classId,
      students: liveData,
      totalStudents: liveData.length,
      onlineStudents: liveData.filter((s) => s.isOnline).length,
    };
  }

  async resolveStudentForClass(classId, studentId) {
    if (studentId) return studentId;
    const student = await User.findOne({
      classId,
      role: "student",
    }).select("_id");
    return student ? student._id : null;
  }

  async getStudentActivity(classId, studentId, startDate, endDate) {
    const targetStudentId = await this.resolveStudentForClass(classId, studentId);
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