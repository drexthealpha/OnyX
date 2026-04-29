package ai.onyx.app

data class AssistantLaunch(
  val action: String,
  val text: String?,
  val sessionKey: String?,
  val surfaceId: String?,
  val sourceComponentId: String?
)

fun parseAssistantLaunchIntent(intent: android.content.Intent?): AssistantLaunch? {
  if (intent == null) return null
  val action = intent.getStringExtra("action") ?: return null
  return AssistantLaunch(
    action = action,
    text = intent.getStringExtra("text"),
    sessionKey = intent.getStringExtra("sessionKey"),
    surfaceId = intent.getStringExtra("surfaceId"),
    sourceComponentId = intent.getStringExtra("sourceComponentId")
  )
}