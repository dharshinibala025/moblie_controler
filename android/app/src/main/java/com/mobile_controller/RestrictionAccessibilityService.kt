package com.mobile_controller

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import java.util.Calendar

class RestrictionAccessibilityService : AccessibilityService() {

    private lateinit var policyStorage: PolicyStorage

    override fun onCreate() {
        super.onCreate()
        policyStorage = PolicyStorage(applicationContext)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return

        // Ignore system UI and own package
        if (packageName == "com.mobile_controller" || packageName.startsWith("com.android.systemui")) {
            return
        }

        val blockedApps = policyStorage.getBlockedApps()
        if (blockedApps.contains(packageName)) {
            if (isWithinSchedule()) {
                launchBlockOverlay(packageName)
            }
        }
    }

    private fun isWithinSchedule(): Boolean {
        val start = policyStorage.getScheduleStart() // e.g. "09:00"
        val end = policyStorage.getScheduleEnd()     // e.g. "16:00"

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
        val intent = Intent(this, BlockOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("packageName", packageName)
            putExtra("reason", policyStorage.getReason())
        }
        startActivity(intent)
    }

    override fun onInterrupt() {}
}
