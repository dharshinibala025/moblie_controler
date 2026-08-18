package com.mobile_controller

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Schedules the background policy-sync fallback. WorkManager's periodic minimum
 * is 15 minutes; FCM data messages cover the instant path on locked phones.
 */
object PolicySyncScheduler {
    private const val UNIQUE_NAME = "policy_sync_worker"

    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<PolicySyncWorker>(15, TimeUnit.MINUTES)
            .build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(UNIQUE_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
    }
}