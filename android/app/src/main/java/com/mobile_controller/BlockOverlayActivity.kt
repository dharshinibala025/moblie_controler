package com.mobile_controller

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.util.Calendar

class BlockOverlayActivity : AppCompatActivity() {

    private val handler = Handler(Looper.getMainLooper())
    private var countdownTicker: Runnable? = null
    private var countdownText: TextView? = null

    private val dismissReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if ("com.mobile_controller.ACTION_DISMISS_BLOCK_OVERLAY" == intent?.action) {
                finish()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            val filter = android.content.IntentFilter("com.mobile_controller.ACTION_DISMISS_BLOCK_OVERLAY")
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(dismissReceiver, filter)
            }
        } catch (e: Exception) { /* ignore */ }

        val packageName = intent.getStringExtra("packageName") ?: "this application"
        val reason = intent.getStringExtra("reason") ?: "Institutional policy during class hours."
        val scheduleEnd = intent.getStringExtra("scheduleEnd") ?: "16:00"
        val nextUnlockLabel = intent.getStringExtra("nextUnlockLabel") ?: formatTimeLabel(scheduleEnd)
        val appLabel = resolveAppLabel(packageName)

        // ── Root scrim with a subtle background gradient ──────────────────────
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                intArrayOf(Color.parseColor("#1E293B"), Color.parseColor("#0B1220"))
            )
        }

        val scroll = ScrollView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            isFillViewport = true
        }

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(24), dp(40), dp(24), dp(32))
        }
        scroll.addView(content)

        // ── Frosted glass card ────────────────────────────────────────────────
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(28), dp(32), dp(28), dp(28))
            background = GradientDrawable().apply {
                cornerRadius = dp(28).toFloat()
                setColors(intArrayOf(0x33FFFFFF, 0x1FFFFFFF))
                setStroke(dp(1), Color.parseColor("#4DFFFFFF"))
            }
            elevation = dp(16).toFloat()
            outlineProvider = ViewOutlineProvider.BACKGROUND
        }

        // ── Frosted lock icon circle ──────────────────────────────────────────
        val iconCircle = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(dp(96), dp(96)).apply {
                bottomMargin = dp(24)
            }
            background = GradientDrawable(GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#7C3AED"), Color.parseColor("#6D28D9"))).apply {
                cornerRadius = dp(48).toFloat()
            }
        }
        val lockText = TextView(this).apply {
            text = "🔒"
            textSize = 40f
            gravity = Gravity.CENTER
        }
        iconCircle.addView(lockText, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))
        card.addView(iconCircle)

        val titleText = TextView(this).apply {
            text = "Application Restricted"
            textSize = 24f
            setTextColor(Color.WHITE)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(6))
        }
        card.addView(titleText)

        val appLabelText = TextView(this).apply {
            text = appLabel
            textSize = 14f
            setTextColor(Color.parseColor("#C4B5FD"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(14))
        }
        card.addView(appLabelText)

        val bodyText = TextView(this).apply {
            text = "$appLabel is locked during study hours to help you stay focused on learning."
            textSize = 14f
            setTextColor(Color.parseColor("#CBD5E1"))
            gravity = Gravity.CENTER
            setLineSpacing(0f, 1.25f)
            setPadding(0, 0, 0, dp(18))
        }
        card.addView(bodyText)

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
            text = "Unlocks at $nextUnlockLabel"
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
        card.addView(chip)

        // Reason chip
        val reasonText = TextView(this).apply {
            text = "Reason · $reason"
            textSize = 12f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, dp(18), 0, 0)
        }
        card.addView(reasonText)

        // ── Gradient CTA button ───────────────────────────────────────────────
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
            setOnClickListener { goHome() }
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
        card.addView(buttonWrap)

        content.addView(card)

        root.addView(scroll)
        setContentView(root)

        startCountdown(scheduleEnd)
    }

    override fun onResume() {
        super.onResume()
        startCountdown(intent.getStringExtra("scheduleEnd") ?: "16:00")
    }

    override fun onPause() {
        super.onPause()
        countdownTicker?.let { handler.removeCallbacks(it) }
        countdownTicker = null
    }

    override fun onDestroy() {
        try {
            unregisterReceiver(dismissReceiver)
        } catch (e: Exception) { /* ignore */ }
        countdownTicker?.let { handler.removeCallbacks(it) }
        countdownTicker = null
        super.onDestroy()
    }

    private fun startCountdown(scheduleEnd: String) {
        countdownTicker?.let { handler.removeCallbacks(it) }

        val target = computeTargetMillis(scheduleEnd)
        val ticker = object : Runnable {
            override fun run() {
                val remaining = target - System.currentTimeMillis()
                if (remaining > 0) {
                    val totalSeconds = remaining / 1000
                    val hours = totalSeconds / 3600
                    val minutes = (totalSeconds % 3600) / 60
                    val seconds = totalSeconds % 60
                    countdownText?.text = String.format("%02d:%02d:%02d", hours, minutes, seconds)
                    handler.postDelayed(this, 1000)
                } else {
                    countdownText?.text = "00:00:00"
                }
            }
        }
        countdownTicker = ticker
        handler.post(ticker)
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

    private fun goHome() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    override fun onBackPressed() {
        goHome()
    }
}
