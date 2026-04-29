---
name: onyx-voice-studio
description: How to add TTS engines and generate audio. Engine interface, adding custom engine, kokoro setup, edge-tts free usage, elevenlabs quality tier, podcast generation example.
origin: ONYX
---

# ONYX Voice Studio

The @onyx/voice and @onyx/studio packages provide text-to-speech and audio production capabilities. This skill covers how to use the different TTS engines and generate audio content.

## Architecture Overview

@onyx/voice handles the TTS engine abstraction layer, providing a unified interface across different TTS providers. @onyx/studio handles multi-track audio production for podcasts, video narration, and audiobooks.

Both packages live in ONYX's L6 Surface layer.

## Engine Interface

All TTS engines implement the same interface:

```typescript
interface TTSEngine {
  name: string
  generate(text: string, options: TTSOptions): Promise<AudioBuffer>
  voices(): Promise<Voice[]>
  rateLimit?: number
  cost?: 'free' | 'paid'
}

interface TTSOptions {
  voice?: string
  speed?: number
  pitch?: number
  format?: 'mp3' | 'wav' | 'ogg'
}

interface Voice {
  id: string
  name: string
  language: string
  gender?: 'male' | 'female'
}
```

This interface allows swapping engines without code changes.

## Built-in Engines

ONYX provides three built-in engines:

1. **kokoro** — Local TTS, free, fast
2. **edge-tts** — Microsoft Edge TTS, free, many voices
3. **elevenlabs** — Premium quality, paid, voice cloning

### Kokoro Setup

Kokoro is a local TTS model:

```typescript
import { KokoroEngine } from '@onyx/voice'

const engine = new KokoroEngine({
  modelPath: './models/kokoro-v1.onnx',
  voicePack: './models/voices/af_bella.bin',
})

const audio = await engine.generate('ONYX is your sovereign AI operating system.', {
  speed: 1.0,
  pitch: 1.0,
  format: 'wav',
})

// Returns AudioBuffer
await Bun.write('output.wav', audio)
```

Features:

- 0.5B parameter model
- 100% free, no API calls
- ~50ms latency
- Voice packs: af_bella, af_sonia, am_michael

### Edge-TTS Usage

Microsoft Edge TTS is free with many voices:

```typescript
import { EdgeTTSEngine } from '@onyx/voice'

const engine = new EdgeTTSEngine()  // No API key needed

const voices = await engine.voices()

// 300+ voices including:
// - en-US-AriaNeural
// - en-GB-SoniaNeural  
// - en-AU-CatherineNeural
```

Generate audio with edge-tts:

```typescript
const audio = await engine.generate('Hello from ONYX.', {
  voice: 'en-US-AriaNeural',
  rate: '+0%',    // -50% to +100%
  pitch: '+0Hz',   // adjust pitch
  format: 'mp3',
})
```

### ElevenLabs Quality Tier

ElevenLabs provides premium TTS:

```typescript
import { ElevenLabsEngine } from '@onyx/voice'

const engine = new ElevenLabsEngine({
  apiKey: Bun.env.ELEVENLABS_API_KEY!,
})

const audio = await engine.generate(longFormScript, {
  voiceId: 'pNInz6obpgDQGcFmaJgB',  // Adam
  modelId: 'eleven_turbo_v2_5',
  stability: 0.5,
  similarityBoost: 0.75,
})
```

Features:

- Voice cloning from 30s sample
- Multi-language support
- Emotional output controls

## Podcast Generation

Use @onyx/studio for multi-host podcasts:

```typescript
import { generatePodcast } from '@onyx/studio'

const podcast = await generatePodcast({
  script: researchSummary,
  hosts: [
    {
      name: 'ONYX-1',
      engine: 'edge-tts',
      voice: 'en-US-AriaNeural',
    },
    {
      name: 'ONYX-2',
      engine: 'kokoro',
      voice: 'af_bella',
    },
  ],
  backgroundMusic: './assets/ambient-loop.mp3',
  musicVolume: 0.1,
  outputFormat: 'mp3',
  bitrate: 128,
})

// Returns:
// {
//   audioPath: './output/podcast-2026-04-29.mp3',
//   duration: 342,
//   hosts: ['ONYX-1', 'ONYX-2']
// }
```

The studio:

- Mix multiple voices
- Add background music
- Apply fades and transitions
- Export in various formats

## Adding a Custom Engine

Implement TTSEngine for other services:

```typescript
class CustomTTSEngine implements TTSEngine {
  name = 'custom-tts'
  
  async generate(
    text: string,
    opts: TTSOptions
  ): Promise<AudioBuffer> {
    const res = await fetch('https://my-tts-api.com/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Bun.env.TTS_API_KEY}` },
      body: JSON.stringify({ text, ...opts }),
    })
    return Buffer.from(await res.arrayBuffer())
  }
  
  async voices() {
    return [
      { id: 'default', name: 'Custom Voice', language: 'en-US' },
    ]
  }
}

registerTTSEngine(new CustomTTSEngine())
```

## Voice Selection Guide

| Use Case | Recommended Engine | Voice |
|---------|------------------|-------|
| Quick prototype | edge-tts | en-US-AriaNeural |
| Production app | elevenlabs | Custom clone |
| Offline | kokoro | af_bella |
| Video narration | edge-tts | en-GB-SoniaNeural |

## Environment Variables

```
ELEVENLABS_API_KEY=  # Required for ElevenLabs
KOKORO_MODEL_PATH=./models/kokoro-v1.onnx  # Optional, looks in ./models/
STUDIO_PORT=3008  # Optional
```