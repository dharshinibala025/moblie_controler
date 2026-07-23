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
  
  if (filters.actorId && filters.institutionId) {
    const User = require("../models/User");
    const actors = await User.find({ 
      institutionId: filters.institutionId,
      _id: filters.actorId 
    }).select("_id");
    query.actorId = { $in: actors.map((a) => a._id) };
  } else if (filters.institutionId) {
    const User = require("../models/User");
    const actors = await User.find({ institutionId: filters.institutionId }).select("_id");
    query.actorId = { $in: actors.map((a) => a._id) };
  } else if (filters.actorId) {
    query.actorId = filters.actorId;
  }

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
