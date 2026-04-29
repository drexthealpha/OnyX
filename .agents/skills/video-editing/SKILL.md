---
name: video-editing
description: AI-assisted video editing workflows for cutting, structuring, and augmenting real footage. Covers FFmpeg, Remotion, ElevenLabs, fal.ai, and final polish. Use when the user wants to edit video, cut footage, create vlogs, or build video content.
origin: ECC
---

# Video Editing

AI-assisted editing for real footage. Not generation from prompts. Editing existing video fast.

## When to Activate

- User wants to edit, cut, or structure video footage
- Turning long recordings into short-form content
- Building vlogs, tutorials, or demo videos from raw capture
- Adding overlays, subtitles, music, or voiceover to existing video

## Pipeline

```
Raw footage → Transcript → Cut list → FFmpeg → Captions → Music → Export
```

## FFmpeg Essentials

```bash
# Trim clip
ffmpeg -i input.mp4 -ss 00:01:00 -t 00:00:30 -c copy clip.mp4

# Compress for web
ffmpeg -i input.mp4 -vcodec libx264 -crf 23 -acodec aac output.mp4

# Extract audio for transcription
ffmpeg -i input.mp4 -q:a 0 -map a audio.mp3

# Add subtitles
ffmpeg -i input.mp4 -vf subtitles=captions.srt output.mp4

# Stack vertical (for TikTok/Shorts)
ffmpeg -i clip.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" vertical.mp4
```

## Transcript → Cut List

Use `@onyx/browser` yt-dlp transcript extraction for source material, then generate cut list using Claude.

## fal.ai Integration

For AI B-roll generation, use `@onyx/content` fal.ai adapter with Seedance or Veo 3 models.