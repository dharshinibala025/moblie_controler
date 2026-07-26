package com.mobile_controller

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
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
                    try {
                        val pInfo = pm.getPackageInfo(packageName, 0)
                        versionName = pInfo.versionName ?: "1.0.0"
                    } catch (e: Exception) {
                        // fallback
                    }

                    appMap.putString("appName", appName)
                    appMap.putString("packageName", packageName)
                    appMap.putString("versionName", versionName)
                    appMap.putBoolean("isUserFacing", true)

                    resultArray.pushMap(appMap)
                }
            }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("SCAN_ERROR", e.localizedMessage, e)
        }
    }
}
