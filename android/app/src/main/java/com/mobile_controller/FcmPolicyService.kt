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

            if (action == "start") {
                val blockedPackages = parseStringArray(data["blockedPackages"])
                val days = parseStringArray(data["activeDays"])
                policyStorage.savePolicy(
                    ruleId = data["ruleId"] ?: "",
                    blockedApps = blockedPackages,
                    scheduleStart = data["scheduleStart"] ?: "09:00",
                    scheduleEnd = data["scheduleEnd"] ?: "16:00",
                    activeDays = if (days.isEmpty()) DEFAULT_ACTIVE_DAYS else days,
                    reason = data["reason"] ?: "",
                    version = data["policyVersion"]?.toIntOrNull() ?: 1,
                    status = "active",
                    emergency = data["emergency"] == "active"
                )
            } else {
                // pause / stop / emergency -> lift restrictions immediately
                policyStorage.clearPolicy()
            }
        } catch (e: Exception) {
            // A failed push must never crash the app.
        }
    }

    override fun onNewToken(token: String) {
        // Token refreshed — next JS sync registers it with the backend.
        try {
            PolicyStorage(applicationContext).saveAuth("", token, "")
        } catch (e: Exception) {
            // ignore
        }
    }

    private fun parseStringArray(raw: String?): List<String> {
        if (raw.isNullOrBlank()) return emptyList()
        return try {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { arr.getString(it) }
        } catch (e: Exception) {
            emptyList()
        }
    }

    companion object {
        private val DEFAULT_ACTIVE_DAYS = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
    }
}