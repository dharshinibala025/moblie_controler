const mongoose = require("mongoose");

const blockedAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    packageName: {
      type: String,
      required: true,
    },
    appName: {
      type: String,
      default: "",
    },
    policyVersion: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
      default: "",
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

blockedAttemptSchema.index({ studentId: 1, attemptedAt: -1 });

module.exports = mongoose.model("BlockedAttempt", blockedAttemptSchema);
