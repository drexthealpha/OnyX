package ai.onyx.app.protocol

enum class OnyxCapability(val rawValue: String) {
  CANVAS("canvas"),
  CAMERA("camera"),
  SMS("sms"),
  LOCATION("location"),
  DEVICE("device"),
  NOTIFICATIONS("notifications"),
  SYSTEM("system"),
  PHOTOS("photos"),
  CONTACTS("contacts"),
  CALENDAR("calendar"),
  MOTION("motion"),
  CALL_LOG("callLog");

  companion object {
    fun fromRawValue(raw: String): OnyxCapability? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxCanvasCommand(val rawValue: String) {
  RENDER("render"),
  EXECUTE("execute"),
  NAVIGATE("navigate"),
  SET_TITLE("setTitle"),
  SET_METADATA("setMetadata");

  companion object {
    fun fromRawValue(raw: String): OnyxCanvasCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxCameraCommand(val rawValue: String) {
  CAPTURE_PHOTO("capturePhoto"),
  CAPTURE_VIDEO("captureVideo"),
  START_PREVIEW("startPreview"),
  STOP_PREVIEW("stopPreview"),
  SET_FLASH("setFlash"),
  SET_ZOOM("setZoom");

  companion object {
    fun fromRawValue(raw: String): OnyxCameraCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxSmsCommand(val rawValue: String) {
  SEND("send"),
  LIST("list"),
  MARK_READ("markRead"),
  DELETE("delete");

  companion object {
    fun fromRawValue(raw: String): OnyxSmsCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxLocationCommand(val rawValue: String) {
  GET_CURRENT("getCurrent"),
  WATCH("watch"),
  STOP_WATCH("stopWatch");

  companion object {
    fun fromRawValue(raw: String): OnyxLocationCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxDeviceCommand(val rawValue: String) {
  GET_INFO("getInfo"),
  GET_STATE("getState"),
  SET_STATE("setState"),
  GET_BATTERY("getBattery"),
  GET_CONNECTIVITY("getConnectivity");

  companion object {
    fun fromRawValue(raw: String): OnyxDeviceCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxNotificationsCommand(val rawValue: String) {
  LIST("list"),
  POST("post"),
  CANCEL("cancel"),
  CANCEL_ALL("cancelAll");

  companion object {
    fun fromRawValue(raw: String): OnyxNotificationsCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxSystemCommand(val rawValue: String) {
  GET_INFO("getInfo"),
  OPEN_URL("openUrl"),
  OPEN_APP("openApp"),
  VIBRATE("vibrate");

  companion object {
    fun fromRawValue(raw: String): OnyxSystemCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxPhotosCommand(val rawValue: String) {
  LIST("list"),
  GET("get"),
  SAVE("save"),
  DELETE("delete");

  companion object {
    fun fromRawValue(raw: String): OnyxPhotosCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxContactsCommand(val rawValue: String) {
  LIST("list"),
  GET("get"),
  SEARCH("search");

  companion object {
    fun fromRawValue(raw: String): OnyxContactsCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxCalendarCommand(val rawValue: String) {
  LIST_EVENTS("listEvents"),
  GET_EVENT("getEvent"),
  CREATE_EVENT("createEvent"),
  UPDATE_EVENT("updateEvent"),
  DELETE_EVENT("deleteEvent");

  companion object {
    fun fromRawValue(raw: String): OnyxCalendarCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxMotionCommand(val rawValue: String) {
  START("start"),
  STOP("stop"),
  GET_DATA("getData");

  companion object {
    fun fromRawValue(raw: String): OnyxMotionCommand? = entries.find { it.rawValue == raw }
  }
}

enum class OnyxCallLogCommand(val rawValue: String) {
  LIST("list"),
  GET("get"),
  DELETE("delete");

  companion object {
    fun fromRawValue(raw: String): OnyxCallLogCommand? = entries.find { it.rawValue == raw }
  }
}

object OnyxProtocolConstants {
  const val NamespacePrefix = "ai.onyx:"
  const val CapabilityNamespace = "capability"
  const val InvokeNamespace = "invoke"
  const val EventNamespace = "event"

  fun capabilityNamespace(capability: OnyxCapability): String = "${NamespacePrefix}${capability.rawValue}"
  fun invokeNamespace(command: String): String = "${NamespacePrefix}${InvokeNamespace}.${command}"
  fun eventNamespace(event: String): String = "${NamespacePrefix}${EventNamespace}.${event}"
}