package com.mobile_controller

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

/**
 * Keeps the enforcement chain alive across reboots.
 *
 * On BOOT_COMPLETED the app process does not exist until something starts it —
 * that means the accessibility service can stay dead ("Not working") for a long
 * time after a reboot, silently disabling ALL blocking. This receiver starts the
 * foreground service (which keeps the process alive so the accessibility service
 * binds again) and kicks off an immediate policy refresh instead of waiting the
 * 15-minute WorkManager minimum.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            return
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(
                    Intent(context, PolicyForegroundService::class.java)
                )
            } else {
                @Suppress("DEPRECATION")
                context.startService(Intent(context, PolicyForegroundService::class.java))
            }
        } catch (e: Exception) {
            // ignore
        }

        try {
            PolicySyncScheduler.schedule(context)
        } catch (e: Exception) {
            // ignore
        }

        try {
            val oneTime = OneTimeWorkRequestBuilder<PolicySyncWorker>().build()
            WorkManager.getInstance(context).enqueue(oneTime)
        } catch (e: Exception) {
            // ignore
        }
    }
}