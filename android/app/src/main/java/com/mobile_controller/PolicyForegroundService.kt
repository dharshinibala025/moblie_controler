package com.mobile_controller

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

/**
 * Persistent foreground service that keeps the app process alive so the
 * accessibility service stays connected. Without it Android (Doze / battery
 * optimization / swipe-kill) kills the background process, which disables the
 * accessibility service and makes Settings show "Not working - App info".
 */
class PolicyForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startAsForeground()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startAsForeground()
        return START_STICKY
    }

    private fun startAsForeground() {
        val channelId = "policy_monitor_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Restriction monitoring",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps classroom restriction enforcement active"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // NOTE: deliberately no PendingIntent here. Tapping the notification
        // must NOT launch the app, or a blocked student could use it as a
        // shortcut to the FocusSync UI while the overlay is up (an escape
        // route). Its only job is keeping the process alive.
        val notification: Notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
                .setContentTitle("Restriction monitoring active")
                .setContentText("Keeping enforcement services running")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("Restriction monitoring active")
                .setContentText("Keeping enforcement services running")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setOngoing(true)
                .build()
        }

        try {
            startForeground(1001, notification)
        } catch (e: Exception) {
            Log.e("PolicyForegroundService", "startForeground failed", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i("PolicyForegroundService", "Stopped")
    }
}