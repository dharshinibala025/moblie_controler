const mongoose = require("mongoose");

const scanHistorySchema = new mongoose.Schema(
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
    rawAppCount: {
      type: Number,
      required: true,
    },
    socialAppCount: {
      type: Number,
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

scanHistorySchema.index({ studentId: 1, scannedAt: -1 });

module.exports = mongoose.model("ScanHistory", scanHistorySchema);
