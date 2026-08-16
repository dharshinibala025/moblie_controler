package com.mobile_controller

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context

class MdmPolicyManager(private val context: Context) {

    private val dpm: DevicePolicyManager =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val adminComponent = ComponentName(context, DeviceAdminReceiver::class.java)

    fun isDeviceOwner(): Boolean {
        return dpm.isDeviceOwnerApp(context.packageName)
    }

    fun applyAppRestrictions(packages: List<String>, suspend: Boolean): Boolean {
        if (!isDeviceOwner()) {
            return false // Fallback to AccessibilityService on non-managed BYOD devices
        }

        return try {
            val packageArray = packages.toTypedArray()
            dpm.setPackagesSuspended(adminComponent, packageArray, suspend)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun clearAppRestrictions(packages: List<String>): Boolean {
        if (!isDeviceOwner()) {
            return false
        }
        return try {
            val packageArray = packages.toTypedArray()
            dpm.setPackagesSuspended(adminComponent, packageArray, false)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
