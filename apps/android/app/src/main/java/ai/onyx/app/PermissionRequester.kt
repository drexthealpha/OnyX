package ai.onyx.app

import android.content.Context

interface PermissionRequesterDelegate {
  fun onPermissionsGranted(permissions: List<String>)
  fun onPermissionsDenied(permissions: List<String>)
}

class PermissionRequester(private val context: Context) {
  private var delegate: PermissionRequesterDelegate? = null
  private var pendingPermissions: List<String> = emptyList()

  fun setDelegate(delegate: PermissionRequesterDelegate) {
    this.delegate = delegate
  }

  fun request(permissions: List<String>, onResult: (Boolean) -> Unit) {
    pendingPermissions = permissions
    val granted = permissions.all { hasPermission(it) }
    onResult(granted)
  }

  fun hasPermission(permission: String): Boolean {
    return context.checkSelfPermission(permission) == android.content.pm.PackageManager.PERMISSION_GRANTED
  }

  fun hasAllPermissions(permissions: List<String>): Boolean {
    return permissions.all { hasPermission(it) }
  }
}