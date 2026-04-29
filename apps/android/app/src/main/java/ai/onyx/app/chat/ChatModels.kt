package ai.onyx.app.chat

data class ChatMessage(
  val id: String,
  val role: String,
  val content: String,
  val timestamp: Long = System.currentTimeMillis()
)

data class ChatSession(
  val key: String,
  val messages: MutableList<ChatMessage> = mutableListOf()
)