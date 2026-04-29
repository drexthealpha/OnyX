package ai.onyx.app.gateway

import java.net.InetAddress
import java.net.NetworkInterface

object BonjourEscapes {
  fun escapeDeviceName(name: String): String {
    return name.replace("'", "\\'").replace(",", "\\,")
  }

  fun unescapeDeviceName(name: String): String {
    return name.replace("\\'", "'").replace("\\,", ",")
  }
}

data class DeviceAuthPayload(
  val requestId: String,
  val deviceName: String,
  val publicKey: String,
  val timestamp: Long
)

class DeviceAuthStore {
  private val pendingAuthorizations = mutableMapOf<String, DeviceAuthPayload>()
  private val authorizedDevices = mutableMapOf<String, DeviceAuthPayload>()

  fun addPendingAuth(payload: DeviceAuthPayload) {
    pendingAuthorizations[payload.requestId] = payload
  }

  fun getPendingAuth(requestId: String): DeviceAuthPayload? = pendingAuthorizations[requestId]

  fun approve(deviceId: String) {
    val auth = pendingAuthorizations.remove(deviceId) ?: return
    authorizedDevices[deviceId] = auth
  }

  fun revoke(deviceId: String) {
    authorizedDevices.remove(deviceId)
  }

  fun isAuthorized(deviceId: String): Boolean = authorizedDevices.containsKey(deviceId)

  fun getAllAuthorized(): List<DeviceAuthPayload> = authorizedDevices.values.toList()
}