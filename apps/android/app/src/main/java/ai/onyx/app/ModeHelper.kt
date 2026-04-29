package ai.onyx.app

import android.content.Context

object VoiceCaptureMode {
  const val AUTO = "auto"
  const val PUSH_TO_TALK = "push_to_talk"
  const val VAD = "vad"
}

object VoiceWakeMode {
  const val CONTINUOUS = "continuous"
  const val MANUAL = "manual"
}

enum class LocationMode {
  GPS,
  NETWORK,
  PASSIVE
}

data class CameraHudState(
  val isPreviewing: Boolean = false,
  val isRecording: Boolean = false,
  val flashMode: String = "off",
  val zoomLevel: Float = 1f
)

object DeviceNames {
  fun fromBluetooth(): Map<String, String> = emptyMap()
}

object NotificationForwardingPolicy {
  const val ALL = "all"
  const val MATCHED = "matched"
  const val NONE = "none"
}