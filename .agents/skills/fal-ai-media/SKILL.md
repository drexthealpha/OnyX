---
name: fal-ai-media
description: Unified media generation via fal.ai MCP — images, video, and audio using Seedance, Veo3, and CSM-1B models. Use when the user wants AI-generated media assets or augmentation.
origin: ECC
---

# fal.ai Media

Media generation using fal.ai's unified API for images, video, and audio via state-of-the-art models.

## When to Activate

- User wants AI-generated images or video
- Need B-roll for video content
- Creating marketing assets
- Generating audio narration or music
- Augmenting existing media with AI

## Supported Models

### Image Generation
- **Seedance** — High-quality image generation from text prompts
- **FLUX.1 [dev]** — Open source image generation
- **Recraft V3** — Vector and illustration generation

### Video Generation
- **Seedance** — Video generation from text/image
- **Veo 3** — Google DeepMind video generation
- **Kling AI** — Short video generation

### Audio Generation
- **CSM-1B** — Audio narration from text
- **ElevenLabs** — Voice cloning and high-quality TTS

## MCP Integration

```typescript
// Generate image
await fal_generate({
  model: "seedance",
  prompt: "ONYX AI OS logo: geometric cyan on dark indigo background",
  imageSize: { width: 1024, height: 1024 }
})

// Generate video from image
await fal_generate({
  model: "seedance",
  image_path: "./assets/onyx-logo.png",
  prompt: "logo animating with pulse effect",
  duration: 5
})

// Generate audio narration
await fal_generate({
  model: "csm-1b",
  text: "ONYX is your sovereign AI operating system built on Solana.",
  voice: "default"
})
```

## Image Generation Examples

```
Prompt: "Futuristic dashboard showing Solana DeFi TVL, cyan accents on dark background, data visualization, minimal"
Model: Seedance
Size: 1024x1024
```

## Video Generation Examples

```
Input: Static chart image
Prompt: "Chart growing with animated bars, data flowing"
Duration: 5 seconds
Output: MP4 video
```

## Audio Options

```typescript
// Voice selection
voice: "default" | "narrator" | "friendly"

// Speed control
speed: 0.8 // 80% to 150%

// Format
format: "mp3" | "wav"
```

## Cost Considerations

- Image generation: ~$0.01-0.05 per image
- Video generation: ~$0.10-0.50 per second
- Audio generation: ~$0.01 per minute

Use free tiers for prototyping, paid for production.