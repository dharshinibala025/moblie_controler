package com.mobile_controller

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import org.json.JSONArray
import org.json.JSONObject

class PolicyStorage(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("smart_classroom_policy_prefs", Context.MODE_PRIVATE)

    fun savePolicy(ruleId: String, blockedApps: List<String>, scheduleStart: String, scheduleEnd: String, activeDays: List<String>, reason: String, version: Int) {
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
            .putLong("saved_timestamp_system", System.currentTimeMillis())
            .putLong("saved_timestamp_elapsed", elapsedRealtimeAtSave)
            .apply()
    }

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

    fun getScheduleStart(): String = prefs.getString("schedule_start", "09:00") ?: "09:00"
    fun getScheduleEnd(): String = prefs.getString("schedule_end", "16:00") ?: "16:00"
    fun getReason(): String = prefs.getString("reason", "") ?: ""
    fun getRuleId(): String = prefs.getString("rule_id", "") ?: ""
    fun getVersion(): Int = prefs.getInt("version", 1)

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
