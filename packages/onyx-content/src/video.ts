/**
 * video.ts — Script → MP4 via fal.ai images + fluent-ffmpeg
 * Zero operator cost. FAL_KEY is user-provided. ANTHROPIC_API_KEY is user-provided.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { generateImage } from './fal.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');
  return textBlock.text.trim();
}

interface Scene {
  text: string;
  imagePrompt: string;
}

async function splitIntoScenes(script: string): Promise<Scene[]> {
  const raw = await callClaude(
    'You are a video producer. Split the script into 5-8 scenes. ' +
      'Return ONLY a JSON array: [{"text":"...","imagePrompt":"..."}]. No markdown.',
    `Script:\n${script}`,
  );

  const clean = raw.replace(/```json|```/g, '').trim();
  const scenes: Scene[] = JSON.parse(clean);
  return scenes;
}

function buildVideoFromImages(imagePaths: string[], outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const concatFile = path.join(tmpDir, `onyx-concat-${Date.now()}.txt`);
    const lines = imagePaths.map((p) => `file '${p}'\nduration 3`).join('\n');
    const lastImage = imagePaths[imagePaths.length - 1];
    fs.writeFileSync(concatFile, lines + `\nfile '${lastImage}'\n`);

    ffmpeg()
      .input(concatFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-r 30',
        '-vf fade=t=in:st=0:d=0.5',
      ])
      .on('end', () => {
        fs.unlinkSync(concatFile);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        try { fs.unlinkSync(concatFile); } catch { /* ignore */ }
        reject(err);
      })
      .save(outputPath);
  });
}

export async function createVideo(script: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, `onyx-video-${Date.now()}.mp4`);

  const scenes = await splitIntoScenes(script);

  const imagePaths: string[] = [];
  for (const scene of scenes) {
    const imageBuffer = await generateImage(scene.imagePrompt);
    const imgPath = path.join(tmpDir, `onyx-scene-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
    fs.writeFileSync(imgPath, imageBuffer);
    imagePaths.push(imgPath);
  }

  await buildVideoFromImages(imagePaths, outputPath);

  for (const p of imagePaths) {
    try { fs.unlinkSync(p); } catch { /* ignore */ }
  }

  return outputPath;
}