package ai.onyx.app.chat

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject

class ChatController {
  private val sessions = mutableMapOf<String, ChatSession>()

  fun createSession(key: String): ChatSession {
    val session = ChatSession(key)
    sessions[key] = session
    return session
  }

  fun getSession(key: String): ChatSession? = sessions[key]

  fun addMessage(sessionKey: String, role: String, content: String): ChatMessage {
    val session = getSession(sessionKey) ?: createSession(sessionKey)
    val message = ChatMessage(
      id = System.currentTimeMillis().toString(),
      role = role,
      content = content,
      timestamp = System.currentTimeMillis()
    )
    session.messages.add(message)
    return message
  }

  fun getMessages(sessionKey: String): List<ChatMessage> {
    return sessions[sessionKey]?.messages?.toList() ?: emptyList()
  }

  fun clearSession(sessionKey: String) {
    sessions.remove(sessionKey)
  }
}