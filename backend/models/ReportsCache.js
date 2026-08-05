const mongoose = require("mongoose");

const reportsCacheSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      required: true,
    },
    institutionId: {
      type: String,
      default: null,
    },
    periodType: {
      type: String,
      enum: ["daily", "weekly"],
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    activeStudents: {
      type: Number,
      default: 0,
    },
    totalUsageMs: {
      type: Number,
      default: 0,
    },
    topApps: [
      {
        packageName: String,
        totalDurationMs: Number,
        uniqueStudents: Number,
      },
    ],
    blockedAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

reportsCacheSchema.index({ classId: 1, periodType: 1, periodStart: -1 });
reportsCacheSchema.index({ institutionId: 1, periodType: 1 });

module.exports = mongoose.model("ReportsCache", reportsCacheSchema);
