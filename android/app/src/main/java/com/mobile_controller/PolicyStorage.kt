package com.mobile_controller

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import org.json.JSONArray
import org.json.JSONObject

class PolicyStorage(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("smart_classroom_policy_prefs", Context.MODE_PRIVATE)

    fun savePolicy(
        ruleId: String,
        blockedApps: List<String>,
        scheduleStart: String,
        scheduleEnd: String,
        activeDays: List<String>,
        reason: String,
        version: Int,
        status: String = "active",
        emergency: Boolean = false
    ) {
        val jsonArray = JSONArray(blockedApps)
        val daysArray = JSONArray(activeDays)
        val elapsedRealtimeAtSave = SystemClock.elapsedRealtime()

        prefs.edit()
            .putString("rule_id", ruleId)
            .putString("blocked_apps", jsonArray.toString())
            .putString("schedule_start", scheduleStart)
            .putString("schedule_end", scheduleEnd)
            .putString("active_days", daysArray.toString())
            .putString("reason", reason)
            .putInt("version", version)
            .putString("status", if (status.isBlank()) "active" else status)
            .putBoolean("emergency", emergency)
            .putBoolean("configured", true)
            .putLong("saved_timestamp_system", System.currentTimeMillis())
            .putLong("saved_timestamp_elapsed", elapsedRealtimeAtSave)
            .apply()
    }

    fun clearPolicy() {
        // Emergency unblock / pause: fully lift restrictions. configured stays
        // true so the offline default-window fallback never re-engages, and the
        // emergency flag stays true until the next real policy arrives.
        prefs.edit()
            .putString("blocked_apps", "[]")
            .putString("status", "inactive")
            .putBoolean("emergency", true)
            .putBoolean("configured", true)
            .apply()
    }

    // Device auth mirror for the background PolicySyncWorker (WorkManager).
    fun saveAuth(deviceId: String, authToken: String, baseUrl: String) {
        prefs.edit()
            .putString("device_id", deviceId)
            .putString("auth_token", authToken)
            .putString("base_url", baseUrl)
            .apply()
    }

    fun getDeviceId(): String = prefs.getString("device_id", "") ?: ""
    fun getAuthToken(): String = prefs.getString("auth_token", "") ?: ""
    fun getBaseUrl(): String =
        prefs.getString("base_url", "https://moblie-controler.onrender.com") ?: "https://moblie-controler.onrender.com"

    fun isConfigured(): Boolean = prefs.getBoolean("configured", false)

    fun getBlockedApps(): Set<String> {
        val raw = prefs.getString("blocked_apps", "[]") ?: "[]"
        val set = mutableSetOf<String>()
        try {
            val jsonArray = JSONArray(raw)
            for (i in 0 until jsonArray.length()) {
                set.add(jsonArray.getString(i))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return set
    }

    fun saveCategoryEnforcedPackages(packages: List<String>) {
        val jsonArray = JSONArray(packages)
        prefs.edit()
            .putString("category_enforced_apps", jsonArray.toString())
            .apply()
    }

    fun getCategoryEnforcedPackages(): Set<String> {
        val raw = prefs.getString("category_enforced_apps", "[]") ?: "[]"
        val set = mutableSetOf<String>()
        try {
            val jsonArray = JSONArray(raw)
            for (i in 0 until jsonArray.length()) {
                set.add(jsonArray.getString(i))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return set
    }

    // Union of the explicit policy list + every installed app the phone
    // classifies as social/games/entertainment. The accessibility service
    // enforces this union while the policy is active, so ALL social media
    // blocks even if the server list is stale or the realtime sync has not
    // reached the device yet.
    fun getEnforcedApps(): Set<String> {
        val enforced = getBlockedApps().toMutableSet()
        enforced.addAll(getCategoryEnforcedPackages())
        return enforced
    }

    fun getScheduleStart(): String = prefs.getString("schedule_start", "09:00") ?: "09:00"
    fun getScheduleEnd(): String = prefs.getString("schedule_end", "16:00") ?: "16:00"
    fun getReason(): String = prefs.getString("reason", "") ?: ""
    fun getRuleId(): String = prefs.getString("rule_id", "") ?: ""
    fun getVersion(): Int = prefs.getInt("version", 1)

    fun getStatus(): String = prefs.getString("status", "active") ?: "active"
    fun isPolicyActive(): Boolean = getStatus().equals("active", ignoreCase = true)
    fun getEmergency(): Boolean = prefs.getBoolean("emergency", false)

    fun getActiveDays(): Set<String> {
        val raw = prefs.getString("active_days", "[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\",\"Sat\"]") ?: "[]"
        val set = mutableSetOf<String>()
        try {
            val jsonArray = JSONArray(raw)
            for (i in 0 until jsonArray.length()) {
                set.add(jsonArray.getString(i))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        if (set.isEmpty()) {
            set.addAll(listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"))
        }
        return set
    }

    fun checkTamperDetected(): Boolean {
        val savedSysTime = prefs.getLong("saved_timestamp_system", 0L)
        val savedElapsedRealtime = prefs.getLong("saved_timestamp_elapsed", 0L)

        if (savedSysTime == 0L || savedElapsedRealtime == 0L) return false

        val currentSysTime = System.currentTimeMillis()
        val currentElapsedRealtime = SystemClock.elapsedRealtime()

        val sysDiff = currentSysTime - savedSysTime
        val elapsedDiff = currentElapsedRealtime - savedElapsedRealtime

        // If system time was manually altered back or forward by more than 3 minutes relative to monotonic elapsed clock
        val timeDrift = Math.abs(sysDiff - elapsedDiff)
        return timeDrift > (3 * 60 * 1000)
    }
}
