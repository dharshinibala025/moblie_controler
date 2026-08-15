const EmailQueue = require("../models/EmailQueue");
const emailService = require("../services/emailService");
const logger = require("../utils/logger");

let isRunning = false;
let timerId = null;

const startOfTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const startOfTomorrowUtc = () => {
  const today = startOfTodayUtc();
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
};

const getDailySendLimit = () => {
  const raw = parseInt(process.env.DAILY_SEND_LIMIT, 10);
  return Number.isInteger(raw) && raw > 0 ? raw : 300;
};

/**
 * Enterprise Background Email Worker
 * Processes pending email jobs from EmailQueue asynchronously with rate-limiting & exponential backoff retries.
 */
class EmailQueueWorker {
  constructor() {
    this.isProcessing = false;
  }

  start(intervalMs = 10000) {
    if (isRunning) return;
    isRunning = true;
    logger.info("Enterprise Email Queue Background Worker started.");

    // Run initial processing loop
    this.processQueue();

    // Schedule periodic worker loop
    timerId = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    isRunning = false;
    logger.info("Enterprise Email Queue Background Worker stopped.");
  }

  async triggerImmediateProcessing() {
    // Non-blocking trigger to process queue immediately
    setImmediate(() => this.processQueue().catch(() => {}));
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Enforce the daily send budget (Brevo free tier = 300 emails/day)
      const dailyLimit = getDailySendLimit();
      const sentToday = await EmailQueue.countDocuments({
        status: "sent",
        sentAt: { $gte: startOfTodayUtc() },
      });
      const remainingBudget = dailyLimit - sentToday;

      // Fetch up to 200 pending email jobs whose nextRetryAt <= now
      const dueJobs = await EmailQueue.find({
        status: "pending",
        nextRetryAt: { $lte: new Date() },
        attempts: { $lt: 5 },
      }).limit(200);

      if (!dueJobs || dueJobs.length === 0) {
        return;
      }

      if (remainingBudget <= 0) {
        logger.warn(
          `Email Worker: Daily send limit (${dailyLimit}) reached (${sentToday} sent). Parking ${dueJobs.length} job(s) until tomorrow.`
        );
        await EmailQueue.updateMany(
          { _id: { $in: dueJobs.map((job) => job._id) } },
          { $set: { nextRetryAt: startOfTomorrowUtc() } }
        );
        return;
      }

      let jobsToSend = dueJobs;
      if (dueJobs.length > remainingBudget) {
        jobsToSend = dueJobs.slice(0, remainingBudget);
        const parked = dueJobs.slice(remainingBudget);
        await EmailQueue.updateMany(
          { _id: { $in: parked.map((job) => job._id) } },
          { $set: { nextRetryAt: startOfTomorrowUtc() } }
        );
        logger.info(
          `Email Worker: Daily budget allows ${remainingBudget} more send(s); parking ${parked.length} job(s) until tomorrow.`
        );
      }

      logger.info(`Email Worker: Processing ${jobsToSend.length} queued email job(s)...`);

      // Dispatch in parallel batches of 20 for high-throughput email sending
      const BATCH_SIZE = 20;
      for (let i = 0; i < jobsToSend.length; i += BATCH_SIZE) {
        const batch = jobsToSend.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((job) => this.dispatchJob(job)));
      }
    } catch (err) {
      logger.error(`Email Worker Error: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  async dispatchJob(job) {
    job.attempts += 1;
    job.status = "processing";
    await job.save();

    try {
      const result = await emailService.sendTemporaryPasswordEmail({
        toEmail: job.recipientEmail,
        name: job.recipientName,
        studentId: job.studentId,
        tempPassword: job.tempPassword,
        role: job.role,
      });

      if (result.success) {
        job.status = "sent";
        job.sentAt = new Date();
        job.lastError = null;
        logger.info(`Email Worker: Successfully dispatched temporary credentials to ${job.recipientEmail}`);
      } else {
        job.lastError = result.error || "SMTP Dispatch Error";
        if (job.attempts >= job.maxAttempts) {
          job.status = "failed";
          logger.error(`Email Worker: Job failed permanently for ${job.recipientEmail} after ${job.attempts} attempt(s)`);
        } else {
          job.status = "pending";
          // Exponential Backoff: 30s, 2m, 10m, 1h
          const delaySeconds = Math.pow(4, job.attempts) * 10;
          job.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
          logger.warn(`Email Worker: Retrying email to ${job.recipientEmail} in ${delaySeconds}s (Attempt ${job.attempts}/${job.maxAttempts})`);
        }
      }
    } catch (err) {
      job.lastError = err.message;
      if (job.attempts >= job.maxAttempts) {
        job.status = "failed";
      } else {
        job.status = "pending";
        const delaySeconds = Math.pow(4, job.attempts) * 10;
        job.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
      }
    }

    await job.save();
  }
}

module.exports = new EmailQueueWorker();
