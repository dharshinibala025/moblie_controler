package com.mobile_controller

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Calendar
import java.util.concurrent.ConcurrentHashMap

class RestrictionAccessibilityService : AccessibilityService() {

    private var policyStorage: PolicyStorage? = null

    // Debounce map to avoid re-showing the overlay repeatedly for the same package.
    private val lastBlockedAt = ConcurrentHashMap<String, Long>()

    // ── Accessibility overlay window (the guaranteed block screen) ──────────
    // TYPE_ACCESSIBILITY_OVERLAY windows are ALWAYS allowed while this service is
    // bound: no SYSTEM_ALERT_WINDOW permission, no background-activity-launch
    // restrictions, appear instantly, and are auto-removed when the service stops.
    private var windowManager: WindowManager? = null
    private var blockOverlay: View? = null
    private var overlayRoot: LinearLayout? = null
    private var countdownText: TextView? = null
    private var overlayPackageLabel: TextView? = null
    private var overlayTicker: Runnable? = null
    private val overlayHandler = Handler(Looper.getMainLooper())
    private var cachedHomePackage: String? = null

    // Built-in offline fallback list so social media/games are still blocked during the
    // schedule window even if the server policy has not been synced yet.
    private val fallbackBlockedPackages = setOf(
        "com.instagram.android",
        "com.whatsapp",
        "org.telegram.messenger",
        "com.snapchat.android",
        "com.twitter.android",
        "com.facebook.katana",
        "com.facebook.orca",
        "com.google.android.youtube",
        "com.instagram.barcelona",
        "com.discord",
        "com.zhiliaoapp.musically",
        "com.pinterest",
        "com.reddit.frontpage",
        "com.linkedin.android",
        "com.likee",
        "com.badoo.mobile",
        "com.tinder",
        "com.quora.android",
        "com.tumblr",
        "com.dts.freefireth",
        "com.tencent.ig",
        "com.pubg.imobile",
        "com.netflix.mediaclient",
        "com.amazon.avod.thirdpartyclient",
        "in.startv.hotstar",
        "com.jio.media.ondemand"
    )

    override fun onCreate() {
        super.onCreate()
        policyStorage = PolicyStorage(applicationContext)
        Log.i("RestrictionService", "RestrictionAccessibilityService created")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        policyStorage = PolicyStorage(applicationContext)
        Log.i("RestrictionService", "RestrictionAccessibilityService connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        try {
            if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

            val packageName = event.packageName?.toString() ?: return

            // Ignore system UI, launcher and own package
            if (packageName == "com.mobile_controller" ||
                packageName.startsWith("com.android.systemui") ||
                packageName == "com.android.launcher"
            ) {
                return
            }

            val storage = policyStorage ?: PolicyStorage(applicationContext).also {
                policyStorage = it
            }

            // Emergency unblock always wins: never enforce the overlay during an emergency.
            if (storage.getEmergency()) {
                dismissBlockOverlay()
                return
            }

            val blockedSet = if (storage.isConfigured()) {
                // Only enforce while the policy is active. The enforced set is
                // the union of the server list + every installed app the phone
                // classifies as social/games/entertainment, so ALL social media
                // blocks even if the server list is stale or the realtime sync
                // has not reached the device yet.
                if (storage.isPolicyActive()) {
                    storage.getEnforcedApps()
                } else {
                    emptySet()
                }
            } else {
                fallbackBlockedPackages
            }

            // If the student left the blocked app (home / our own app), lift the
            // overlay so they can navigate; re-opening a blocked app re-shows it.
            if (blockOverlay != null && !blockedSet.contains(packageName)) {
                if (packageName == homePackage() || packageName.startsWith("com.android.systemui")) {
                    dismissBlockOverlay()
                    return
                }
            }

            if (blockedSet.contains(packageName)) {
                if (shouldEnforceNow()) {
                    if (shouldLaunch(packageName)) {
                        Log.w("RestrictionService", "Blocking restricted package: $packageName")
                        showBlockOverlay(packageName)
                    }
                } else {
                    Log.i("RestrictionService", "Package $packageName is restricted, but currently outside restriction schedule.")
                }
            }
        } catch (e: Exception) {
            Log.e("RestrictionService", "Error handling accessibility event", e)
        }
    }

    private fun shouldLaunch(packageName: String): Boolean {
        val now = System.currentTimeMillis()
        val last = lastBlockedAt[packageName] ?: 0L
        if (now - last < 1000) {
            return false
        }
        lastBlockedAt[packageName] = now
        // Keep the map bounded
        if (lastBlockedAt.size > 64) {
            lastBlockedAt.clear()
        }
        return true
    }

