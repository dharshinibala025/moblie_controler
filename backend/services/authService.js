const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Session = require("../models/Session");
const LoginAuditLog = require("../models/LoginAuditLog");
const ConsentRecord = require("../models/ConsentRecord");
const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;
const ACCESS_TOKEN_EXPIRY = "15m";
const PRE_AUTH_EXPIRY = "10m";

const REFRESH_TOKEN_DAYS = {
  admin: 7,
  staff: 30,
  student: 365,
};

class AuthService {
  async authenticate({ email, password, role, ip, userAgent, deviceInfo }) {
    const cleanInput = (email || "").trim();
    const lowerEmail = cleanInput.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: lowerEmail },
        { studentId: cleanInput },
        { studentId: cleanInput.toUpperCase() },
        { studentId: lowerEmail },
        { employeeId: cleanInput },
        { employeeId: cleanInput.toUpperCase() },
      ],
    }).select("+password");

    if (!user) {
      await this._logAuth({ email: cleanInput, action: "login.failed", ip, userAgent, details: { reason: "user_not_found" } });
      return { success: false, error: "Invalid credentials. Account not found.", status: 401 };
    }

    // STRICT ROLE VALIDATION
    if (role && user.role !== role.toLowerCase()) {
      await this._logAuth({ userId: user._id, email: cleanInput, role: user.role, action: "login.failed", ip, userAgent, details: { reason: "role_mismatch", requestedRole: role, userRole: user.role } });
      return {
        success: false,
        error: `Invalid ${role.toUpperCase()} credentials. This account is registered as ${user.role.toUpperCase()}. Please select the correct role tab to log in.`,
        status: 403,
      };
    }

    if (user.status === "disabled") {
      await this._logAuth({ userId: user._id, email, role: user.role, action: "login.failed", ip, userAgent, institutionId: user.institutionId, details: { reason: "disabled" } });
      return { success: false, error: "Account disabled. Contact your administrator.", status: 403 };
    }

    if (user.status === "suspended") {
      await this._logAuth({ userId: user._id, email, role: user.role, action: "login.failed", ip, userAgent, institutionId: user.institutionId, details: { reason: "suspended" } });
      return { success: false, error: "Account suspended. Contact your administrator.", status: 403 };
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return { success: false, error: `Account locked. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`, status: 423 };
    }

    if (!user.password) {
      return { success: false, error: "Account not activated. Please contact administrator.", status: 403 };
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= LOCKOUT_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MIN * 60 * 1000);
        user.failedLoginAttempts = 0;
        await user.save();
        await this._logAuth({ userId: user._id, email, role: user.role, action: "login.locked", ip, userAgent, institutionId: user.institutionId });
        return { success: false, error: `Account locked due to too many failed attempts. Please try again in ${LOCKOUT_DURATION_MIN} minutes.`, status: 423 };
      }

      await user.save();
      await this._logAuth({ userId: user._id, email, role: user.role, action: "login.failed", ip, userAgent, institutionId: user.institutionId, details: { reason: "wrong_password", attempts: user.failedLoginAttempts } });
      return { success: false, error: "Invalid credentials", status: 401 };
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    if (user.mustChangePassword) {
      if (user.passwordExpiresAt && user.passwordExpiresAt < new Date()) {
        await this._logAuth({ userId: user._id, email, role: user.role, action: "login.failed", ip, userAgent, institutionId: user.institutionId, details: { reason: "temp_password_expired" } });
        return { success: false, error: "Temporary password has expired after 7 days. Please contact your administrator.", status: 403 };
      }

      const tempToken = this._signTempToken(user, "must-change-password");
      await this._logAuth({ userId: user._id, email, role: user.role, action: "login.success", ip, userAgent, institutionId: user.institutionId, details: { reason: "must_change_password" } });
      return { success: true, mustChangePassword: true, tempToken, user: this._sanitizeUser(user) };
    }

    if (user.role === "student") {
      await this._revokeOtherStudentSessions(user._id, deviceInfo, ip, userAgent);
    }

    const { accessToken, refreshToken, session } = await this._createSession(user, ip, userAgent, deviceInfo);

    await this._logAuth({ userId: user._id, email, role: user.role, action: "login.success", ip, userAgent, institutionId: user.institutionId });

    return {
      success: true,
      accessToken,
      refreshToken,
      user: this._sanitizeUser(user),
    };
  }

  async refreshToken({ refreshToken: rawToken, ip, userAgent, deviceInfo }) {
    if (!rawToken) {
      return { success: false, error: "Refresh token required", status: 400 };
    }

    const tokenHash = Session.hashRefreshToken(rawToken);
    const session = await Session.findOne({ refreshTokenHash: tokenHash, status: "active" }).select("+refreshTokenHash");

    if (!session) {
      return { success: false, error: "Invalid or revoked refresh token", status: 401 };
    }

    if (session.expiresAt < new Date()) {
      session.status = "expired";
      await session.save();
      return { success: false, error: "Refresh token expired. Please login again.", status: 401 };
    }

    const user = await User.findById(session.userId).select("role status isActive mustChangePassword institutionId classId");
    if (!user) {
      session.status = "revoked";
      await session.save();
      return { success: false, error: "User not found", status: 401 };
    }

    if (user.status === "disabled" || user.status === "suspended") {
      session.status = "revoked";
      await session.save();
      return { success: false, error: "Account no longer accessible", status: 403 };
    }

    if (!user.isActive) {
      session.status = "revoked";
      await session.save();
      return { success: false, error: "Account disabled", status: 403 };
    }

    if (user.mustChangePassword) {
      session.status = "revoked";
      await session.save();
      return { success: false, error: "Password change required", status: 403, mustChangePassword: true };
    }

    session.status = "revoked";
    await session.save();

    const newRefreshDays = REFRESH_TOKEN_DAYS[user.role] || 30;
    const newExpiresAt = new Date(Date.now() + newRefreshDays * 24 * 60 * 60 * 1000);

    const newRawRefresh = Session.generateRefreshToken();
    const newRefreshHash = Session.hashRefreshToken(newRawRefresh);

    const newSession = await Session.create({
      userId: user._id,
      refreshTokenHash: newRefreshHash,
      deviceFingerprint: session.deviceFingerprint,
      deviceInfo: session.deviceInfo,
      ip,
      userAgent,
      status: "active",
      expiresAt: newExpiresAt,
      lastRefreshAt: new Date(),
    });

    const accessToken = this._signAccessToken(user, newSession._id);

    await this._logAuth({ userId: user._id, email: user.email, role: user.role, action: "refresh.success", ip, userAgent, institutionId: user.institutionId });

    return {
      success: true,
      accessToken,
      refreshToken: newRawRefresh,
      sessionId: newSession._id,
    };
  }

  async logout({ refreshToken: rawToken, userId }) {
    if (rawToken) {
      const tokenHash = Session.hashRefreshToken(rawToken);
      const session = await Session.findOne({ refreshTokenHash: tokenHash });
      if (session) {
        session.status = "revoked";
        await session.save();
        if (userId) {
          await this._logAuth({ userId, action: "logout.success" });
        }
      }
    }
    return { success: true };
  }

  async logoutAll(userId) {
    const result = await Session.updateMany({ userId, status: "active" }, { status: "revoked" });
    await this._logAuth({ userId, action: "logout.force", details: { sessionsRevoked: result.modifiedCount } });
    return { success: true, sessionsRevoked: result.modifiedCount };
  }

  _validatePasswordComplexity(password) {
    if (!password || password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  }

  async changePassword({ userId, currentPassword, newPassword }) {
    const pwdErr = this._validatePasswordComplexity(newPassword);
    if (pwdErr) {
      return { success: false, error: pwdErr, status: 400 };
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        await this._logAuth({ userId, email: user.email, role: user.role, action: "password.change.failed" });
        return { success: false, error: "Current password is incorrect", status: 401 };
      }
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await Session.updateMany({ userId: user._id, status: "active" }, { status: "revoked" });

    const { accessToken, refreshToken, session } = await this._createSession(user, null, null, null);

    await this._logAuth({ userId: user._id, email: user.email, role: user.role, action: "password.change" });

    return { success: true, accessToken, refreshToken, user: this._sanitizeUser(user) };
  }

  async changePasswordWithTempToken({ tempToken, newPassword }) {
    if (!tempToken) {
      return { success: false, error: "Temporary token required", status: 400 };
    }

    const pwdErr = this._validatePasswordComplexity(newPassword);
    if (pwdErr) {
      return { success: false, error: pwdErr, status: 400 };
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      if (decoded.type !== "must-change-password") {
        return { success: false, error: "Invalid token type", status: 401 };
      }
    } catch (err) {
      return { success: false, error: "Token expired or invalid. Please login again.", status: 401 };
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await Session.updateMany({ userId: user._id, status: "active" }, { status: "revoked" });

    const { accessToken, refreshToken, session } = await this._createSession(user, null, null, null);

    await this._logAuth({ userId: user._id, email: user.email, role: user.role, action: "password.change" });

    return { success: true, accessToken, refreshToken, user: this._sanitizeUser(user) };
  }

  async createStudent({ name, email, studentId, classId, tempPassword, createdBy }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return { success: false, error: "Email already registered", status: 409 };
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: tempPassword,
      role: "student",
      studentId,
      classId,
      institutionId: "KSRCE",
      mustChangePassword: true,
      hasSetPassword: true,
      hasAcceptedTerms: false,
      status: "active",
      isActive: true,
      registeredBy: createdBy,
    });

    await this._logAudit(createdBy, "student.create", { type: "user", id: user._id }, { studentEmail: email, studentId });

    return { success: true, user: this._sanitizeUser(user) };
  }

  async createStaff({ name, email, employeeId, classIds, tempPassword, createdBy }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return { success: false, error: "Email already registered", status: 409 };
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: tempPassword,
      role: "staff",
      employeeId,
      classId: classIds && classIds.length > 0 ? classIds[0] : null,
      institutionId: "KSRCE",
      mustChangePassword: true,
      hasSetPassword: true,
      hasAcceptedTerms: false,
      status: "active",
      isActive: true,
      registeredBy: createdBy,
    });

    await this._logAudit(createdBy, "staff.create", { type: "user", id: user._id }, { staffEmail: email, employeeId });

    return { success: true, user: this._sanitizeUser(user) };
  }

  async forceOffline(targetUserId, adminId) {
    const user = await User.findById(targetUserId);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    const result = await Session.updateMany({ userId: targetUserId, status: "active" }, { status: "revoked" });

    const device = await require("../models/Device").findOne({ userId: targetUserId });

    await this._logAudit(adminId, "user.force_offline", { type: "user", id: targetUserId }, {
      targetEmail: user.email,
      sessionsRevoked: result.modifiedCount,
    });

    return {
      success: true,
      sessionsRevoked: result.modifiedCount,
      fcmToken: device ? device.fcmToken : null,
      user: this._sanitizeUser(user),
    };
  }

  async suspendUser(targetUserId, adminId) {
    const user = await User.findById(targetUserId);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    const newStatus = user.status === "suspended" ? "active" : "suspended";
    user.status = newStatus;
    await user.save();

    if (newStatus === "suspended") {
      await Session.updateMany({ userId: targetUserId, status: "active" }, { status: "revoked" });
    }

    await this._logAudit(adminId, "user.suspend", { type: "user", id: targetUserId }, {
      targetEmail: user.email,
      newStatus,
    });

    return { success: true, user: this._sanitizeUser(user) };
  }

  async disableUser(targetUserId, adminId) {
    const user = await User.findById(targetUserId);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    user.status = "disabled";
    await user.save();

    await Session.updateMany({ userId: targetUserId, status: "active" }, { status: "revoked" });

    await this._logAudit(adminId, "user.disable", { type: "user", id: targetUserId }, {
      targetEmail: user.email,
    });

    return { success: true, user: this._sanitizeUser(user) };
  }

  async reactivateUser(targetUserId, adminId) {
    const user = await User.findById(targetUserId);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    user.status = "active";
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    await this._logAudit(adminId, "user.reactivate", { type: "user", id: targetUserId }, {
      targetEmail: user.email,
    });

    return { success: true, user: this._sanitizeUser(user) };
  }

  async listUsers({ role, status, classId, page = 1, limit = 50, institutionId }) {
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (classId) query.classId = classId;
    if (institutionId) query.institutionId = institutionId;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    };
  }

  async getUserSessions(userId) {
    const sessions = await Session.find({ userId, status: "active" }).sort({ lastRefreshAt: -1 });
    return sessions.map((s) => ({
      _id: s._id,
      deviceInfo: s.deviceInfo,
      ip: s.ip,
      status: s.status,
      lastRefreshAt: s.lastRefreshAt,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async acceptConsent({ userId, consentVersion, ip }) {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    await ConsentRecord.create({
      userId: user._id,
      institutionId: user.institutionId,
      consentVersion,
      ipAddress: ip,
    });

    user.hasAcceptedTerms = true;
    user.termsAcceptedAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = await this._createSession(user, ip, null, null);

    return { success: true, accessToken, refreshToken, user: this._sanitizeUser(user) };
  }

  async _createSession(user, ip, userAgent, deviceInfo) {
    const rawRefresh = Session.generateRefreshToken();
    const refreshHash = Session.hashRefreshToken(rawRefresh);

    const refreshDays = REFRESH_TOKEN_DAYS[user.role] || 30;
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    let deviceFingerprint = null;
    if (deviceInfo) {
      deviceFingerprint = Session.generateDeviceFingerprint(deviceInfo);
    }

    const session = await Session.create({
      userId: user._id,
      refreshTokenHash: refreshHash,
      deviceFingerprint,
      deviceInfo: deviceInfo || {},
      ip,
      userAgent,
      status: "active",
      expiresAt,
    });

    const accessToken = this._signAccessToken(user, session._id);

    return { accessToken, refreshToken: rawRefresh, session };
  }

  async _revokeOtherStudentSessions(userId, currentDeviceInfo, ip, userAgent) {
    if (!currentDeviceInfo) return;

    const currentFingerprint = Session.generateDeviceFingerprint(currentDeviceInfo);
    const activeSessions = await Session.find({ userId, status: "active", deviceFingerprint: { $ne: currentFingerprint } });

    for (const session of activeSessions) {
      session.status = "revoked";
      await session.save();
    }

    if (activeSessions.length > 0) {
      logger.info(`Revoked ${activeSessions.length} other sessions for student ${userId}`);

      const device = await require("../models/Device").findOne({ userId, deviceFingerprint: { $ne: currentFingerprint } });
      if (device) {
        device.status = "revoked";
        await device.save();
      }
    }
  }

  _signAccessToken(user, sessionId) {
    return jwt.sign(
      {
        userId: user._id,
        role: user.role,
        sessionId,
        institutionId: user.institutionId,
        classId: user.classId,
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: "HS256" }
    );
  }

  _signTempToken(user, type) {
    return jwt.sign(
      { userId: user._id, role: user.role, type },
      process.env.JWT_SECRET,
      { expiresIn: PRE_AUTH_EXPIRY, algorithm: "HS256" }
    );
  }

  _sanitizeUser(user) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
  }

  async _logAuth({ userId, email, role, action, ip, userAgent, institutionId, details }) {
    try {
      await LoginAuditLog.create({ userId, email, role, action, ip, userAgent, institutionId, details });
    } catch (err) {
      logger.error(`Auth audit log write failed: ${err.message}`);
    }
  }

  async _logAudit(actorId, action, target, details) {
    try {
      const actor = await User.findById(actorId).select("role");
      await AuditLog.create({
        actorId,
        actorRole: actor ? actor.role : "admin",
        action,
        target,
        details,
      });
    } catch (err) {
      logger.error(`Audit log write failed: ${err.message}`);
    }
  }
}

module.exports = new AuthService();
