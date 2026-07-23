const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["admin", "staff", "student", "system"],
      required: true,
    },
    action: {
      type: String,
      enum: [
        "rule.create",
        "rule.update",
        "rule.delete",
        "rule.command",
        "staff.create",
        "staff.update",
        "staff.delete",
        "catalog.update",
        "device.register",
        "device.update",
        "tamper.detected",
        "tamper.response",
        "auth.login",
        "auth.failed",
        "auth.logout",
        "student.register",
        "student.update",
        "student.delete",
      ],
      required: true,
    },
    target: {
      type: {
        type: String,
        enum: ["rule", "user", "device", "catalog", "auth", "student"],
      },
      id: { type: mongoose.Schema.Types.Mixed },
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
