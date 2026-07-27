const mongoose = require("mongoose");

const scannedAppSchema = new mongoose.Schema(
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
      required: true,
    },
    category: {
      type: String,
      enum: [
        "social",
        "entertainment",
        "games",
        "educational",
        "productivity",
        "utilities",
        "uncategorized",
      ],
      default: "uncategorized",
    },
    versionName: {
      type: String,
      default: "1.0.0",
    },
    isUserFacing: {
      type: Boolean,
      default: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    removedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

scannedAppSchema.index({ studentId: 1 });
scannedAppSchema.index({ studentId: 1, packageName: 1 });
scannedAppSchema.index({ packageName: 1 });

module.exports = mongoose.model("ScannedApp", scannedAppSchema);
