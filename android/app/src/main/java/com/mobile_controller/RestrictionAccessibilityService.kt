package com.mobile_controller

import android.accessibilityservice.AccessibilityService
import android.app.ActivityOptions
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import java.util.Calendar
import java.util.concurrent.ConcurrentHashMap

class RestrictionAccessibilityService : AccessibilityService() {

    private var policyStorage: PolicyStorage? = null

    // Debounce map to avoid launching the overlay repeatedly for the same package.
    private val lastBlockedAt = ConcurrentHashMap<String, Long>()

    // Built-in offline fallback list so social media/games are still blocked during the
    // schedule window even if the server policy has not been synced yet.
    private val fallbackBlockedPackages = setOf(
        "com.instagram.android",
        "com.whatsapp",
        "org.telegram.messenger",
        "com.snapchat.android",
        "com.twitter.android",
        "com.facebook.katana",
        "com.facebook.orca",
        "com.google.android.youtube",
        "com.instagram.barcelona",
        "com.discord",
        "com.zhiliaoapp.musically",
        "com.pinterest",
        "com.reddit.frontpage",
        "com.linkedin.android",
        "com.likee",
        "com.badoo.mobile",
        "com.tinder",
        "com.quora.android",
        "com.tumblr",
        "com.dts.freefireth",
        "com.tencent.ig",
        "com.pubg.imobile",
        "com.netflix.mediaclient",
        "com.amazon.avod.thirdpartyclient",
        "in.startv.hotstar",
        "com.jio.media.ondemand"
    )

    override fun onCreate() {
        super.onCreate()
        policyStorage = PolicyStorage(applicationContext)
        Log.i("RestrictionService", "RestrictionAccessibilityService created")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        policyStorage = PolicyStorage(applicationContext)
        Log.i("RestrictionService", "RestrictionAccessibilityService connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        try {
            if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

            val packageName = event.packageName?.toString() ?: return

            // Ignore system UI, launcher and own package
            if (packageName == "com.mobile_controller" ||
                packageName.startsWith("com.android.systemui") ||
                packageName == "com.android.launcher"
            ) {
                return
            }

            val storage = policyStorage ?: PolicyStorage(applicationContext).also {
                policyStorage = it
            }

            // Emergency unblock always wins: never enforce the overlay during an emergency.
            if (storage.getEmergency()) {
                return
            }

            // hasStoredPolicy reflects whether a server policy has EVER been synced.
            // Only the offline default-window fallback applies before the first sync.
            val storedBlocked = storage.getBlockedApps()

            val blockedSet = if (storage.isConfigured()) {
                // Only enforce the stored list while the policy is active.
                if (storage.isPolicyActive()) {
                    storedBlocked
                } else {
                    emptySet()
                }
            } else {
                // No policy synced yet: enforce the offline default window fallback
                // (only effective while the default schedule window is active).
                fallbackBlockedPackages
            }

            if (blockedSet.contains(packageName)) {
                if (isWithinSchedule()) {
                    if (shouldLaunch(packageName)) {
                        Log.w("RestrictionService", "Blocking restricted package: $packageName")
                        launchBlockOverlay(packageName)
                    }
                } else {
                    Log.i("RestrictionService", "Package $packageName is restricted, but currently outside restriction schedule.")
                }
            }
        } catch (e: Exception) {
            Log.e("RestrictionService", "Error handling accessibility event", e)
        }
    }

    private fun shouldLaunch(packageName: String): Boolean {
        val now = System.currentTimeMillis()
        val last = lastBlockedAt[packageName] ?: 0L
        if (now - last < 1000) {
            return false
        }
        lastBlockedAt[packageName] = now
        // Keep the map bounded
        if (lastBlockedAt.size > 64) {
            lastBlockedAt.clear()
        }
        return true
    }

    private fun isWithinSchedule(): Boolean {
        val storage = policyStorage ?: return true
        val start = storage.getScheduleStart() // e.g. "09:00"
        val end = storage.getScheduleEnd()     // e.g. "16:00"

        try {
            val startParts = start.split(":").map { it.toInt() }
            val endParts = end.split(":").map { it.toInt() }

            val cal = Calendar.getInstance()

            // Active-days check (e.g. "Mon".."Sat"); default when nothing stored.
            val activeDays = storage.getActiveDays()
            val dayName = cal.getDisplayName(
                Calendar.DAY_OF_WEEK,
                Calendar.SHORT,
                java.util.Locale.US
            )?.substring(0, 3) ?: ""
            if (activeDays.isNotEmpty() && !activeDays.contains(dayName)) {
                return false
            }

            val currentHour = cal.get(Calendar.HOUR_OF_DAY)
            val currentMinute = cal.get(Calendar.MINUTE)

            val currentMinutesOfDay = currentHour * 60 + currentMinute
            val startMinutesOfDay = startParts[0] * 60 + startParts[1]
            val endMinutesOfDay = endParts[0] * 60 + endParts[1]

            // End-exclusive so the restriction lifts exactly at the end time.
            return currentMinutesOfDay in startMinutesOfDay until endMinutesOfDay
        } catch (e: Exception) {
            return true // Default active if parse error occurs
        }
    }

    private fun nextUnlockLabel(): String {
        val storage = policyStorage ?: return ""
        val end = storage.getScheduleEnd() // e.g. "16:00"
        return try {
            val parts = end.split(":").map { it.toInt() }
            val hour = parts[0]
            val minute = parts[1]
            val ampm = if (hour >= 12) "PM" else "AM"
            var displayHour = hour % 12
            if (displayHour == 0) displayHour = 12
            String.format("%02d:%02d %s", displayHour, minute, ampm)
        } catch (e: Exception) {
            ""
        }
    }

    private fun launchBlockOverlay(packageName: String) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                Log.w("RestrictionService", "Overlay permission missing, skipping block overlay for $packageName")
                return
            }

            val storage = policyStorage ?: PolicyStorage(applicationContext).also {
                policyStorage = it
            }

            val intent = Intent(this, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra("packageName", packageName)
                putExtra("reason", storage.getReason())
                putExtra("scheduleStart", storage.getScheduleStart())
                putExtra("scheduleEnd", storage.getScheduleEnd())
                putExtra("nextUnlockLabel", nextUnlockLabel())
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val options = ActivityOptions.makeBasic().apply {
                    launchDisplayId = 0
                }
                startActivity(intent, options.toBundle())
            } else {
                startActivity(intent)
            }
        } catch (e: Exception) {
            Log.e("RestrictionService", "Failed to launch block overlay for $packageName", e)
        }
    }

    override fun onInterrupt() {}

    override fun onUnbind(intent: Intent?): Boolean {
        lastBlockedAt.clear()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        lastBlockedAt.clear()
        policyStorage = null
        super.onDestroy()
    }
}