    // Manual-start semantics: blocking begins the moment the policy is applied
    // (the start time is NOT a gate). Auto-stop at the end time and the
    // configured active days still limit enforcement as a phone-side safety.
    private fun shouldEnforceNow(): Boolean {
        val storage = policyStorage ?: return true
        val end = storage.getScheduleEnd()     // e.g. "16:00"

        try {
            val endParts = end.split(":").map { it.toInt() }

            val cal = Calendar.getInstance()

            // Active-days check (e.g. "Mon".."Sat"); default when nothing stored.
            val activeDays = storage.getActiveDays()
            val dayName = cal.getDisplayName(
                Calendar.DAY_OF_WEEK,
                Calendar.SHORT,
                java.util.Locale.US
            )?.substring(0, 3) ?: ""
            if (activeDays.isNotEmpty() && !activeDays.contains(dayName)) {
                return false
            }

            val currentHour = cal.get(Calendar.HOUR_OF_DAY)
            val currentMinute = cal.get(Calendar.MINUTE)

            val currentMinutesOfDay = currentHour * 60 + currentMinute
            val endMinutesOfDay = endParts[0] * 60 + endParts[1]

            // Only the end time gates enforcement: restrictions auto-lift at the
            // end time but start immediately on apply, regardless of the clock.
            return currentMinutesOfDay < endMinutesOfDay
        } catch (e: Exception) {
            return true // Default active if parse error occurs
        }
    }

    private fun nextUnlockLabel(): String {
        val storage = policyStorage ?: return ""
        val end = storage.getScheduleEnd() // e.g. "16:00"
        return try {
            val parts = end.split(":").map { it.toInt() }
            val hour = parts[0]
            val minute = parts[1]
            val ampm = if (hour >= 12) "PM" else "AM"
            var displayHour = hour % 12
            if (displayHour == 0) displayHour = 12
            String.format("%02d:%02d %s", displayHour, minute, ampm)
        } catch (e: Exception) {
            ""
        }
    }

    // ── Block screen as an accessibility overlay window ──────────────────────

