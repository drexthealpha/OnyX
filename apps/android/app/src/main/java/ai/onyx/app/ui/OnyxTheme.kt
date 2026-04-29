package ai.onyx.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val OnyxColors = darkColorScheme(
  primary = Color(0xFF22d3ee),
  onPrimary = Color(0xFF0d0d1f),
  secondary = Color(0xFFa5b4fc),
  onSecondary = Color(0xFF0d0d1f),
  tertiary = Color(0xFF4ade80),
  background = Color(0xFF0d0d1f),
  surface = Color(0xFF1a1a3e),
  onBackground = Color(0xFFddddff),
  onSurface = Color(0xFFddddff),
  error = Color(0xFFf87171),
  onError = Color(0xFF0d0d1f)
)

@Composable
fun OnyxTheme(content: @Composable () -> Unit) {
  MaterialTheme(colorScheme = OnyxColors, content = content)
}