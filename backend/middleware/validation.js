const Joi = require("joi");

const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  registerStaff: Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    classId: Joi.string().required(),
    institutionId: Joi.string().allow(null),
  }),

  registerDevice: Joi.object({
    fcmToken: Joi.string().required(),
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
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Unknown validation schema: ${schemaName}`));
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
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
