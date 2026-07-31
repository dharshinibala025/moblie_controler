const Joi = require("joi");

const schemas = {
  login: Joi.object({
    email: Joi.string().trim().required(),
    password: Joi.string().min(4).required(),
    role: Joi.string().optional(),
  }),

  createStudent: Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    studentId: Joi.string().required(),
    classId: Joi.string().required(),
    tempPassword: Joi.string().min(8).required(),
  }),

  createStaff: Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    employeeId: Joi.string().required(),
    classIds: Joi.array().items(Joi.string()).min(1).required(),
    tempPassword: Joi.string().min(8).required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().min(6).allow(null, ""),
    newPassword: Joi.string().min(8).required(),
    tempToken: Joi.string().allow(null, ""),
  }),

  registerDevice: Joi.object({
    fcmToken: Joi.string().required(),
    deviceInfo: Joi.object({
      platform: Joi.string().valid("android", "ios").default("android"),
      osVersion: Joi.string().allow(null, "").default(""),
      appVersion: Joi.string().allow(null, "").default(""),
      deviceModel: Joi.string().allow(null, "").default(""),
      deviceId: Joi.string().default("default-device-id"),
    }).default({ platform: "android", deviceId: "default-device-id" }),
  }),

  scanApps: Joi.object({
    apps: Joi.array()
      .items(
        Joi.object({
          packageName: Joi.string().required(),
          appName: Joi.string().required(),
        })
      )
      .min(1)
      .required(),
  }),

  usageLogs: Joi.object({
    logs: Joi.array()
      .items(
        Joi.object({
          packageName: Joi.string().required(),
          durationMs: Joi.number().integer().min(0).required(),
          wasBlockedAttempt: Joi.boolean().default(false),
          timestamp: Joi.date().iso(),
        })
      )
      .min(1)
      .required(),
  }),

  commandAck: Joi.object({
    ruleId: Joi.string().required(),
    receivedAt: Joi.date().iso().required(),
    appliedAt: Joi.date().iso().required(),
    tamperDetected: Joi.boolean().default(false),
    tamperDetails: Joi.object().allow(null),
  }),

  createRule: Joi.object({
    blockedApps: Joi.array().items(Joi.string()).min(1).required(),
    scheduleStart: Joi.string()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .required(),
    scheduleEnd: Joi.string()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .required(),
    activeDays: Joi.array()
      .items(Joi.string().valid("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
      .min(1)
      .required(),
    targetClassId: Joi.string().required(),
    targetScope: Joi.object({
      type: Joi.string().valid("student", "class", "department", "institution").default("class"),
      targetId: Joi.string().allow(null, ""),
    }).optional(),
    reason: Joi.string().allow("").optional(),
    status: Joi.string().valid("draft", "active", "paused", "stopped").default("draft"),
  }),

  updateRule: Joi.object({
    blockedApps: Joi.array().items(Joi.string()).min(1),
    scheduleStart: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
    scheduleEnd: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
    activeDays: Joi.array()
      .items(Joi.string().valid("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
      .min(1),
    targetClassId: Joi.string(),
    targetScope: Joi.object({
      type: Joi.string().valid("student", "class", "department", "institution"),
      targetId: Joi.string().allow(null, ""),
    }).optional(),
    reason: Joi.string().allow("").optional(),
    status: Joi.string().valid("draft", "active", "paused", "stopped"),
  }).min(1),

  commandBody: Joi.object({
    action: Joi.string().valid("start", "pause", "stop").required(),
  }),

  updateCatalog: Joi.object({
    category: Joi.string().valid(
      "social",
      "entertainment",
      "games",
      "educational",
      "productivity",
      "utilities",
      "uncategorized"
    ),
    isDangerous: Joi.boolean(),
  }).min(1),

  createDepartment: Joi.object({
    name: Joi.string().max(200).required(),
    code: Joi.string().max(10).required(),
    institutionId: Joi.string().default("KSRCE"),
  }),

  createAcademicYear: Joi.object({
    name: Joi.string().max(50).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
    institutionId: Joi.string().default("KSRCE"),
  }),

  createSection: Joi.object({
    name: Joi.string().max(50).required(),
    departmentId: Joi.string().required(),
    academicYearId: Joi.string().required(),
    institutionId: Joi.string().default("KSRCE"),
  }),

  createClassRoom: Joi.object({
    name: Joi.string().max(100).required(),
    code: Joi.string().max(50).required(),
    departmentId: Joi.string().required(),
    sectionId: Joi.string().required(),
    academicYearId: Joi.string().required(),
    institutionId: Joi.string().default("KSRCE"),
  }),

  assignStaff: Joi.object({
    staffId: Joi.string().required(),
    classIds: Joi.array().items(Joi.string()).min(1).required(),
  }),

  forceOffline: Joi.object({
    reason: Joi.string().max(500).allow(null, ""),
  }),

  suspendUser: Joi.object({
    reason: Joi.string().max(500).allow(null, ""),
  }),
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Unknown validation schema: ${schemaName}`));
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({ error: "Validation failed", details });
    }

    req.body = value;
    next();
  };
};

module.exports = { validate, schemas };
