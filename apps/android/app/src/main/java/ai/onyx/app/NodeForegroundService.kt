package ai.onyx.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat

class NodeForegroundService : Service() {
  companion object {
    const val ACTION_STOP = "ai.onyx.app.action.STOP"
    const val ACTION_SET_VOICE_CAPTURE_MODE = "ai.onyx.app.action.SET_VOICE_CAPTURE_MODE"
    const val EXTRA_VOICE_CAPTURE_MODE = "ai.onyx.app.extra.VOICE_CAPTURE_MODE"
    private const val CHANNEL_ID = "onyx.node"

    fun start(context: Context) {
      val intent = Intent(context, NodeForegroundService::class.java)
      context.startForegroundService(intent)
    }

    fun stop(context: Context) {
      val intent = Intent(context, NodeForegroundService::class.java)
      context.stopService(intent)
    }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_SET_VOICE_CAPTURE_MODE -> {
        val mode = intent.getStringExtra(EXTRA_VOICE_CAPTURE_MODE)
        // Handle voice capture mode change
      }
    }

    val notification = buildNotification("ONYX Node", "Waiting for commands...")
    startForeground(1, notification)

    return START_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun createNotificationChannel() {
    val channel = NotificationChannel(CHANNEL_ID, "ONYX node connection status", NotificationManager.IMPORTANCE_LOW).apply {
      description = "ONYX node connection status"
      setShowBadge(false)
    }
    val nm = getSystemService(NotificationManager::class.java)
    nm.createNotificationChannel(channel)
  }

  private fun buildNotification(title: String, text: String): Notification {
    val pendingIntent = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(text)
      .setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .build()
  }

  fun updateNotification(title: String, text: String) {
    val notification = buildNotification(title, text)
    val nm = getSystemService(NotificationManager::class.java)
    nm.notify(1, notification)
  }
}