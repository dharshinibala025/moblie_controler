package com.mobile_controller

import android.app.Application
import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(AppScannerPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()

    Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
      try {
        val sw = StringWriter()
        throwable.printStackTrace(PrintWriter(sw))
        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        val logEntry = "\n=== CRASH $timestamp ===\nThread: ${thread.name}\n$sw\n"

        val logDir = File(filesDir, "crash_logs")
        if (!logDir.exists()) logDir.mkdirs()
        val logFile = File(logDir, "crash.log")
        logFile.appendText(logEntry)

        Log.e("MobileController", "Uncaught exception on thread ${thread.name}", throwable)
      } catch (_: Exception) {
        // Never let the handler itself crash
      }
    }

    try {
      loadReactNative(this)
    } catch (e: Exception) {
      Log.e("MobileController", "React Native init failed", e)
    }

    // Background policy-sync fallback (refreshes policy even when the app is
    // killed; FCM data messages provide the instant path).
    try {
      PolicySyncScheduler.schedule(this)
    } catch (e: Exception) {
      Log.e("MobileController", "WorkManager schedule failed", e)
    }

    // Persistent foreground service keeps the process alive so the accessibility
    // service stays connected (prevents Android disabling it -> "Not working").
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        startForegroundService(
          Intent(this, PolicyForegroundService::class.java)
        )
      } else {
        @Suppress("DEPRECATION")
        startService(Intent(this, PolicyForegroundService::class.java))
      }
    } catch (e: Exception) {
      Log.e("MobileController", "Foreground service start failed", e)
    }
  }
}
