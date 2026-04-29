# ONYX Android App

ONYX Android provides a native mobile interface to ONYX Sovereign AI OS on Solana.

## Features

- Native Android voice assistant with wake-word detection
- Canvas A2UI runtime supporting rich interactive screens
- WebSocket gateway with TLS encryption
- Camera, location, SMS, contacts, calendar integrations
- Call log access (third-party flavor)

## Build

### Prerequisites

- Android Studio Ladybug+
- JDK 17
- Android SDK 36

### Development Build

```bash
pnpm onyx android dev
```

### Release Build

Set environment variables in `~/.gradle/gradle.properties`:

```properties
ONYX_ANDROID_STORE_FILE=~/android keystore.keystore
ONYX_ANDROID_STORE_PASSWORD=xxxxxx
ONYX_ANDROID_KEY_ALIAS=onyx
ONYX_ANDROID_KEY_PASSWORD=xxxxxx
```

Then run:

```bash
# Play store flavor (no SMS/call log)
pnpm onyx android assemblePlayRelease

# Third-party flavor (includes SMS/call log)
pnpm onyx android assembleThirdPartyRelease
```

## Output Artifacts

- `onyx-<version>-play-release.apk` — Play Store build
- `onyx-<version>-third-party-release.apk` — Third-party distribution

## CLI Commands

```bash
# Start gateway server (USB or network)
pnpm onyx gateway
pnpm onyx gateway --port 18789 --verbose

# Device management
onyx devices list
onyx devices approve <requestId>
onyx devices revoke <deviceId>
```

## Architecture

```
ai.onyx.app
├── NodeRuntime       # Main runtime orchestration
├── GatewaySession  # WebSocket to gateway
├── InvokeDispatcher # Command routing
├── CanvasController # A2UI rendering via WKWebView
└── VoiceCapture    # Audio input pipeline
```

## USB Gateway

Test local gateway via USB:

```bash
adb reverse tcp:18789 tcp:18789
```

Then connect in app via Settings → Connect → USB Debug

## Configuration

Stored in SharedPreferences:
- `onyx.node` — Display name, wake words
- `onyx.node.secure` — Gateway credentials

## License

Proprietary — ONYX Foundation