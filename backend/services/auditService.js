const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

exports.logAction = async (actorId, actorRole, action, target, details = null) => {
  try {
    const entry = await AuditLog.create({
      actorId,
      actorRole,
      action,
      target,
      details,
      timestamp: new Date(),
    });
    return entry;
  } catch (err) {
    logger.error(`Audit log write failed: ${err.message}`);
    return null;
  }
};

exports.getAuditLog = async (filters = {}) => {
  const query = {};
  if (filters.actorId) query.actorId = filters.actorId;
  if (filters.action) query.action = filters.action;
  if (filters.institutionId) {
    const User = require("../models/User");
    const actors = await User.find({ institutionId: filters.institutionId }).select("_id");
    query.actorId = { $in: actors.map((a) => a._id) };
  }

  return AuditLog.find(query)
    .populate("actorId", "name email role")
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100);
};
