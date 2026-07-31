const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const crypto = require("crypto");
const User = require("../models/User");
const emailService = require("../services/emailService");
const connectDB = require("../config/db");

async function fixAndResend(email, name, studentId) {
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  const tempPassword = `STU-${randomSuffix}`;
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  let user = await User.findOne({ email }).select("+password");
  if (user) {
    // Set plain-text — Mongoose pre-save hook will correctly hash once
    user.password = tempPassword;
    user.mustChangePassword = true;
    user.passwordExpiresAt = expiryDate;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();
    console.log(`FIXED & RESET: ${email} → temp password: ${tempPassword}`);
  } else {
    user = await User.create({
      name,
      email,
      studentId,
      password: tempPassword, // plain-text — Mongoose will hash it once
      role: "student",
      institutionId: "KSRCE",
      mustChangePassword: true,
      passwordExpiresAt: expiryDate,
      active: true,
      failedLoginAttempts: 0,
    });
    console.log(`CREATED: ${email} → temp password: ${tempPassword}`);
  }

  const emailResult = await emailService.sendTemporaryPasswordEmail({
    toEmail: email,
    name: user.name,
    tempPassword,
    role: "student",
  });
  console.log(`Email to ${email}:`, emailResult);
  return tempPassword;
}

async function main() {
  await connectDB();

  // Fix Dharshinibala (double-hashed, now corrected)
  await fixAndResend(
    "dharshinibala001cse24_27@ksrce.ac.in",
    "Dharshinibala",
    "dharshinibala001cse24_27"
  );

  // Fix Dharani too (also double-hashed previously)
  await fixAndResend(
    "vvdharani57cse24_27@ksrce.ac.in",
    "Dharani V",
    "221CS001"
  );

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
