package com.mobile_controller

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class BlockOverlayActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(
            android.R.layout.simple_list_item_1 // fallback container if custom layout not loaded
        )

        val pkgName = intent.getStringExtra("packageName") ?: "This Application"
        val reason = intent.getStringExtra("reason") ?: "Institutional policy during class hours."

        val rootLayout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(60, 120, 60, 60)
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            setBackgroundColor(android.graphics.Color.parseColor("#0F172A"))
        }

        val iconText = TextView(this).apply {
            text = "🔒"
            textSize = 64f
            gravity = android.view.Gravity.CENTER
        }

        val titleText = TextView(this).apply {
            text = "Application Restricted"
            textSize = 24f
            setTextColor(android.graphics.Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
            gravity = android.view.Gravity.CENTER
            setPadding(0, 32, 0, 16)
        }

        val bodyText = TextView(this).apply {
            text = "Access to $pkgName has been restricted by your institution during active class hours."
            textSize = 15f
            setTextColor(android.graphics.Color.parseColor("#94A3B8"))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 24)
        }

        val reasonText = TextView(this).apply {
            text = "Reason: $reason"
            textSize = 13f
            setTextColor(android.graphics.Color.parseColor("#38BDF8"))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 48)
        }

        val homeButton = Button(this).apply {
            text = "Return to Home Screen"
            setBackgroundColor(android.graphics.Color.parseColor("#7C3AED"))
            setTextColor(android.graphics.Color.WHITE)
            setPadding(32, 16, 32, 16)
            setOnClickListener {
                val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(homeIntent)
                finish()
            }
        }

        rootLayout.addView(iconText)
        rootLayout.addView(titleText)
        rootLayout.addView(bodyText)
        rootLayout.addView(reasonText)
        rootLayout.addView(homeButton)

        setContentView(rootLayout)
    }

    override fun onBackPressed() {
        // Prevent back button bypass — redirect to Home screen
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }
}
