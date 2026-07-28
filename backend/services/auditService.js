const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

exports.logAction = async (actorId, actorRole, action, target, details = null, institutionId = null) => {
  try {
    const entry = await AuditLog.create({
      actorId,
      actorRole,
      action,
      target,
      details,
      institutionId,
    });
    return entry;
  } catch (err) {
    logger.error(`Audit log write failed: ${err.message}`);
    return null;
  }
};

exports.getAuditLog = async (filters = {}) => {
  const query = {};
  if (filters.action) query.action = filters.action;
  if (filters.institutionId) query.institutionId = filters.institutionId;
  if (filters.actorId) query.actorId = filters.actorId;

  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate("actorId", "name email role")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
