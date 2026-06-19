package com.healwindrivernew

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    createNotificationChannels()
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }

  // Android 8+ requires channels to exist before notifications can display.
  // The backend pushes use "healwin_channel" (general) and
  // "healwin_dispatch_channel" (ringing dispatch alerts) — create both, else
  // background/quit notifications are silently dropped.
  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java) ?: return

    val general = NotificationChannel(
      "healwin_channel",
      "HealWin Notifications",
      NotificationManager.IMPORTANCE_HIGH,
    )
    general.enableVibration(true)
    general.description = "General updates"
    manager.createNotificationChannel(general)

    val dispatch = NotificationChannel(
      "healwin_dispatch_channel",
      "Dispatch Alerts",
      NotificationManager.IMPORTANCE_HIGH,
    )
    dispatch.enableVibration(true)
    dispatch.vibrationPattern = longArrayOf(0, 400, 200, 400, 200, 400)
    dispatch.description = "Incoming ambulance dispatch alerts"
    manager.createNotificationChannel(dispatch)
  }
}
