package ai.onyx.app

import android.content.Context
import android.util.Log
import ai.onyx.app.gateway.GatewaySession
import ai.onyx.app.node.InvokeDispatcher
import ai.onyx.app.node.CalendarHandler
import ai.onyx.app.node.CallLogHandler
import ai.onyx.app.node.CameraHandler
import ai.onyx.app.node.ContactsHandler
import ai.onyx.app.node.DeviceHandler
import ai.onyx.app.node.LocationHandler
import ai.onyx.app.node.MotionHandler
import ai.onyx.app.node.NotificationsHandler
import ai.onyx.app.node.PhotosHandler
import ai.onyx.app.node.SmsHandler
import ai.onyx.app.node.SystemHandler
import ai.onyx.app.protocol.OnyxCapability

class NodeRuntime(private val context: Context, private val prefs: SecurePrefs) {
  private val tag = "OnyxCanvas"

  @Volatile var gatewaySession: GatewaySession? = null
    private set

  private val invokeDispatcher = InvokeDispatcher(this)

  val isInitialized: Boolean get() = gatewaySession != null

  fun start(sessionKey: String, host: String, port: Int, tls: Boolean) {
    val session = GatewaySession(sessionKey, host, port, tls)
    gatewaySession = session
    registerHandlers()
    session.connect()
    Log.d(tag, "Started gateway session to $host:$port")
  }

  fun stop() {
    gatewaySession?.disconnect()
    gatewaySession = null
    Log.d(tag, "Stopped gateway session")
  }

  private fun registerHandlers() {
    invokeDispatcher.register("device", DeviceHandler(this))
    invokeDispatcher.register("system", SystemHandler(this))
    invokeDispatcher.register("camera", CameraHandler(this))
    invokeDispatcher.register("location", LocationHandler(this))
    invokeDispatcher.register("calendar", CalendarHandler(this))
    invokeDispatcher.register("contacts", ContactsHandler(this))
    invokeDispatcher.register("photos", PhotosHandler(this))
    invokeDispatcher.register("notifications", NotificationsHandler(this))
    invokeDispatcher.register("motion", MotionHandler(this))
    invokeDispatcher.register("sms", SmsHandler(this, BuildConfig.ONYX_ENABLE_SMS))
    invokeDispatcher.register("callLog", CallLogHandler(this, BuildConfig.ONYX_ENABLE_CALL_LOG))
  }

  fun invoke(command: String, args: Map<String, Any>): Any? {
    return invokeDispatcher.dispatch(command, args)
  }
}