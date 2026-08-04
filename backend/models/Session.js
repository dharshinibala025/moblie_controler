const mongoose = require("mongoose");
const crypto = require("crypto");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
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
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastRefreshAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ refreshTokenHash: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, createdAt: -1 });

sessionSchema.statics.hashRefreshToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

sessionSchema.statics.generateRefreshToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

sessionSchema.statics.generateDeviceFingerprint = function (deviceInfo) {
  const raw = `${deviceInfo.deviceId || ""}${deviceInfo.platform || ""}${deviceInfo.osVersion || ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
};

module.exports = mongoose.model("Session", sessionSchema);
