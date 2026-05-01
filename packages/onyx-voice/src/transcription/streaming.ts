/**
 * @onyx/voice — Streaming transcription
 *
 * Reads a Readable audio stream, buffers 2-second chunks, sends each chunk to
 * the OpenAI Whisper API, and yields partial transcript strings as an
 * AsyncIterable.
 *
 * Caller is responsible for providing a PCM/WAV stream at a known sample rate.
 * Default chunk duration: 2000 ms.
 */

import { Readable } from 'node:stream';
import { transcribe } from './whisper';

const CHUNK_MS = 2000;

async function bufferChunk(
  readable: Readable,
  durationMs: number,
  sampleRate = 16_000,
): Promise<Buffer | null> {
  const bytesNeeded = Math.floor((sampleRate * (durationMs / 1000)) * 2);
  const chunks: Buffer[] = [];
  let collected = 0;

  return new Promise((resolve) => {
    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
      collected += chunk.byteLength;
      if (collected >= bytesNeeded) {
        readable.off('data', onData);
        readable.off('end', onEnd);
        resolve(Buffer.concat(chunks).subarray(0, bytesNeeded));
      }
    };

    const onEnd = () => {
      readable.off('data', onData);
      if (chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        resolve(null);
      }
    };

    readable.on('data', onData);
    readable.on('end', onEnd);
    readable.resume();
  });
}

export async function* transcribeStream(
  readable: Readable,
  chunkMs = CHUNK_MS,
  sampleRate = 16_000,
): AsyncIterable<string> {
  while (true) {
    const chunk = await bufferChunk(readable, chunkMs, sampleRate);
    if (!chunk) break;

    const wavBuffer = buildWavBuffer(chunk, sampleRate);

    try {
      const text = await transcribe(wavBuffer, 'chunk.wav');
      if (text) yield text;
    } catch (err) {
      console.error('[onyx-voice/streaming] chunk transcription error:', err);
    }
  }
}

function buildWavBuffer(pcmData: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.byteLength;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}