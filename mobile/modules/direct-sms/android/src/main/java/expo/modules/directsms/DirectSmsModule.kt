package expo.modules.directsms

import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DirectSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DirectSms")

    AsyncFunction("sendDirectSms") { phoneNumber: String, message: String ->
      try {
        val cleanPhone = phoneNumber.trim().replace(" ", "").replace("-", "")
        if (cleanPhone.isEmpty()) {
          return@AsyncFunction false
        }

        val context = appContext.reactContext ?: appContext.applicationContext

        // Resilient SmsManager resolution: try modern getSystemService, fallback to default, handles Dual SIM safely
        val smsManager: SmsManager = try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val defaultSubId = SubscriptionManager.getDefaultSmsSubscriptionId()
            if (defaultSubId != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
              context?.getSystemService(SmsManager::class.java)?.createForSubscriptionId(defaultSubId)
                ?: context?.getSystemService(SmsManager::class.java)
                ?: @Suppress("DEPRECATION") SmsManager.getDefault()
            } else {
              context?.getSystemService(SmsManager::class.java)
                ?: @Suppress("DEPRECATION") SmsManager.getDefault()
            }
          } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
          }
        } catch (subErr: Throwable) {
          @Suppress("DEPRECATION")
          SmsManager.getDefault()
        }

        val parts = smsManager.divideMessage(message)
        if (parts != null && parts.size > 1) {
          smsManager.sendMultipartTextMessage(cleanPhone, null, parts, null, null)
        } else {
          smsManager.sendTextMessage(cleanPhone, null, message, null, null)
        }
        true
      } catch (e: Throwable) {
        android.util.Log.e("DirectSms", "Failed to send direct SMS to $phoneNumber: ${e.message}", e)
        false
      }
    }
  }
}