    private fun showBlockOverlay(packageName: String) {
        try {
            if (blockOverlay != null) {
                updateOverlayFor(packageName)
                return
            }

            val wm = getSystemService(WINDOW_SERVICE) as WindowManager
            val overlay = buildOverlayView(packageName)

            val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                android.graphics.PixelFormat.TRANSLUCENT
            )
            params.gravity = Gravity.TOP or Gravity.START

            wm.addView(overlay, params)
            windowManager = wm
            blockOverlay = overlay
            startOverlayCountdown()
            Log.i("RestrictionService", "Block overlay shown for $packageName")
        } catch (e: Exception) {
            Log.e("RestrictionService", "Failed to show block overlay for $packageName", e)
        }
    }

    private fun updateOverlayFor(packageName: String) {
        try {
            val label = resolveAppLabel(packageName)
            overlayPackageLabel?.text = label
        } catch (e: Exception) {
            // ignore
        }
    }

    private fun buildOverlayView(packageName: String): View {
        val storage = policyStorage ?: PolicyStorage(applicationContext).also {
            policyStorage = it
        }
        val appLabel = resolveAppLabel(packageName)
        val scheduleEnd = storage.getScheduleEnd()
        val reason = storage.getReason().ifBlank { "Institutional policy during class hours." }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0B1220"))
            setPadding(dp(24), dp(32), dp(24), dp(32))
        }
        overlayRoot = root

        // ── Frosted lock icon circle ──────────────────────────────────────────
        val iconCircle = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(dp(96), dp(96)).apply {
                bottomMargin = dp(24)
            }
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#7C3AED"), Color.parseColor("#6D28D9"))
            ).apply {
                cornerRadius = dp(48).toFloat()
            }
        }
        val lockText = TextView(this).apply {
            text = "\uD83D\uDD12"
            textSize = 40f
            gravity = Gravity.CENTER
        }
        iconCircle.addView(lockText, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))
        root.addView(iconCircle)

        val titleText = TextView(this).apply {
            text = "Application Restricted"
            textSize = 24f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(6))
        }
        root.addView(titleText)

        overlayPackageLabel = TextView(this).apply {
            text = appLabel
            textSize = 14f
            setTextColor(Color.parseColor("#C4B5FD"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(14))
        }
        root.addView(overlayPackageLabel)

        val bodyText = TextView(this).apply {
            text = "$appLabel is locked during study hours to help you stay focused on learning."
            textSize = 14f
            setTextColor(Color.parseColor("#CBD5E1"))
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.25f)
            setPadding(0, 0, 0, dp(18))
        }
        root.addView(bodyText)

        // ── Live countdown chip ───────────────────────────────────────────────
        val chip = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(18), dp(12), dp(18), dp(12))
            background = GradientDrawable().apply {
                cornerRadius = dp(16).toFloat()
                setColor(Color.parseColor("#1A0F172A"))
                setStroke(dp(1), Color.parseColor("#2A38BDF8"))
            }
        }
        val unlockLabel = TextView(this).apply {
            text = "Unlocks at ${nextUnlockLabel().ifBlank { formatTimeLabel(scheduleEnd) }}"
            textSize = 12f
            setTextColor(Color.parseColor("#93C5FD"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        chip.addView(unlockLabel)

        countdownText = TextView(this).apply {
            textSize = 30f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, dp(2), 0, 0)
        }
        chip.addView(countdownText)
        root.addView(chip)

        val reasonText = TextView(this).apply {
            text = "Reason · $reason"
            textSize = 12f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, dp(18), 0, 0)
        }
        root.addView(reasonText)

        // ── Return to Home button ─────────────────────────────────────────────
        val homeButton = Button(this).apply {
            text = "Return to Home Screen"
            setTextColor(Color.WHITE)
            isAllCaps = false
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#7C3AED"), Color.parseColor("#5B21B6"))
            ).apply {
                cornerRadius = dp(16).toFloat()
            }
            setOnClickListener {
                goHome()
                dismissBlockOverlay()
            }
        }
        val buttonWrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(0, dp(24), 0, 0)
        }
        val buttonParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(54)
        )
        buttonWrap.addView(homeButton, buttonParams)
        root.addView(buttonWrap)

        return root
    }

    private fun startOverlayCountdown() {
        overlayTicker?.let { overlayHandler.removeCallbacks(it) }
        val storage = policyStorage ?: PolicyStorage(applicationContext).also {
            policyStorage = it
        }
        val target = computeTargetMillis(storage.getScheduleEnd())
        val ticker = object : Runnable {
            override fun run() {
                if (blockOverlay == null) return
                val remaining = target - System.currentTimeMillis()
                val text = if (remaining > 0) {
                    val totalSeconds = remaining / 1000
                    val hours = totalSeconds / 3600
                    val minutes = (totalSeconds % 3600) / 60
                    val seconds = totalSeconds % 60
                    String.format("%02d:%02d:%02d", hours, minutes, seconds)
                } else {
                    "00:00:00"
                }
                countdownText?.text = text
                overlayHandler.postDelayed(this, 1000)
            }
        }
        overlayTicker = ticker
        overlayHandler.post(ticker)
    }

    private fun dismissBlockOverlay() {
        try {
            overlayTicker?.let { overlayHandler.removeCallbacks(it) }
            overlayTicker = null
            windowManager?.removeView(blockOverlay)
        } catch (e: Exception) {
            // Already removed or never added.
        } finally {
            windowManager = null
            blockOverlay = null
            overlayRoot = null
            countdownText = null
            overlayPackageLabel = null
        }
    }

    private fun homePackage(): String {
        if (cachedHomePackage != null) return cachedHomePackage!!
        try {
            val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
            val ri = packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
            cachedHomePackage = ri?.activityInfo?.packageName
        } catch (e: Exception) {
            // ignore
        }
        if (cachedHomePackage == null) cachedHomePackage = "com.android.launcher"
        return cachedHomePackage!!
    }

    private fun goHome() {
        try {
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            startActivity(homeIntent)
        } catch (e: Exception) {
            Log.e("RestrictionService", "Failed to launch home", e)
        }
    }

    private fun computeTargetMillis(scheduleEnd: String): Long {
        var target = todayAt(scheduleEnd)
        if (target <= System.currentTimeMillis()) {
            target += 24 * 60 * 60 * 1000L
        }
        return target
    }

    private fun todayAt(time: String): Long {
        val parts = time.split(":").mapNotNull { it.trim().toIntOrNull() }
        if (parts.size < 2) return System.currentTimeMillis() + 60 * 60 * 1000L
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, parts[0])
        cal.set(Calendar.MINUTE, parts[1])
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    private fun formatTimeLabel(time: String): String {
        val parts = time.split(":").mapNotNull { it.trim().toIntOrNull() }
        if (parts.size < 2) return time
        var hour = parts[0]
        val minute = parts[1]
        val ampm = if (hour >= 12) "PM" else "AM"
        hour = hour % 12
        if (hour == 0) hour = 12
        return String.format("%02d:%02d %s", hour, minute, ampm)
    }

    private fun resolveAppLabel(packageName: String): String {
        return try {
            val pm: PackageManager = applicationContext.packageManager
            pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
        } catch (e: Exception) {
            packageName
        }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    override fun onInterrupt() {}

    override fun onUnbind(intent: Intent?): Boolean {
        lastBlockedAt.clear()
        dismissBlockOverlay()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        lastBlockedAt.clear()
        dismissBlockOverlay()
        policyStorage = null
        super.onDestroy()
    }
}