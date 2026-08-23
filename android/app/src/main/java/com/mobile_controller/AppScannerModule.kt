package com.mobile_controller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityManager
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

            // Collect user-facing (launcher) packages first, resolving launchers robustly.
            val launcherPackages = resolveLauncherPackages()

            // Auto-enforce categories: while a policy is active, ONLY social
            // media apps are blocked natively. Games and entertainment are NOT
            // auto-blocked to avoid interfering with educational content.
            // System apps are always excluded.
            val autoBlockCategories = setOf("social")
            val categoryEnforcedPackages = mutableListOf<String>()

            // Sort by app label for a stable, predictable order.
            val sortedApps = appsList.sortedWith(
                compareBy { appInfo ->
                    try {
                        pm.getApplicationLabel(appInfo).toString().lowercase()
                    } catch (e: Exception) {
                        ""
                    }
                }
            )

            for (appInfo in sortedApps) {
                try {
                    // Filter to user-facing applications with a launcher intent
                    val hasLaunchIntent = launcherPackages.contains(appInfo.packageName) ||
                        pm.getLaunchIntentForPackage(appInfo.packageName) != null
                    if (!hasLaunchIntent) {
                        continue
                    }

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

                    // FLAG_IS_GAME is 1 shl 22 (0x00400000)
                    val flagIsGame = (appInfo.flags and 0x00400000) != 0
                    val categoryIsGame = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        appInfo.category == ApplicationInfo.CATEGORY_GAME
                    } else {
                        false
                    }
                    val isGame = flagIsGame || categoryIsGame
                    val isSocial = isSocialPackage(packageName, appName)
                    val category = AppClassifier.classify(packageName, appName, isGame, isSystemApp)

                    appMap.putString("appName", appName)
                    appMap.putString("packageName", packageName)
                    appMap.putString("versionName", versionName)
                    appMap.putDouble("firstInstallTime", firstInstallTime.toDouble())
                    appMap.putDouble("lastUpdateTime", lastUpdateTime.toDouble())
                    appMap.putBoolean("isSystemApp", isSystemApp)
                    appMap.putBoolean("isUserFacing", true)
                    appMap.putBoolean("isGame", isGame)
                    appMap.putBoolean("isSocial", isSocial)
                    appMap.putString("category", category)

                    // Only auto-block social media user-installed apps; never block system apps
                    if (category.lowercase() in autoBlockCategories && !isSystemApp) {
                        categoryEnforcedPackages.add(packageName)
                    }

                    resultArray.pushMap(appMap)
                } catch (e: Exception) {
                    // Skip a single problematic package instead of failing the whole scan.
                    Log.w("AppScanner", "Skipped package due to error: ${appInfo.packageName}", e)
                }
            }

            // Persist the device-classified social/games/entertainment packages
            // natively so the accessibility service enforces them whenever a
            // policy is active — even if the server/scan payload is stale.
            PolicyStorage(reactContext).saveCategoryEnforcedPackages(categoryEnforcedPackages)

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("SCAN_ERROR", e.localizedMessage, e)
        }
    }

    /**
     * Lightweight re-scan that only refreshes the auto-enforce category set
     * (social/games/entertainment) into PolicyStorage. Called from the realtime
     * rule:update handler so the accessibility service's enforced union is fresh
     * the moment staff/admin apply restrictions.
     */
    @ReactMethod
    fun refreshEnforcedCategories(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val launcherPackages = resolveLauncherPackages()
            // Only social media apps are auto-blocked; games/entertainment are excluded
            val autoBlockCategories = setOf("social")
            val categoryEnforcedPackages = mutableListOf<String>()
            val appsList: List<ApplicationInfo> = pm.getInstalledApplications(PackageManager.GET_META_DATA)

            for (appInfo in appsList) {
                try {
                    val packageName = appInfo.packageName
                    val hasLaunchIntent = launcherPackages.contains(packageName) ||
                        pm.getLaunchIntentForPackage(packageName) != null
                    if (!hasLaunchIntent) continue

                    val appName = pm.getApplicationLabel(appInfo).toString()
                    val flagIsGame = (appInfo.flags and 0x00400000) != 0
                    val categoryIsGame = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        appInfo.category == ApplicationInfo.CATEGORY_GAME
                    } else {
                        false
                    }
                    val isGame = flagIsGame || categoryIsGame
                    val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    val category = AppClassifier.classify(packageName, appName, isGame, isSystemApp)
                    // Never block system apps; only block user-installed social media apps
                    if (category.lowercase() in autoBlockCategories && !isSystemApp) {
                        categoryEnforcedPackages.add(packageName)
                    }
                } catch (e: Exception) {
                    // skip a single problematic package
                }
            }

            PolicyStorage(reactContext).saveCategoryEnforcedPackages(categoryEnforcedPackages)

            val result = Arguments.createMap()
            result.putInt("count", categoryEnforcedPackages.size)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("REFRESH_CATEGORIES_ERROR", e.localizedMessage, e)
        }
    }

    /**
     * Returns the set of packages that expose a launcher activity. On API 30+ the
     * package visibility filtering can hide launcher intents for packages without a
     * matching <queries> entry, so we query with MATCH_ALL to work around it.
     */
    private fun resolveLauncherPackages(): Set<String> {
        val launcherPackages = mutableSetOf<String>()
        try {
            val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val resolveInfos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                reactContext.packageManager.queryIntentActivities(
                    launcherIntent,
                    PackageManager.MATCH_ALL
                )
            } else {
                @Suppress("DEPRECATION")
                reactContext.packageManager.queryIntentActivities(launcherIntent, 0)
            }
            for (resolveInfo in resolveInfos) {
                val packageName = resolveInfo.activityInfo?.packageName
                if (packageName != null) {
                    launcherPackages.add(packageName)
                }
            }
        } catch (e: Exception) {
            Log.w("AppScanner", "Failed to resolve launcher packages", e)
        }
        return launcherPackages
    }

    private fun isSocialPackage(packageName: String, appName: String): Boolean {
        val knownSocial = setOf(
            "com.whatsapp",
            "com.instagram.android",
            "com.facebook.katana",
            "com.facebook.orca",
            "com.twitter.android",
            "com.snapchat.android",
            "org.telegram.messenger",
            "com.zhiliaoapp.musically",
            "com.instagram.barcelona",
            "com.discord",
            "com.likee",
            "com.pinterest",
            "com.linkedin.android",
            "com.reddit.frontpage",
            "com.tinder",
            "com.badoo.mobile",
            "com.quora.android",
            "com.tumblr",
            "com.google.android.youtube"
        )
        val pkg = packageName.lowercase()
        val name = appName.lowercase()
        if (knownSocial.contains(pkg)) return true
        if (pkg.contains("facebook") ||
            pkg.contains("instagram") ||
            pkg.contains("whatsapp") ||
            pkg.contains("twitter") ||
            pkg.contains("snapchat") ||
            pkg.contains("telegram") ||
            pkg.contains("tiktok") ||
            pkg.contains("discord") ||
            pkg.contains("pinterest")
        ) {
            return true
        }
        if (name.contains("instagram") ||
            name.contains("whatsapp") ||
            name.contains("facebook") ||
            name.contains("messenger") ||
            name.contains("telegram") ||
            name.contains("snapchat") ||
            name.contains("tiktok") ||
            name.contains("threads") ||
            name.contains("twitter") ||
            name.contains("discord")
        ) {
            return true
        }
        return false
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
        status: String,
        emergency: Boolean,
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

            val policyActive = status.equals("active", ignoreCase = true)

            // 1. Save to SharedPreferences local storage (AccessibilityService reads this)
            val policyStorage = PolicyStorage(reactContext)
            policyStorage.savePolicy(
                ruleId,
                blockedList,
                scheduleStart,
                scheduleEnd,
                daysList,
                reason,
                version,
                status,
                emergency
            )

            // 2. Call Enterprise EMM Device Policy Manager (sets package suspension if app is Device Owner)
            val mdmPolicyManager = MdmPolicyManager(reactContext)
            val mdmEnforced = mdmPolicyManager.applyAppRestrictions(blockedList, policyActive)

            val result = Arguments.createMap()
            result.putBoolean("success", true)
            result.putBoolean("mdmEnforced", mdmEnforced)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("SAVE_POLICY_ERROR", e.localizedMessage, e)
        }
    }

    @ReactMethod
    fun clearPolicy(promise: Promise) {
        try {
            val policyStorage = PolicyStorage(reactContext)
            val blockedBeforeClear = policyStorage.getBlockedApps().toList()
            policyStorage.clearPolicy()

            val mdmPolicyManager = MdmPolicyManager(reactContext)
            mdmPolicyManager.clearAppRestrictions(blockedBeforeClear)

            val result = Arguments.createMap()
            result.putBoolean("success", true)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("CLEAR_POLICY_ERROR", e.localizedMessage, e)
        }
    }

    /**
     * Returns the Firebase Cloud Messaging token for this device, or "" when
     * Firebase is not configured yet (e.g. no google-services.json). Never throws.
     */
    @ReactMethod
    fun getFcmToken(promise: Promise) {
        try {
            val task = com.google.firebase.messaging.FirebaseMessaging.getInstance().token
            task.addOnCompleteListener { completed ->
                if (completed.isSuccessful && completed.result != null) {
                    promise.resolve(completed.result)
                } else {
                    promise.resolve("")
                }
            }
            task.addOnFailureListener {
                promise.resolve("")
            }
        } catch (e: Exception) {
            promise.resolve("")
        }
    }

    /**
     * Mirrors the deviceId + auth token + base URL into native storage so the
     * background WorkManager sync can refresh the policy without the JS runtime.
     */
    @ReactMethod
    fun saveAuth(deviceId: String, authToken: String, baseUrl: String) {
        try {
            PolicyStorage(reactContext).saveAuth(deviceId, authToken, baseUrl)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expectedService = "${reactContext.packageName}/${RestrictionAccessibilityService::class.java.canonicalName}"
        val enabledServices = Settings.Secure.getString(
            reactContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        // Check for exact match or partial package match for robustness
        return enabledServices.contains(expectedService) ||
               enabledServices.contains("${reactContext.packageName}:com.mobile_controller") ||
               enabledServices.contains("com.mobile_controller/com.mobile_controller")
    }

    /**
     * True liveness check: returns true only when the accessibility service is
     * actually BOUND/RUNNING right now (not just enabled in the settings list).
     * A service can be enabled-but-dead ("Not working") — that is the #1 silent
     * cause of "accessibility is ON but apps are not blocked".
     */
    private fun isAccessibilityServiceRunning(): Boolean {
        try {
            val am = reactContext.getSystemService(AccessibilityManager::class.java)
                ?: return isAccessibilityServiceEnabled()
            val runningServices = am.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_ALL_MASK
            )
            for (info in runningServices) {
                val id = info.resolveInfo?.serviceInfo
                if (id == null) continue
                val candidate = id.packageName + "/" + id.name
                if (candidate.contains(reactContext.packageName) &&
                    candidate.contains("RestrictionAccessibilityService")
                ) {
                    return true
                }
            }
            return false
        } catch (e: Exception) {
            return isAccessibilityServiceEnabled()
        }
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
            val enabled = isAccessibilityServiceEnabled()
            val running = isAccessibilityServiceRunning()  // TRUE liveness check
            val overlay = canDrawOverlays()

            result.putBoolean("accessibilityEnabled", enabled)
            result.putBoolean("accessibilityRunning", running)  // CRITICAL
            result.putBoolean("overlayEnabled", overlay)

            // Add diagnostic info
            val diagnostic = when {
                !enabled -> "ENABLE_IN_SETTINGS"
                enabled && !running -> "SERVICE_DEAD_REENABLE"
                !overlay -> "ENABLE_OVERLAY_PERMISSION"
                else -> "OK"
            }
            result.putString("diagnostic", diagnostic)

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

    /**
     * One-tap self-test: launches the block screen directly so the student can
     * verify the native overlay works without waiting for a real restriction.
     */
    @ReactMethod
    fun testBlockOverlay() {
        try {
            val policyStorage = PolicyStorage(reactContext)
            val intent = Intent(reactContext, BlockOverlayActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra("packageName", "com.example.test.blocked")
                putExtra(
                    "reason",
                    if (policyStorage.getReason().isBlank()) "Self-test · block screen preview" else policyStorage.getReason()
                )
                putExtra("scheduleStart", policyStorage.getScheduleStart())
                putExtra("scheduleEnd", policyStorage.getScheduleEnd())
                putExtra("nextUnlockLabel", policyStorage.getScheduleEnd())
            }
            reactContext.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Live diagnostic of the native enforcement chain: permission state, stored
     * policy status and how many packages the accessibility service would block.
     */
    @ReactMethod
    fun getEnforcementState(promise: Promise) {
        try {
            val policyStorage = PolicyStorage(reactContext)
            val result = Arguments.createMap()
            result.putBoolean("accessibilityEnabled", isAccessibilityServiceEnabled())
            result.putBoolean("accessibilityRunning", isAccessibilityServiceRunning())
            result.putBoolean("overlayEnabled", canDrawOverlays())
            result.putString("status", policyStorage.getStatus())
            result.putBoolean("configured", policyStorage.isConfigured())
            result.putBoolean("emergency", policyStorage.getEmergency())
            result.putInt("blockedAppCount", policyStorage.getBlockedApps().size)
            result.putInt("categoryAppCount", policyStorage.getCategoryEnforcedPackages().size)
            result.putString("scheduleStart", policyStorage.getScheduleStart())
            result.putString("scheduleEnd", policyStorage.getScheduleEnd())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ENFORCEMENT_STATE_ERROR", e.localizedMessage, e)
        }
    }
}
