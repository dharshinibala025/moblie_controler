const EmailQueue = require("../models/EmailQueue");
const emailService = require("../services/emailService");
const logger = require("../utils/logger");

let isRunning = false;
let timerId = null;

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
      // Fetch up to 50 pending email jobs whose nextRetryAt <= now
      const pendingJobs = await EmailQueue.find({
        status: "pending",
        nextRetryAt: { $lte: new Date() },
        attempts: { $lt: 5 },
      }).limit(50);

      if (!pendingJobs || pendingJobs.length === 0) {
        return;
      }

      logger.info(`Email Worker: Processing ${pendingJobs.length} queued email job(s)...`);

      // Dispatch in parallel batches of 10 for high-throughput email sending
      const BATCH_SIZE = 10;
      for (let i = 0; i < pendingJobs.length; i += BATCH_SIZE) {
        const batch = pendingJobs.slice(i, i + BATCH_SIZE);
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
