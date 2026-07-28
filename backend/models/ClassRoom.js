const mongoose = require("mongoose");

const classRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    institutionId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classRoomSchema.index({ code: 1, institutionId: 1 }, { unique: true });
classRoomSchema.index({ departmentId: 1 });
classRoomSchema.index({ sectionId: 1 });
classRoomSchema.index({ academicYearId: 1 });
classRoomSchema.index({ institutionId: 1 });

module.exports = mongoose.model("ClassRoom", classRoomSchema);
