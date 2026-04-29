package ai.onyx.app.gateway

import java.net.URI
import okhttp3.*

class GatewaySession(
  private val sessionKey: String,
  private val host: String,
  private val port: Int,
  private val tls: Boolean
) {
  private val tag = "GatewaySession"
  private var webSocket: WebSocket? = null
  private val client = OkHttpClient()

  private val scheme = if (tls) "wss" else "ws"
  private val wsUrl = URI("$scheme://$host:$port/ws?sessionKey=$sessionKey")

  fun connect() {
    val request = Request.Builder().url(wsUrl.toString()).build()
    webSocket = client.newWebSocket(request, object : WebSocketListener() {
      override fun onOpen(webSocket: WebSocket, response: Response) {
        android.util.Log.d(tag, "Connected to gateway")
      }

      override fun onMessage(webSocket: WebSocket, text: String) {
        handleMessage(text)
      }

      override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
        webSocket.close(1000, null)
      }

      override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
        android.util.Log.e(tag, "Gateway error: ${t.message}")
      }
    })
  }

  fun disconnect() {
    webSocket?.close(1000, "Normal close")
    webSocket = null
  }

  fun send(message: String): Boolean {
    return webSocket?.send(message) ?: false
  }

  private fun handleMessage(text: String) {
    // Handle incoming messages
  }
}