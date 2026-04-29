package ai.onyx.app

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecurePrefs(context: Context) {
  companion object {
    val defaultWakeWords: List<String> = listOf("onyx")
    private const val plainPrefsName = "onyx.node"
    private const val securePrefsName = "onyx.node.secure"
  }

  private val plain: SharedPreferences
  private val secure: SharedPreferences

  init {
    plain = context.getSharedPreferences(plainPrefsName, Context.MODE_PRIVATE)
    val masterKey = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
    secure = EncryptedSharedPreferences.create(context, securePrefsName, masterKey, EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
  }

  var displayName: String
    get() = plain.getString("displayName", null) ?: loadOrMigrateDisplayName()
    set(value) { plain.edit().putString("displayName", value).apply() }

  var wakeWords: List<String>
    get() {
      val saved = plain.getString("wakeWords", null)
      return if (saved != null) WakeWords.parseCommaSeparated(saved) else defaultWakeWords
    }
    set(value) { plain.edit().putString("wakeWords", value.joinToString(",")).apply() }

  var gatewaySessionKey: String?
    get() = secure.getString("sessionKey", null)
    set(value) { secure.edit().putString("sessionKey", value).apply() }

  var gatewayHost: String?
    get() = plain.getString("gatewayHost", null)
    set(value) { plain.edit().putString("gatewayHost", value).apply() }

  var gatewayPort: Int
    get() = plain.getInt("gatewayPort", 3001)
    set(value) { plain.edit().putInt("gatewayPort", value).apply() }

  var gatewayTls: Boolean
    get() = plain.getBoolean("gatewayTls", false)
    set(value) { plain.edit().putBoolean("gatewayTls", value).apply() }

  private fun loadOrMigrateDisplayName(): String {
    val candidate = android.os.Build.MODEL
    val existing = plain.getString("displayName", null)
    if (existing != null && existing.isNotEmpty() && existing != "Android Node") return existing
    val resolved = candidate.ifEmpty { "Android Node" }
    plain.edit().putString("displayName", resolved).apply()
    return resolved
  }
}