const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const usageService = require("../services/usageService");
const User = require("../models/User");
const Device = require("../models/Device");
const logger = require("../utils/logger");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("staff"));

const verifyClassScope = async (req, res, next) => {
  const classId = req.params.id || req.query.classId;
  if (classId && req.user.classId !== classId) {
    return res.status(403).json({ error: "Access denied: different class scope" });
  }
  next();
};

router.get("/classes/:id/live", verifyClassScope, async (req, res, next) => {
  try {
    const students = await User.find({
      classId: req.params.id,
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
          ? (Date.now() - new Date(device.lastSyncAt).getTime()) < 2 * 60 * 1000
          : false,
        lastSyncAt: device ? device.lastSyncAt : null,
        deviceStatus: device ? device.status : "unknown",
      };
    });

    res.json({
      classId: req.params.id,
      students: liveData,
      totalStudents: liveData.length,
      onlineStudents: liveData.filter((s) => s.isOnline).length,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/classes/:id/activity", verifyClassScope, async (req, res, next) => {
  try {
    const { startDate, endDate, studentId } = req.query;

    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await User.findOne({
        classId: req.params.id,
        role: "student",
      }).select("_id");
      targetStudentId = student ? student._id : null;
    }

    if (!targetStudentId) {
      return res.json({ activity: [] });
    }

    const activity = await usageService.getUsageByStudent(
      targetStudentId,
      startDate,
      endDate
    );

    res.json({ activity, classId: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
