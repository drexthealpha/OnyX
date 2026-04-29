## ONYX macOS App

Bundle ID: `ai.onyx.macos`
Wraps @onyx/gateway in a native macOS menu-bar app.
Uses SwiftUI + AppKit. Pairs with onyx-swabble for voice wake.

### Build

```bash
cd apps/macos
open ONYX.xcodeproj
```

### Architecture
- Menu-bar NSStatusItem with popover panel
- Embeds @onyx/gateway Node.js process (NERVE_PORT env var, default 3001)
- WKWebView for canvas rendering
- Integrates OnyxSwabbleKit for wake-word detection
- Auto-starts gateway on launch; stops on quit