const mongoose = require("mongoose");

const staffAssignmentSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassRoom",
      required: true,
    },
    institutionId: {
      type: String,
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

staffAssignmentSchema.index({ staffId: 1, classId: 1 }, { unique: true });
staffAssignmentSchema.index({ classId: 1, isActive: 1 });
staffAssignmentSchema.index({ institutionId: 1 });

module.exports = mongoose.model("StaffAssignment", staffAssignmentSchema);
