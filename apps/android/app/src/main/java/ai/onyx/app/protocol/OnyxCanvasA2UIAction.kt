package ai.onyx.app.protocol

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

object OnyxCanvasA2UIAction {
  fun extractActionName(userAction: JsonObject): String? {
    return userAction["action"]?.let { (it as? JsonPrimitive)?.content }
  }

  fun sanitizeTagValue(value: String): String {
    return value.take(500).replace(Regex("""[^\x20-\x7E]"""), "")
  }

  fun formatAgentMessage(
    actionName: String,
    sessionKey: String,
    surfaceId: String,
    sourceComponentId: String,
    host: String,
    instanceId: String,
    contextJson: String?
  ): String {
    val tagValue = buildString {
      append("CANVAS_A2UI")
      append("\u001F")
      append(actionName)
      append("\u001F")
      append(sessionKey)
      append("\u001F")
      append(surfaceId)
      append("\u001F")
      append(sourceComponentId)
      append("\u001F")
      append(host)
      append("\u001F")
      append(instanceId)
      if (contextJson != null) {
        append("\u001F")
        append(contextJson)
      }
    }
    return tagValue
  }

  fun jsDispatchA2UIActionStatus(actionId: String, ok: Boolean, error: String?): String {
    val err = jsonStringLiteral(error ?: "")
    val okLiteral = if (ok) "true" else "false"
    val idLiteral = jsonStringLiteral(actionId)
    return "window.dispatchEvent(new CustomEvent('onyx:a2ui-action-status', { detail: { id: ${idLiteral}, ok: ${okLiteral}, error: ${err} } }));"
  }

  private fun jsonStringLiteral(raw: String): String =
    JsonPrimitive(raw).toString().replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
}