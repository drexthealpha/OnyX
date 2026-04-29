# 🎙️ onyx-swabble — Speech.framework wake-word daemon for ONYX (macOS 26)

onyx-swabble is the Swift 6.2 wake-word hook daemon that bridges the ONYX "ONYX" wake word to `@onyx/gateway`.

- **Local-only**: Speech.framework on-device models; zero network usage.
- **Wake word**: Default `onyx` (triggers @onyx/gateway via hook).
- **OnyxSwabbleKit**: Shared wake gate utilities for iOS/macOS apps.
- **Hooks**: Run any command with prefix/env, cooldown, min_chars, timeout.
- **Integration**: Hook command should be `onyx gateway --invoke-voice` or similar.

## Quick start

```bash
swift build
swift run onyx-swabble setup      # writes ~/.config/onyx-swabble/config.json
swift run onyx-swabble serve   # foreground daemon
swift run onyx-swabble test-hook "query"
```

## Default config (~/.config/onyx-swabble/config.json)

```json
{
  "wake": { "enabled": true, "word": "onyx", "aliases": ["onyx"] },
  "hook": { "command": "", "args": [], "prefix": "Voice ONYX from ${hostname}: " }
}
```

## Hook → Gateway bridge

When wake word is detected, onyx-swabble calls the configured hook command with
the stripped transcript. Wire it to ONYX gateway:

- Set hook.command to the path of your `onyx` binary
- Set hook.args to `["gateway", "--voice-input"]`
- NERVE_PORT env var is passed through hook.env

## CLI

Same as swabble: serve, transcribe, test-hook, mic list/set, setup, doctor, health,
tail-log, status, service install/uninstall/status, start/stop/restart