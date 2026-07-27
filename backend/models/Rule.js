const mongoose = require("mongoose");

const ruleSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockedApps: [
      {
        type: String,
        required: true,
      },
    ],
    scheduleStart: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    scheduleEnd: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    activeDays: [
      {
        type: String,
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
    ],
    targetClassId: {
      type: String,
      required: true,
    },
    targetScope: {
      type: {
        type: String,
        enum: ["student", "class", "department", "year", "institution"],
        default: "class",
      },
      targetId: {
        type: String,
        default: null,
      },
    },
    reason: {
      type: String,
      default: "",
    },
    version: {
      type: Number,
      default: 1,
    },
    policyVersion: {
      type: Number,
      default: 1,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    institutionId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "stopped"],
      default: "draft",
    },
  },
  { timestamps: true }
);

ruleSchema.index({ targetClassId: 1, status: 1 });
ruleSchema.index({ createdBy: 1 });
ruleSchema.index({ institutionId: 1 });

module.exports = mongoose.model("Rule", ruleSchema);
