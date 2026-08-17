package com.mobile_controller

/**
 * Lightweight heuristic classifier that maps an installed package into one of the
 * categories used by the backend (see ScannedApp.category):
 *   social, entertainment, games, educational, productivity, utilities, uncategorized
 */
object AppClassifier {

    private val SOCIAL_PACKAGES = setOf(
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
        "com.google.android.youtube",
        "com.snapchat.android"
    )

    private val ENTERTAINMENT_PACKAGES = setOf(
        "com.netflix.mediaclient",
        "com.netmirror",
        "in.startv.hotstar",
        "com.jio.media.ondemand",
        "com.sun.nxt",
        "com.amazon.avod.thirdpartyclient",
        "com.airtel.tv",
        "com.graymatrix.did",
        "com.spotify.music",
        "com.gaana.app",
        "com.apple.android.music"
    )

    private val GAMES_PACKAGES = setOf(
        "com.dts.freefireth",
        "com.tencent.ig",
        "com.pubg.imobile",
        "com.supercell.clashofclans",
        "com.supercell.brawlstars",
        "com.roblox.client",
        "com.mojang.minecraftpe",
        "com.miniclip.eightballpool",
        "com.mobile.legends",
        "com.mlbb.mobilelegends"
    )

    private val EDUCATIONAL_PACKAGES = setOf(
        "com.google.android.apps.classroom",
        "com.google.android.apps.docs.editors.docs",
        "com.microsoft.office.word",
        "com.microsoft.office.excel",
        "com.microsoft.office.powerpoint",
        "com.microsoft.teams",
        "us.zoom.videomeetings",
        "com.byjus.thelearningapp",
        "in.org.npie.cgpv2",
        "com.doubtnutapp",
        "com.vedantu",
        "com.khanacademy.android",
        "com.coursera.android",
        "com.udemy.android",
        "com.duolingo"
    )

    private val PRODUCTIVITY_PACKAGES = setOf(
        "com.google.android.apps.photos",
        "com.google.android.gm",
        "com.google.android.apps.maps",
        "com.whatsapp",
        "com.google.android.calendar",
        "com.microsoft.office.outlook",
        "com.todoist",
        "com.notion.id"
    )

    private val UTILITIES_PACKAGES = setOf(
        "com.android.settings",
        "com.android.dialer",
        "com.google.android.apps.messaging",
        "com.android.contacts",
        "com.google.android.deskclock",
        "com.google.android.apps.nexuslauncher",
        "com.android.calculator2",
        "com.google.android.apps.tachyon"
    )

    fun classify(packageName: String, appName: String, isGame: Boolean, isSystemApp: Boolean): String {
        val pkg = packageName.lowercase()
        val name = appName.lowercase()

        if (isGame || pkg in GAMES_PACKAGES || name.contains("game") || pkg.contains("game")) {
            return "games"
        }
        if (pkg in SOCIAL_PACKAGES || isSocial(pkg, name)) {
            return "social"
        }
        if (pkg in ENTERTAINMENT_PACKAGES || pkg.contains("hotstar") || pkg.contains("netflix") ||
            pkg.contains("jio") || pkg.contains("spotify") || name.contains("music") ||
            name.contains("video") || name.contains("streaming")
        ) {
            return "entertainment"
        }
        if (pkg in EDUCATIONAL_PACKAGES || pkg.contains("classroom") || pkg.contains("khan") ||
            pkg.contains("byjus") || pkg.contains("zoom") || pkg.contains("teams") ||
            name.contains("classroom") || name.contains("learn") || name.contains("study")
        ) {
            return "educational"
        }
        if (pkg in PRODUCTIVITY_PACKAGES || name.contains("drive") || name.contains("docs") ||
            name.contains("sheets") || name.contains("slides") || name.contains("calendar") ||
            name.contains("note") || name.contains("mail") || name.contains("meet")
        ) {
            return "productivity"
        }
        if (isSystemApp || pkg in UTILITIES_PACKAGES || name.contains("settings") ||
            name.contains("clock") || name.contains("calculator") || name.contains("contacts")
        ) {
            return "utilities"
        }
        return "uncategorized"
    }

    private fun isSocial(pkg: String, name: String): Boolean {
        if (pkg.contains("facebook") ||
            pkg.contains("instagram") ||
            pkg.contains("whatsapp") ||
            pkg.contains("twitter") ||
            pkg.contains("snapchat") ||
            pkg.contains("telegram") ||
            pkg.contains("tiktok") ||
            pkg.contains("discord") ||
            pkg.contains("pinterest") ||
            pkg.contains("youtube")
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
            name.contains("discord") ||
            name.contains("youtube")
        ) {
            return true
        }
        return false
    }
}
