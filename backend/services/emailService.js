const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_EMAIL || process.env.SMTP_USER || "";
  const pass = process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS || "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
};

exports.buildCredentialEmailHtml = ({ name, toEmail, regNo, tempPassword, role, appUrl }) => {
  const safeRegNo = regNo || "N/A";
  const safeUrl = appUrl || process.env.APP_URL || "https://classroom.ksrce.ac.in/login";
  const safeRole = role ? String(role).toUpperCase() : "STUDENT";

  return `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #0F172A; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px;">
      <h2 style="color: #2563EB; margin-top: 0;">Smart Classroom Mobile Usage Control</h2>
      <p>Dear <strong>${name || "Student"}</strong>,</p>
      <p>Your ${safeRole.toLowerCase()} account for the Smart Classroom Portal has been created successfully.</p>

      <div style="background-color: #F8FAFC; padding: 18px; border-radius: 8px; border: 1px solid #E2E8F0; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Student Name:</strong> <span style="color: #0F172A;">${name || "Student"}</span></p>
        <p style="margin: 0 0 8px 0;"><strong>Register Number:</strong> <span style="color: #0F172A;">${safeRegNo}</span></p>
        <p style="margin: 0 0 8px 0;"><strong>Login Email:</strong> <code style="font-size: 14px; color: #0F172A;">${toEmail}</code></p>
        <p style="margin: 0 0 8px 0;"><strong>Temporary Password:</strong> <code style="font-size: 18px; font-weight: bold; color: #2563EB;">${tempPassword}</code></p>
        <p style="margin: 0;"><strong>Login URL:</strong> <a href="${safeUrl}" style="color: #2563EB; text-decoration: underline;">${safeUrl}</a></p>
      </div>

      <h4 style="color: #334155; margin-bottom: 8px;">Instructions for First Login:</h4>
      <ol style="padding-left: 20px; line-height: 1.6; color: #475569;">
        <li>Open the Smart Classroom Portal or Mobile App using the link above: <a href="${safeUrl}">${safeUrl}</a>.</li>
        <li>Select the <strong>${safeRole}</strong> login tab and sign in using your registered email (<code>${toEmail}</code>) and temporary password.</li>
        <li><strong>Password Change Required</strong>: Because this is a temporary password, the system will force you to set a new permanent password immediately upon your first successful login.</li>
        <li>Once updated, your new password will be active for all future logins.</li>
      </ol>

      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0 16px 0;" />
      <p style="font-size: 12px; color: #94A3B8; margin: 0;">Official Institutional Portal • KSRCE Mobile Controller</p>
    </div>
  `;
};

exports.sendTemporaryPasswordEmail = async ({ toEmail, name, studentId, registerNumber, tempPassword, role, loginUrl }) => {
  try {
    const fromEmail = process.env.FROM_EMAIL || `"Smart Classroom Portal" <${process.env.SMTP_EMAIL || "vvdharani57cse24_27@ksrce.ac.in"}>`;
    const transporter = getTransporter();

    const regNo = registerNumber || studentId || "N/A";
    const appUrl = loginUrl || process.env.APP_URL || "https://classroom.ksrce.ac.in/login";

    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject: `Smart Classroom Portal — Your Temporary ${role ? role.toUpperCase() : "ACCOUNT"} Credentials`,
      html: exports.buildCredentialEmailHtml({ name, toEmail, regNo, tempPassword, role, appUrl }),
    };

    if (process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      logger.info(`Temporary password email sent to ${toEmail}`);
    } else {
      logger.info(`[Development Mode] Temporary password for ${toEmail} (${regNo}): ${tempPassword}`);
    }
    return { success: true };
  } catch (err) {
    logger.warn(`Failed to dispatch email to ${toEmail}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

exports.sendDeveloperCredentialRoster = async (rosterData) => {
  try {
    const developerEmail = process.env.SMTP_EMAIL || "vvdharani57cse24_27@ksrce.ac.in";
    const fromEmail = process.env.FROM_EMAIL || `"Smart Classroom Portal" <${developerEmail}>`;
    const transporter = getTransporter();

    const studentRowsHtml = rosterData.students
      .map(
        (s) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${s.studentId}</td>
          <td style="padding: 8px; border: 1px solid #CBD5E1;">${s.email}</td>
          <td style="padding: 8px; border: 1px solid #CBD5E1; font-weight: bold; color: #2563EB;">${s.password}</td>
        </tr>`
      )
      .join("");

    const mailOptions = {
      from: fromEmail,
      to: developerEmail,
      subject: "Smart Classroom — Complete Credential Roster Summary",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0F172A;">
          <h2 style="color: #2563EB;">Smart Classroom Master Roster Report</h2>
          <p>Master credential roster generated for developer administrator <strong>${developerEmail}</strong>.</p>
          
          <h3>Admin Credential</h3>
          <p><strong>Email / ID:</strong> ${rosterData.admin.email} | <strong>Password:</strong> ${rosterData.admin.password}</p>

          <h3>Staff Credential</h3>
          <p><strong>Email / ID:</strong> ${rosterData.staff.email} | <strong>Password:</strong> ${rosterData.staff.password}</p>

          <h3>Student Roster (${rosterData.students.length} Accounts)</h3>
          <table style="border-collapse: collapse; width: 100%; text-align: left;">
            <thead>
              <tr style="background: #F1F5F9;">
                <th style="padding: 8px; border: 1px solid #CBD5E1;">Reg No</th>
                <th style="padding: 8px; border: 1px solid #CBD5E1;">Student Email</th>
                <th style="padding: 8px; border: 1px solid #CBD5E1;">Temporary Password</th>
              </tr>
            </thead>
            <tbody>
              ${studentRowsHtml}
            </tbody>
          </table>
        </div>
      `,
    };

    if (process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      logger.info(`Credential roster email dispatched successfully to ${developerEmail}`);
    } else {
      logger.info(`Credential roster compiled for developer email ${developerEmail} (Console dispatch mode)`);
    }
  } catch (err) {
    logger.warn(`Email dispatch notice: ${err.message}`);
  }
};
