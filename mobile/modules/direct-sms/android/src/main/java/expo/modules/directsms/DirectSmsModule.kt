package expo.modules.directsms

import android.os.Build
import android.telephony.SmsManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DirectSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DirectSms")

    AsyncFunction("sendDirectSms") { phoneNumber: String, message: String ->
      try {
        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          appContext.reactContext?.getSystemService(SmsManager::class.java)
            ?: @Suppress("DEPRECATION") SmsManager.getDefault()
        } else {
          @Suppress("DEPRECATION")
          SmsManager.getDefault()
        }

        val parts = smsManager.divideMessage(message)
        if (parts.size > 1) {
          smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
        } else {
          smsManager.sendTextMessage(phoneNumber, null, message, null, null)
        }
        true
      } catch (e: Exception) {
        android.util.Log.e("DirectSms", "Failed to send direct SMS: ${e.message}", e)
        false
      }
    }
  }
}
