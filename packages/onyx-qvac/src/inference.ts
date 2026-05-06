import { completion, transcribeStream, textToSpeech } from '@qvac/sdk';

export async function complete(modelId: string, prompt: string): Promise<string> {
  const run = completion({
    modelId,
    history: [{ role: 'user', content: prompt }],
    stream: true,
  });
  let output = '';
  for await (const event of run.events) {
    if (event.type === 'contentDelta') output += event.text;
  }
  return output;
}

export async function* stream(modelId: string, prompt: string): AsyncIterable<string> {
  const run = completion({
    modelId,
    history: [{ role: 'user', content: prompt }],
    stream: true,
  });
  for await (const event of run.events) {
    if (event.type === 'contentDelta') yield event.text;
  }
}

export async function transcribeAudio(modelId: string, audioChunks: AsyncIterable<Uint8Array>): Promise<string> {
  const session = await transcribeStream({ modelId });
  for await (const chunk of audioChunks) session.write(chunk);
  session.end();
  let text = '';
  for await (const segment of session) text += segment;
  return text;
}

export async function synthesizeSpeech(modelId: string, text: string): Promise<AsyncIterable<Uint8Array>> {
  return textToSpeech({ modelId, text });
}