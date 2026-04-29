package ai.onyx.app

import android.content.Context
import android.webkit.WebView
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
  private val _runtimeInitialized = MutableStateFlow(false)
  val runtimeInitialized: StateFlow<Boolean> = _runtimeInitialized.asStateFlow()

  private val _preventSleep = MutableStateFlow(false)
  val preventSleep: StateFlow<Boolean> = _preventSleep.asStateFlow()

  private val _statusText = MutableStateFlow("Initializing...")
  val statusText: StateFlow<String> = _statusText.asStateFlow()

  private val _isConnected = MutableStateFlow(false)
  val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

  private var runtime: NodeRuntime? = null

  fun setForeground(foreground: Boolean) {
    _preventSleep.value = foreground
  }

  fun attachRuntimeUi(owner: Context, permissionRequester: PermissionRequester) {
    val app = owner.applicationContext as NodeApp
    runtime = app.ensureRuntime()
    _runtimeInitialized.value = true
    _statusText.value = "Ready"
  }

  fun handleAssistantLaunch(request: AssistantLaunch) {
    viewModelScope.launch {
      // Handle assistant launch request
      _statusText.value = "Processing: ${request.action}"
    }
  }

  fun disconnect() {
    runtime?.stop()
    _isConnected.value = false
    _statusText.value = "Disconnected"
  }
}