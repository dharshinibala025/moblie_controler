const nodemailer = require("nodemailer");
const dns = require("dns");
const net = require("net");
const logger = require("../utils/logger");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const parseSender = () => {
  const from = process.env.FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_EMAIL || "mobilecontrol07@gmail.com";
  const match = String(from).match(/^"([^"]+)"\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1], email: match[2] };
  }
  return { name: "Smart Classroom Portal", email: String(from).replace(/[<>]/g, "").trim() };
};

const sendBrevoEmail = async ({ toEmail, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }
  const sender = parseSender();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: toEmail }],
        subject,
        htmlContent: html,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = (data.message && data.message.join ? data.message.join("; ") : data.message) || response.statusText;
      throw new Error(`Brevo API ${response.status}: ${detail}`);
    }
    return { success: true, messageId: data.messageId };
  } finally {
    clearTimeout(timeout);
  }
};

const IPV4_CACHE_TTL = 6 * 60 * 60 * 1000;
let ipv4Cache = { host: null, expires: 0 };

const resolveIpv4Host = async (hostname) => {
  if (ipv4Cache.host && Date.now() < ipv4Cache.expires) {
    return ipv4Cache.host;
  }
  try {
    const addresses = await dns.promises.lookup(hostname, { family: 4, all: true });
    if (addresses && addresses.length) {
      ipv4Cache = { host: addresses[0].address, expires: Date.now() + IPV4_CACHE_TTL };
      return addresses[0].address;
    }
  } catch (err) {
    logger.warn(`SMTP IPv4 resolution failed for ${hostname}: ${err.message}`);
  }
  return hostname;
};

const getTransporter = async () => {
  const hostname = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_EMAIL || process.env.SMTP_USER || "";
  const pass = process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS || "";

  // Connect to an explicit IPv4 literal: nodemailer 9 resolves BOTH families and
  // picks a random address (IPv6 ~50%), and Render instances have no working IPv6
  // route -> 'connect ENETUNREACH <ipv6>:587'. Using an IPv4 literal skips its
  // resolver entirely; servername keeps TLS/SNI correct.
  const host = net.isIP(hostname) ? hostname : await resolveIpv4Host(hostname);

  return nodemailer.createTransport({
    host,
    servername: hostname,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 120000,
  });
};

exports.getTransporter = getTransporter;

exports._clearIpv4Cache = () => {
  ipv4Cache = { host: null, expires: 0 };
};

const probeOne = (hostname, port) =>
  new Promise((resolve) => {
    dns.promises
      .lookup(hostname, { family: 4, all: false })
      .then((result) => {
        const address = typeof result === "string" ? result : result.address;
        const started = Date.now();
        const socket = net.createConnection({
          host: address,
          port,
          family: 4,
          timeout: 8000,
        });
        socket.on("connect", () => {
          socket.destroy();
          resolve({ target: `${hostname}:${port}`, ok: true, host: address, port, ms: Date.now() - started });
        });
        socket.on("timeout", () => {
          socket.destroy();
          resolve({ target: `${hostname}:${port}`, ok: false, error: "connect timeout", host: address, port });
        });
        socket.on("error", (e) => {
          socket.destroy();
          resolve({ target: `${hostname}:${port}`, ok: false, error: e.code || e.message, host: address, port });
        });
      })
      .catch((err) => {
        resolve({ target: `${hostname}:${port}`, ok: false, error: "dns lookup failed: " + err.message });
      });
  });

const PROBE_TARGETS = [
  ["smtp.gmail.com", 587],
  ["smtp.gmail.com", 465],
  ["smtp.gmail.com", 25],
  ["smtp.sendgrid.net", 587],
  ["smtp.brevo.com", 587],
];

exports.testSmtpConnectivity = async () => {
  const results = await Promise.all(
    PROBE_TARGETS.map(([host, port]) => probeOne(host, port))
  );
  return { configured: process.env.SMTP_HOST || "smtp.gmail.com", results };
};

exports.isSmtpConfigured = () => Boolean(process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS);

exports.isEmailConfigured = () =>
  exports.isSmtpConfigured() || Boolean(process.env.BREVO_API_KEY);

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
    const regNo = registerNumber || studentId || "N/A";
    const appUrl = loginUrl || process.env.APP_URL || "https://classroom.ksrce.ac.in/login";
    const subject = `Smart Classroom Portal — Your Temporary ${role ? role.toUpperCase() : "ACCOUNT"} Credentials`;
    const html = exports.buildCredentialEmailHtml({ name, toEmail, regNo, tempPassword, role, appUrl });

    if (process.env.BREVO_API_KEY) {
      await sendBrevoEmail({ toEmail, subject, html });
      logger.info(`Temporary password email sent to ${toEmail} via Brevo`);
      return { success: true };
    }

    const fromEmail = process.env.FROM_EMAIL || `"Smart Classroom Portal" <${process.env.SMTP_EMAIL || "vvdharani57cse24_27@ksrce.ac.in"}>`;
    const transporter = await getTransporter();

    const mailOptions = {
      from: fromEmail,
      to: toEmail,
      subject,
      html,
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

    if (process.env.BREVO_API_KEY) {
      await sendBrevoEmail({ toEmail: developerEmail, subject: mailOptions.subject, html: mailOptions.html });
      logger.info(`Credential roster email dispatched successfully to ${developerEmail} via Brevo`);
      return;
    }

    if (process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASS) {
      const transporter = await getTransporter();
      await transporter.sendMail(mailOptions);
      logger.info(`Credential roster email dispatched successfully to ${developerEmail}`);
    } else {
      logger.info(`Credential roster compiled for developer email ${developerEmail} (Console dispatch mode)`);
    }
  } catch (err) {
    logger.warn(`Email dispatch notice: ${err.message}`);
  }
};
