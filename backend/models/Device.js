const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    deviceFingerprint: {
      type: String,
      default: null,
    },
    deviceInfo: {
      platform: { type: String, default: null },
      osVersion: { type: String, default: null },
      appVersion: { type: String, default: null },
      deviceModel: { type: String, default: null },
      deviceId: { type: String, default: null },
      accessibilityEnabled: { type: Boolean, default: false },
      overlayEnabled: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["online", "offline", "blocked", "revoked"],
      default: "offline",
    },
    lastKnownCommand: {
      ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "Rule", default: null },
      action: { type: String, default: null },
      serverTimestamp: { type: Date, default: null },
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    isCompliant: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

deviceSchema.index({ userId: 1, deviceFingerprint: 1 }, { unique: true, sparse: true });
deviceSchema.index({ userId: 1 });
deviceSchema.index({ fcmToken: 1 });
deviceSchema.index({ status: 1 });

module.exports = mongoose.model("Device", deviceSchema);
