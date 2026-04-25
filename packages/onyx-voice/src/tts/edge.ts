/**
 * @onyx/voice — Edge TTS
 *
 * Free Microsoft Edge TTS via the `edge-tts` npm package.
 * No API key required. Default voice: en-US-AriaNeural.
 */

const DEFAULT_VOICE = 'en-US-AriaNeural';

export async function synthesize(
  text: string,
  voice: string = DEFAULT_VOICE,
): Promise<Buffer> {
  let EdgeTTS: { default: new () => EdgeTTSInstance };
  try {
    EdgeTTS = await import('edge-tts');
  } catch {
    throw new Error(
      '[onyx-voice/edge] edge-tts package not installed. Run: bun add edge-tts',
    );
  }

  const tts = new EdgeTTS.default();
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    tts.synthesize(text, voice, (err: Error | null, chunk: Buffer) => {
      if (err) return reject(err);
      if (chunk) chunks.push(chunk);
    });
    tts.on('end', resolve);
    tts.on('error', reject);
  });

  if (chunks.length === 0) {
    throw new Error('[onyx-voice/edge] TTS returned empty audio');
  }
  return Buffer.concat(chunks);
}

interface EdgeTTSInstance {
  synthesize(
    text: string,
    voice: string,
    cb: (err: Error | null, chunk: Buffer) => void,
  ): void;
  on(event: 'end' | 'error', cb: (...args: unknown[]) => void): void;
}