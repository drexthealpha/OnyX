package ai.onyx.app

object SessionKey {
  fun generate(): String = java.util.UUID.randomUUID().toString()

  fun isValid(key: String?): Boolean = key != null && key.isNotBlank()
}