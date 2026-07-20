# Implementation Plan - Fix Android Build and Device Errors

The goal is to resolve the `No connected devices!` error and the Gradle build failure (`AndroidLocationsBuildService`) so that the React Native app can be run on an Android emulator.

## User Review Required

> [!IMPORTANT]
> I will attempt to create an Android Virtual Device (AVD) using the command line. If your system's virtualization settings (like HAXM or WHPX) are not enabled, the emulator may fail to start. In that case, you might need to enable them in your BIOS/Windows features or create the emulator via the Android Studio UI.

## Proposed Changes

### Build Configuration [MODIFY]

#### [gradle.properties](file:///D:/Mobile_Controller/android/gradle.properties)
- Explicitly set `org.gradle.java.home` to the detected JBR path (`D:/Android/jbr`).
- Set `org.gradle.java.installations.auto-detect=false` to stop Gradle from scanning `D:\` for invalid Java installations.
- Set `org.gradle.java.installations.paths=D:/Android/jbr` to limit where Gradle looks for Java.

#### [local.properties](file:///D:/Mobile_Controller/android/local.properties)
- Ensure `sdk.dir` is correctly set to `C:\Users\Dharshini\AppData\Local\Android\Sdk`.

### Environment Variables
- I will attempt to run subsequent commands with `ANDROID_SDK_ROOT` and `ANDROID_USER_HOME` explicitly defined to resolve the `AndroidLocationsBuildService` error.

### Emulator Creation
- Create a new AVD named `Pixel_37` using the `system-images;android-37.1;google_apis_playstore_ps16k;x86_64` image which is already installed.

## Verification Plan

### Automated Tests
1. Run `./gradlew :app:tasks` to verify that the project can be evaluated without errors.
2. Run `emulator -list-avds` to verify the new AVD exists.
3. Attempt to start the emulator using `emulator -avd Pixel_37 -no-window -no-audio` (or suggest the user starts it).

### Manual Verification
1. Once the emulator is running, run `npx react-native run-android` to confirm the app can be installed and launched.
