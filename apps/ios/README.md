## ONYX iOS App

Status: **alpha**. Mirrors Android app architecture in Swift/SwiftUI.

### Bundle ID
`ai.onyx.app`

### Architecture
- SwiftUI + Combine
- `OnyxRuntime` (mirrors Android `NodeRuntime`) — manages GatewaySession + InvokeDispatcher
- `OnyxApp` (mirrors Android `NodeApp`) — Application delegate
- Connects to `@onyx/gateway` via WebSocket
- Node.js backend serves `@onyx/gateway` (NERVE_PORT default: 3001)
- Canvas: WKWebView renders A2UI content from gateway
- Voice: uses `onyx-swabble` OnyxSwabbleKit for wake-word gate

### Build

```bash
cd apps/ios
open ONYX.xcodeproj
# or
xcodebuild -scheme ONYX -configuration Debug
```

### Connect to gateway
Same flow as Android:
1. Start gateway: `pnpm onyx gateway --port 18789 --verbose`
2. In app: Connect tab → Setup Code or Manual mode
3. Approve: `onyx devices approve <requestId>`