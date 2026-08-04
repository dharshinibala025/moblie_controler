package com.mobile_controller

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

class AppScannerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppScannerModule"
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val appsList: List<ApplicationInfo> = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val resultArray: WritableArray = Arguments.createArray()

            for (appInfo in appsList) {
                // Filter to user-facing applications with a launcher intent
                val launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName)
                if (launchIntent != null) {
                    val appMap: WritableMap = Arguments.createMap()
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    val packageName = appInfo.packageName

                    var versionName = "1.0.0"
                    var firstInstallTime = System.currentTimeMillis()
                    var lastUpdateTime = System.currentTimeMillis()
                    try {
                        val pInfo = pm.getPackageInfo(packageName, 0)
                        versionName = pInfo.versionName ?: "1.0.0"
                        firstInstallTime = pInfo.firstInstallTime
                        lastUpdateTime = pInfo.lastUpdateTime
                    } catch (e: Exception) {
                        // fallback
                    }

                    val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                    appMap.putString("appName", appName)
                    appMap.putString("packageName", packageName)
                    appMap.putString("versionName", versionName)
                    appMap.putDouble("firstInstallTime", firstInstallTime.toDouble())
                    appMap.putDouble("lastUpdateTime", lastUpdateTime.toDouble())
                    appMap.putBoolean("isSystemApp", isSystemApp)
                    appMap.putBoolean("isUserFacing", true)

                    resultArray.pushMap(appMap)
                }
            }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("SCAN_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val deviceId = Settings.Secure.getString(
                reactContext.contentResolver,
                Settings.Secure.ANDROID_ID
            ) ?: "unknown_android"
            
            val infoMap = Arguments.createMap()
            infoMap.putString("platform", "android")
            infoMap.putString("deviceId", deviceId)
            infoMap.putString("osVersion", Build.VERSION.RELEASE ?: "14")
            infoMap.putString("deviceModel", Build.MODEL ?: "Emulator")
            infoMap.putString("manufacturer", Build.MANUFACTURER ?: "Google")
            
            var appVersion = "1.0.0"
            try {
                val packageInfo = reactContext.packageManager.getPackageInfo(reactContext.packageName, 0)
                appVersion = packageInfo.versionName ?: "1.0.0"
            } catch (e: Exception) {
                // fallback
            }
            infoMap.putString("appVersion", appVersion)
            
            promise.resolve(infoMap)
        } catch (e: Exception) {
            promise.reject("DEVICE_INFO_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun savePolicy(
        ruleId: String,
        blockedApps: ReadableArray,
        scheduleStart: String,
        scheduleEnd: String,
        activeDays: ReadableArray,
        reason: String,
        version: Int,
        promise: Promise
    ) {
        try {
            val blockedList = mutableListOf<String>()
            for (i in 0 until blockedApps.size()) {
                val app = blockedApps.getString(i)
                if (app != null) {
                    blockedList.add(app)
                }
            }

            val daysList = mutableListOf<String>()
            for (i in 0 until activeDays.size()) {
                val day = activeDays.getString(i)
                if (day != null) {
                    daysList.add(day)
                }
            }

            // 1. Save to SharedPreferences local storage (AccessibilityService reads this)
            val policyStorage = PolicyStorage(reactContext)
            policyStorage.savePolicy(
                ruleId,
                blockedList,
                scheduleStart,
                scheduleEnd,
                daysList,
                reason,
                version
            )

            // 2. Call Enterprise EMM Device Policy Manager (sets package suspension if app is Device Owner)
            val mdmPolicyManager = MdmPolicyManager(reactContext)
            val mdmEnforced = mdmPolicyManager.applyAppRestrictions(blockedList, true)

            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putBoolean("mdmEnforced", mdmEnforced)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SAVE_POLICY_ERROR", e.localizedMessage, e)
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expectedService = "${reactContext.packageName}/${RestrictionAccessibilityService::class.java.canonicalName}"
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        return enabledServices.contains(expectedService) || enabledServices.contains("RestrictionAccessibilityService")
    }

    private fun canDrawOverlays(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactContext)
        } else {
            true
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val result = Arguments.createMap()
            result.putBoolean("accessibilityEnabled", isAccessibilityServiceEnabled())
            result.putBoolean("overlayEnabled", canDrawOverlays())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("CHECK_PERMISSIONS_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        try {
            val intent = android.content.Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun openOverlaySettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = android.content.Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:${reactContext.packageName}")
                ).apply {
                    addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(intent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
