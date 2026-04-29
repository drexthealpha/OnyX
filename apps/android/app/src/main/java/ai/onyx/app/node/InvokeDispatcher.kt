package ai.onyx.app.node

import ai.onyx.app.NodeRuntime

class InvokeDispatcher(private val runtime: NodeRuntime) {
  private val handlers = mutableMapOf<String, Any>()

  fun register(command: String, handler: Any) {
    handlers[command] = handler
  }

  fun dispatch(command: String, args: Map<String, Any>): Any? {
    val handler = handlers[command] ?: return null
    return handler
  }
}

class DeviceHandler(private val runtime: NodeRuntime) {
  fun getInfo(): Map<String, Any> = mapOf(
    "model" to android.os.Build.MODEL,
    "manufacturer" to android.os.Build.MANUFACTURER,
    "version" to android.os.Build.VERSION.RELEASE
  )
}

class SystemHandler(private val runtime: NodeRuntime) {
  fun getInfo(): Map<String, Any> = mapOf(
    "os" to "Android",
    "version" to android.os.Build.VERSION.SDK_INT
  )
}

class CameraHandler(private val runtime: NodeRuntime) {
  fun capturePhoto(): Map<String, Any> = mapOf("path" to "", "success" to false)
}

class LocationHandler(private val runtime: NodeRuntime) {
  fun getCurrent(): Map<String, Any> = mapOf("lat" to 0.0, "lng" to 0.0)
}

class CalendarHandler(private val runtime: NodeRuntime) {
  fun listEvents(): List<Map<String, Any>> = emptyList()
}

class ContactsHandler(private val runtime: NodeRuntime) {
  fun list(): List<Map<String, Any>> = emptyList()
}

class PhotosHandler(private val runtime: NodeRuntime) {
  fun list(): List<Map<String, Any>> = emptyList()
}

class NotificationsHandler(private val runtime: NodeRuntime) {
  fun list(): List<Map<String, Any>> = emptyList()
}

class MotionHandler(private val runtime: NodeRuntime) {
  fun start(): Boolean = true
  fun stop(): Boolean = true
}

class SmsHandler(private val runtime: NodeRuntime, private val enabled: Boolean) {
  fun send(): Map<String, Any> = mapOf("success" to false)
}

class CallLogHandler(private val runtime: NodeRuntime, private val enabled: Boolean) {
  fun list(): List<Map<String, Any>> = emptyList()
}