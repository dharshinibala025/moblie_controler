const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    maxStudents: {
      type: Number,
      default: 500,
    },
    maxStaff: {
      type: Number,
      default: 50,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    settings: {
      enforce2FA: { type: Boolean, default: false },
      passwordMinLength: { type: Number, default: 8 },
      consentVersion: { type: String, default: "1.0" },
      lockoutAttempts: { type: Number, default: 5 },
      lockoutDurationMin: { type: Number, default: 15 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Institution", institutionSchema);
