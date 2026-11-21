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
        val trimmed = phoneNumber.trim()
        val cleanPhone = if (trimmed.startsWith("+")) {
          "+" + trimmed.substring(1).filter { it.isDigit() }
        } else {
          trimmed.filter { it.isDigit() }
        }
        if (cleanPhone.length < 7) {
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

        try {
          val parts = smsManager.divideMessage(message)
          if (parts != null && parts.size > 1) {
            smsManager.sendMultipartTextMessage(cleanPhone, null, parts, null, null)
          } else {
            smsManager.sendTextMessage(cleanPhone, null, message, null, null)
          }
        } catch (dispatchErr: Throwable) {
          android.util.Log.w("DirectSms", "Primary send failed, fallback to SmsManager.getDefault(): ${dispatchErr.message}")
          val fallbackManager = @Suppress("DEPRECATION") SmsManager.getDefault()
          val fallbackParts = fallbackManager.divideMessage(message)
          if (fallbackParts != null && fallbackParts.size > 1) {
            fallbackManager.sendMultipartTextMessage(cleanPhone, null, fallbackParts, null, null)
          } else {
            fallbackManager.sendTextMessage(cleanPhone, null, message, null, null)
          }
        }
        true
      } catch (e: Throwable) {
        android.util.Log.e("DirectSms", "Failed to send direct SMS to $phoneNumber: ${e.message}", e)
        false
      }
    }
  }
}

