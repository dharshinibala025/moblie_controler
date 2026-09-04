package com.mobile_controller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
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
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
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

    // Anti-flicker: suppress re-show for the same package for ~1s after a
    // dismiss. Prevents the "popup shows twice" caused by transient systemui
    // events during app launch transitions.
    private var lastDismissedAt: Long = 0L
    private val DISMISS_GUARD_MS = 1000L

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

    // ── Periodic re-evaluation loop ─────────────────────────────────────────
    // Polls every 2s to: dismiss the overlay when the policy is paused/inactive,
    // show it if the foreground app is blocked (resume-while-inside), and free
    // a stuck overlay that no window event dismissed.
    private val POLICY_EVAL_INTERVAL_MS = 2000L
    private var periodicHandler: Handler? = null
    private var periodicRunnable: Runnable? = null

    override fun onCreate() {
        super.onCreate()
        policyStorage = PolicyStorage(applicationContext)
        startPeriodicEval()
        Log.i("RestrictionService", "RestrictionAccessibilityService created")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        policyStorage = PolicyStorage(applicationContext)
        startPeriodicEval()
        Log.i("RestrictionService", "RestrictionAccessibilityService connected")
    }

    // ── Event handler ───────────────────────────────────────────────────────

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        try {
            if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

            // 1. Time Check: After 4:00 PM / outside 9 AM - 4 PM automatic unblock
            if (!PolicyStorage.isCollegeHours()) {
                if (blockOverlay != null) {
                    dismissBlockOverlay()
                }
                return
            }

            val packageName = event.packageName?.toString() ?: return

            val storage = policyStorage ?: PolicyStorage(applicationContext).also {
                policyStorage = it
            }

            // ── System UI: ignore — transient transition artifacts
            if (packageName.startsWith("com.android.systemui") ||
                packageName == "com.mobile_controller") {
                return
            }

            // ── Emergency unblock always wins ──────────────────────────────
            if (storage.getEmergency()) {
                dismissBlockOverlay()
                return
            }

            // 2. Settings App Access Tamper Protection (9 AM - 4 PM)
            if (packageName == "com.android.settings") {
                val rootNode = rootInActiveWindow
                if (rootNode != null && isAccessibilityOrAppSetting(rootNode)) {
                    if (shouldLaunch(packageName)) {
                        Log.w("RestrictionService", "Blocking Settings access during class hours (9 AM - 4 PM)")
                        showBlockOverlay(packageName)
                    }
                    return
                }
            }

            // ── Compute the enforced set ──────────────────────────────────
            val blockedSet = if (storage.isConfigured() && storage.isPolicyActive()) {
                storage.getEnforcedApps()
            } else {
                emptySet()
            }

            // ── Dismiss the overlay when the student navigates to ANY non-blocked app
            if (blockOverlay != null && !blockedSet.contains(packageName) && packageName != "com.android.settings") {
                dismissBlockOverlay()
                return
            }

            // 3. Restricted Apps Interception
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

    private fun isAccessibilityOrAppSetting(node: AccessibilityNodeInfo): Boolean {
        val textList = mutableListOf<String>()
        findTextNodes(node, textList)
        val keywords = listOf("Accessibility", "Installed apps", "FocusSync", "Force stop", "Uninstall")
        return textList.any { text -> keywords.any { key -> text.contains(key, ignoreCase = true) } }
    }

    private fun findTextNodes(node: AccessibilityNodeInfo?, list: MutableList<String>) {
        if (node == null) return
        if (!node.text.isNullOrEmpty()) list.add(node.text.toString())
        for (i in 0 until node.childCount) {
            findTextNodes(node.getChild(i), list)
        }
    }

    private fun shouldLaunch(packageName: String): Boolean {
        val now = System.currentTimeMillis()
        // Anti-flicker: suppress re-show within the dismiss guard window
        if (now - lastDismissedAt < DISMISS_GUARD_MS) return false
        val last = lastBlockedAt[packageName] ?: 0L
        if (now - last < 1000) return false
        lastBlockedAt[packageName] = now
        if (lastBlockedAt.size > 64) lastBlockedAt.clear()
        return true
    }

    // Blocking is only enforced when the current time falls within the
    // [scheduleStart, scheduleEnd) window on an active day. If no policy
    // is configured the service stays quiet (fail-closed).
    private fun shouldEnforceNow(): Boolean {
        val storage = policyStorage ?: return false
        val end = storage.getScheduleEnd()

        try {
            val endParts = end.split(":").map { it.toInt() }
            val cal = Calendar.getInstance()

            val activeDays = storage.getActiveDays()
            val dayName = cal.getDisplayName(
                Calendar.DAY_OF_WEEK,
                Calendar.SHORT,
                java.util.Locale.US
            )?.substring(0, 3) ?: ""
            if (activeDays.isNotEmpty() && !activeDays.contains(dayName)) return false

            val currentMinutesOfDay = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
            val endMinutesOfDay = endParts[0] * 60 + endParts[1]

            // Manual-start: "Set Restriction Timing" blocks immediately when pressed.
            // Auto-stop: Automatically unblocks at 04:00 PM (endMinutesOfDay).
            return currentMinutesOfDay < endMinutesOfDay
        } catch (e: Exception) {
            return false
        }
    }

    private fun nextUnlockLabel(): String {
        val storage = policyStorage ?: return ""
        val end = storage.getScheduleEnd()
        return try {
            val parts = end.split(":").map { it.toInt() }
            val hour = parts[0]
            val minute = parts[1]
            val ampm = if (hour >= 12) "PM" else "AM"
            var displayHour = hour % 12
            if (displayHour == 0) displayHour = 12
            String.format("%02d:%02d %s", displayHour, minute, ampm)
        } catch (e: Exception) { "" }
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

            // FOCUSABLE: by omitting FLAG_NOT_FOCUSABLE the overlay receives
            // all key events including Back so the student cannot back out.
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                android.graphics.PixelFormat.TRANSLUCENT
            )
            params.gravity = Gravity.TOP or Gravity.START

            wm.addView(overlay, params)
            windowManager = wm
            blockOverlay = overlay
            overlay.requestFocus()
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
        } catch (e: Exception) { /* ignore */ }
    }

    private fun buildOverlayView(packageName: String): View {
        val storage = policyStorage ?: PolicyStorage(applicationContext).also {
            policyStorage = it
        }
        val appLabel = resolveAppLabel(packageName)
        val scheduleEnd = storage.getScheduleEnd()
        val reason = storage.getReason().ifBlank { "During class hours to support focused learning." }

        // ── Outer full-screen background (light, non-intrusive) ─────────────
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#F1F5F9"))
            setPadding(dp(24), dp(40), dp(24), dp(40))
            isFocusable = true
            isFocusableInTouchMode = true
            isClickable = true
        }
        overlayRoot = root

        // Intercept Back button so the student cannot escape via hardware back
        root.setOnKeyListener { _, keyCode, event ->
            if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
                goHome()
                true
            } else {
                false
            }
        }

        // ── Card container (white, rounded, elevated shadow) ─────────────────
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(36), dp(28), dp(32))
            background = GradientDrawable().apply {
                cornerRadius = dp(24).toFloat()
                setColor(Color.WHITE)
                setStroke(dp(1), Color.parseColor("#E2E8F0"))
            }
            elevation = dp(6).toFloat()
        }

        // ── Lock icon circle ─────────────────────────────────────────────────
        val iconCircle = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(dp(80), dp(80)).apply {
                bottomMargin = dp(20)
            }
            background = GradientDrawable().apply {
                cornerRadius = dp(40).toFloat()
                setColor(Color.parseColor("#EEF2FF"))
                setStroke(dp(2), Color.parseColor("#C7D2FE"))
            }
        }
        val lockEmoji = TextView(this).apply {
            text = "\uD83D\uDD12"
            textSize = 34f
            gravity = Gravity.CENTER
        }
        iconCircle.addView(lockEmoji, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))
        card.addView(iconCircle)

        // ── Title ─────────────────────────────────────────────────────────────
        val titleText = TextView(this).apply {
            text = "Application Restricted"
            textSize = 22f
            setTextColor(Color.parseColor("#0F172A"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(6))
        }
        card.addView(titleText)

        // ── App name label ────────────────────────────────────────────────────
        overlayPackageLabel = TextView(this).apply {
            text = appLabel
            textSize = 14f
            setTextColor(Color.parseColor("#4F46E5"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(14))
        }
        card.addView(overlayPackageLabel)

        // ── Body text ─────────────────────────────────────────────────────────
        val bodyText = TextView(this).apply {
            text = "$appLabel is restricted during class hours. $reason"
            textSize = 13f
            setTextColor(Color.parseColor("#475569"))
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.3f)
            setPadding(0, 0, 0, dp(20))
        }
        card.addView(bodyText)

        // ── Live countdown chip (light blue) ──────────────────────────────────
        val chip = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(20), dp(14), dp(20), dp(14))
            background = GradientDrawable().apply {
                cornerRadius = dp(14).toFloat()
                setColor(Color.parseColor("#EFF6FF"))
                setStroke(dp(1), Color.parseColor("#BFDBFE"))
            }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(4) }
        }
        val unlockLabel = TextView(this).apply {
            text = "Unlocks at ${formatTimeLabel(scheduleEnd)}"
            textSize = 11f
            setTextColor(Color.parseColor("#2563EB"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            letterSpacing = 0.04f
        }
        chip.addView(unlockLabel)

        countdownText = TextView(this).apply {
            textSize = 32f
            setTextColor(Color.parseColor("#0F172A"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, dp(4), 0, 0)
        }
        chip.addView(countdownText)
        card.addView(chip)

        // ── Reason/info small text ────────────────────────────────────────────
        val reasonText = TextView(this).apply {
            text = "Administered by your institution · Contact staff for assistance"
            textSize = 11f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, dp(16), 0, dp(16))
        }
        card.addView(reasonText)

        // ── Divider ───────────────────────────────────────────────────────────
        val divider = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(1)
            ).apply { bottomMargin = dp(16) }
            setBackgroundColor(Color.parseColor("#F1F5F9"))
        }
        card.addView(divider)

        // ── Return to Home Screen button ──────────────────────────────────────
        val homeButton = Button(this).apply {
            text = "Return to Home Screen"
            setTextColor(Color.WHITE)
            isAllCaps = false
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable().apply {
                cornerRadius = dp(14).toFloat()
                setColor(Color.parseColor("#2563EB"))
            }
            setPadding(0, 0, 0, 0)
            setOnClickListener {
                goHome()
                dismissBlockOverlay()
            }
        }
        val buttonParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            dp(52)
        )
        card.addView(homeButton, buttonParams)

        // Add the card into root
        val cardParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        root.addView(card, cardParams)

        return root
    }

    // ── Countdown ───────────────────────────────────────────────────────────

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
            val intent = Intent("com.mobile_controller.ACTION_DISMISS_BLOCK_OVERLAY").apply {
                setPackage(packageName)
            }
            sendBroadcast(intent)
        } catch (e: Exception) { /* ignore */ }
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
            lastDismissedAt = System.currentTimeMillis()
        }
    }

    // ── Periodic re-evaluation (2s) ─────────────────────────────────────────
    // Covers three cases no single window event can handle:
    //   1. Pause/unblock while the overlay is showing (no event fires).
    //   2. Resume/block while the student is already inside a blocked app.
    //   3. Missed events or the overlay was stuck by a race.

    private fun startPeriodicEval() {
        stopPeriodicEval()
        periodicHandler = Handler(Looper.getMainLooper())
        val runnable = object : Runnable {
            override fun run() {
                periodicallyReevaluate()
                periodicHandler?.postDelayed(this, POLICY_EVAL_INTERVAL_MS)
            }
        }
        periodicRunnable = runnable
        periodicHandler?.postDelayed(runnable, POLICY_EVAL_INTERVAL_MS)
    }

    private fun stopPeriodicEval() {
        periodicRunnable?.let { periodicHandler?.removeCallbacks(it) }
        periodicRunnable = null
        periodicHandler = null
    }

    private fun periodicallyReevaluate() {
        try {
            val storage = policyStorage ?: return

            // AUTO-RECOVERY: If service is dead but policy is active, attempt recovery
            if (blockOverlay == null && storage.isPolicyActive() && shouldEnforceNow() && !isAccessibilityServiceRunning()) {
                Log.w("RestrictionService", "Service dead but policy active - attempting recovery")
                stopPeriodicEval()
                startPeriodicEval()
                return
            }

            // 1. If the overlay is showing but enforcement is over → dismiss
            //    (handles: admin/staff paused, end-time passed, emergency).
            if (blockOverlay != null && !storage.isPolicyActive()) {
                dismissBlockOverlay()
                return
            }
            if (blockOverlay != null && storage.getEmergency()) {
                dismissBlockOverlay()
                return
            }
            if (blockOverlay != null && !shouldEnforceNow()) {
                dismissBlockOverlay()
                return
            }

            // 2. If the overlay is NOT showing and a policy IS active, check
            //    the current foreground app.  If it is blocked → show overlay
            //    immediately (handles: resume-while-inside, missed events).
            if (blockOverlay == null && storage.isPolicyActive() && shouldEnforceNow()) {
                val blockedSet = storage.getEnforcedApps()
                val node = rootInActiveWindow
                val fgPkg = node?.packageName?.toString()
                if (fgPkg != null &&
                    fgPkg != "com.mobile_controller" &&
                    !fgPkg.startsWith("com.android.systemui") &&
                    blockedSet.contains(fgPkg) &&
                    shouldLaunch(fgPkg)
                ) {
                    showBlockOverlay(fgPkg)
                }
            }
        } catch (e: Exception) {
            // ignore — non-critical background eval
        }
    }

    // ── Home / utility ──────────────────────────────────────────────────────

    private fun homePackage(): String {
        if (cachedHomePackage != null) return cachedHomePackage!!
        try {
            val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
            val ri = packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
            cachedHomePackage = ri?.activityInfo?.packageName
        } catch (e: Exception) { /* ignore */ }
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

    // TRUE liveness check: returns true only when the accessibility service is
    // actually BOUND/RUNNING right now (not just enabled in the settings list).
    // A service can be enabled-but-dead ("Not working") — that is the #1 silent
    // cause of "accessibility is ON but apps are not blocked".
    private fun isAccessibilityServiceRunning(): Boolean {
        try {
            val am = getSystemService(AccessibilityManager::class.java) as AccessibilityManager?
                ?: return false
            val runningServices = am.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_ALL_MASK
            )
            for (info in runningServices) {
                val id = info.resolveInfo?.serviceInfo
                if (id == null) continue
                val candidate = id.packageName + "/" + id.name
                if (candidate.contains(packageName) &&
                    candidate.contains("RestrictionAccessibilityService")
                ) {
                    return true
                }
            }
            return false
        } catch (e: Exception) {
            return false
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
        } catch (e: Exception) { packageName }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    override fun onInterrupt() {}

    override fun onUnbind(intent: Intent?): Boolean {
        stopPeriodicEval()
        lastBlockedAt.clear()
        dismissBlockOverlay()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        stopPeriodicEval()
        lastBlockedAt.clear()
        dismissBlockOverlay()
        policyStorage = null
        super.onDestroy()
    }
}