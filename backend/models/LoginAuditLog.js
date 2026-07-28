const mongoose = require("mongoose");

const loginAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "staff", "student", null],
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      enum: [
        "login.success",
        "login.failed",
        "login.locked",
        "login.role_mismatch",
        "password.change",
        "password.change.failed",
        "2fa.verify",
        "2fa.verify.failed",
        "consent.accept",
      ],
      required: true,
    },
    institutionId: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

loginAuditLogSchema.index({ userId: 1, createdAt: -1 });
loginAuditLogSchema.index({ email: 1, createdAt: -1 });
loginAuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("LoginAuditLog", loginAuditLogSchema);
