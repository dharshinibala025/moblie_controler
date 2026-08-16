package com.mobile_controller

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import java.util.Calendar

class RestrictionAccessibilityService : AccessibilityService() {

    private var policyStorage: PolicyStorage? = null

    // Debounce map to avoid launching the overlay repeatedly for the same package.
    private val lastBlockedAt = HashMap<String, Long>()

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

            val blockedApps = storage.getBlockedApps().toMutableSet()
            if (blockedApps.isEmpty()) {
                blockedApps.addAll(fallbackBlockedPackages)
            } else {
                blockedApps.addAll(fallbackBlockedPackages)
            }

            if (blockedApps.contains(packageName)) {
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
        if (now - last < 5000) {
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
            val currentHour = cal.get(Calendar.HOUR_OF_DAY)
            val currentMinute = cal.get(Calendar.MINUTE)

            val currentMinutesOfDay = currentHour * 60 + currentMinute
            val startMinutesOfDay = startParts[0] * 60 + startParts[1]
            val endMinutesOfDay = endParts[0] * 60 + endParts[1]

            return currentMinutesOfDay in startMinutesOfDay..endMinutesOfDay
        } catch (e: Exception) {
            return true // Default active if parse error occurs
        }
    }

    private fun launchBlockOverlay(packageName: String) {
        try {
            // Android 10+ (API 29) restricts background activity starts. Only launch the
            // overlay when we are allowed to draw overlays; otherwise skip gracefully.
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
            }
            startActivity(intent)
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