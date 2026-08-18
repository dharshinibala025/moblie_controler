package com.mobile_controller

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONArray
import org.json.JSONObject

/**
 * Background policy refresh (WorkManager fallback channel).
 *
 * Even when FCM is unavailable or the app is killed, this worker periodically
 * fetches the latest policy from /policy/latest and writes it to PolicyStorage,
 * so blocking still lands on locked phones (within the worker interval).
 */
class PolicySyncWorker(appContext: Context, workerParams: WorkerParameters) :
    Worker(appContext, workerParams) {

    override fun doWork(): Result {
        val policyStorage = PolicyStorage(applicationContext)
        val deviceId = policyStorage.getDeviceId()
        val authToken = policyStorage.getAuthToken()
        val baseUrl = policyStorage.getBaseUrl()

        // Nothing mirrored yet (user hasn't opened the app since login) -> wait.
        if (deviceId.isEmpty() || authToken.isEmpty()) return Result.retry()

        return try {
            val url = URL("$baseUrl/policy/latest?deviceId=$deviceId&syncType=background")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            conn.setRequestProperty("Authorization", "Bearer $authToken")
            conn.setRequestProperty("Content-Type", "application/json")

            val code = conn.responseCode
            if (code == 200) {
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                val policy = JSONObject(body)
                val blocked = parseArray(policy.optString("blockedPackages", "[]"))
                val days = parseArray(policy.optString("activeDays", "[]"))

                policyStorage.savePolicy(
                    ruleId = policy.optString("ruleId", ""),
                    blockedApps = blocked,
                    scheduleStart = policy.optString("scheduleStart", "09:00"),
                    scheduleEnd = policy.optString("scheduleEnd", "16:00"),
                    activeDays = if (days.isEmpty()) listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat") else days,
                    reason = policy.optString("restrictionReason", ""),
                    version = policy.optInt("policyVersion", 1),
                    status = policy.optString("status", "inactive"),
                    emergency = policy.optString("emergency", "inactive") == "active"
                )
                Result.success()
            } else if (code == 401 || code == 403) {
                // Token expired/revoked — stop until the app reopens and re-mirrors.
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private fun parseArray(raw: String): List<String> {
        return try {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { arr.getString(it) }
        } catch (e: Exception) {
            emptyList()
        }
    }
}