package com.mobile_controller

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONArray

/**
 * Native Firebase Cloud Messaging handler.
 *
 * Receives policy data messages from the backend (sent by the admin/staff
 * apply / pause / resume / emergency actions) and writes them straight into
 * PolicyStorage. Because this runs in the native process it works even when the
 * app is backgrounded or killed — the AccessibilityService picks up the new
 * policy instantly, giving "apply = block now" on locked phones.
 */
class FcmPolicyService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        try {
            val data: Map<String, String> = message.data ?: return
            val action = data["action"] ?: return
            val policyStorage = PolicyStorage(applicationContext)

            when (action) {
                "start" -> {
                    val blockedPackages = parseStringArray(data["blockedPackages"])
                    val days = parseStringArray(data["activeDays"])
                    val emergency = data["emergency"] == "active"
                    policyStorage.savePolicy(
                        ruleId = data["ruleId"] ?: "",
                        blockedApps = blockedPackages,
                        scheduleStart = data["scheduleStart"] ?: "09:00",
                        scheduleEnd = data["scheduleEnd"] ?: "16:00",
                        activeDays = if (days.isEmpty()) DEFAULT_ACTIVE_DAYS else days,
                        reason = data["reason"] ?: "",
                        version = data["policyVersion"]?.toIntOrNull() ?: 1,
                        status = "active",
                        emergency = false  // ALWAYS clear emergency on resume/start
                    )
                }
                "pause" -> {
                    // Pause: lift restrictions but keep policy configured (NOT emergency)
                    val days = parseStringArray(data["activeDays"])
                    policyStorage.savePolicy(
                        ruleId = data["ruleId"] ?: "",
                        blockedApps = emptyList(),
                        scheduleStart = data["scheduleStart"] ?: "09:00",
                        scheduleEnd = data["scheduleEnd"] ?: "16:00",
                        activeDays = if (days.isEmpty()) DEFAULT_ACTIVE_DAYS else days,
                        reason = data["reason"] ?: "",
                        version = data["policyVersion"]?.toIntOrNull() ?: 1,
                        status = "paused",
                        emergency = false  // Explicitly NOT emergency
                    )
                    sendDismissBroadcast()
                }
                "stop" -> {
                    // Emergency unblock sends "stop" with emergency: "active"
                    val emergency = data["emergency"] == "active"
                    if (emergency) {
                        policyStorage.clearPolicy()  // Sets emergency=true
                    } else {
                        // Normal stop - clear without emergency
                        val days = parseStringArray(data["activeDays"])
                        policyStorage.savePolicy(
                            ruleId = data["ruleId"] ?: "",
                            blockedApps = emptyList(),
                            scheduleStart = data["scheduleStart"] ?: "09:00",
                            scheduleEnd = data["scheduleEnd"] ?: "16:00",
                            activeDays = if (days.isEmpty()) DEFAULT_ACTIVE_DAYS else days,
                            reason = data["reason"] ?: "",
                            version = data["policyVersion"]?.toIntOrNull() ?: 1,
                            status = "inactive",
                            emergency = false
                        )
                    }
                    sendDismissBroadcast()
                }
                else -> {
                    policyStorage.clearPolicy()
                    sendDismissBroadcast()
                }
            }
        } catch (e: Exception) {
            // A failed push must never crash the app.
        }
    }

    private fun sendDismissBroadcast() {
        try {
            val dismissIntent = android.content.Intent("com.mobile_controller.ACTION_DISMISS_BLOCK_OVERLAY").apply {
                setPackage(applicationContext.packageName)
            }
            applicationContext.sendBroadcast(dismissIntent)
        } catch (e: Exception) { /* ignore */ }
    }

    override fun onNewToken(token: String) {
        // Token refreshed — next JS sync registers it with the backend.
        try {
            PolicyStorage(applicationContext).saveAuth("", token, "")
            // Also trigger immediate background sync via WorkManager
            val context = applicationContext
            val policyStorage = PolicyStorage(context)
            val deviceId = policyStorage.getDeviceId()
            val authToken = policyStorage.getAuthToken()
            if (deviceId.isNotBlank() && authToken.isNotBlank()) {
                androidx.work.WorkManager.getInstance(context)
                    .enqueueUniqueWork(
                        "PolicySyncWorker",
                        androidx.work.ExistingWorkPolicy.REPLACE,
                        androidx.work.OneTimeWorkRequestBuilder<PolicySyncWorker>().build()
                    )
            }
        } catch (e: Exception) {
            // ignore
        }
    }

    private fun parseStringArray(raw: String?): List<String> {
        if (raw.isNullOrBlank()) return emptyList()
        return try {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { arr.getString(it) }.filter { it.isNotBlank() }
        } catch (e: Exception) {
            raw.split(",").map { it.trim().removeSurrounding("\"").removeSurrounding("'").removeSurrounding("[").removeSurrounding("]") }.filter { it.isNotBlank() }
        }
    }

    companion object {
        private val DEFAULT_ACTIVE_DAYS = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
    }
}