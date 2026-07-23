const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.role === "admin" || this.hasSetPassword;
      },
      select: false,
    },
    hasSetPassword: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "staff", "student"],
      required: true,
    },
    studentId: {
      type: String,
      default: null,
    },
    employeeId: {
      type: String,
      default: null,
    },
    classId: {
      type: String,
      default: null,
    },
    classRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassRoom",
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    institutionId: {
      type: String,
      default: "KSRCE",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "disabled", "suspended"],
      default: "active",
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    hasAcceptedTerms: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ classId: 1 });
userSchema.index({ classId: 1, role: 1 });
userSchema.index({ institutionId: 1, role: 1 });
userSchema.index({ departmentId: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.hasSetPassword = true;
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
