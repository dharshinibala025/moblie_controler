const mongoose = require("mongoose");

const usageLogSchema = new mongoose.Schema(
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
    durationMs: {
      type: Number,
      required: true,
      min: 0,
    },
    wasBlockedAttempt: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

usageLogSchema.index({ studentId: 1, timestamp: -1 });
usageLogSchema.index({ studentId: 1, packageName: 1, timestamp: -1 });
usageLogSchema.index({ timestamp: -1 }, { expireAfterSeconds: 7776000 });
usageLogSchema.index({ deviceId: 1 });

module.exports = mongoose.model("UsageLog", usageLogSchema);
