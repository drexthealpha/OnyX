/**
 * fal.ts — fal.ai image generation via flux/schnell
 * Zero operator cost. FAL_KEY is user-provided.
 */

const FAL_ENDPOINT = 'https://fal.run/fal-ai/flux/schnell';

interface FalResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export async function generateImage(prompt: string): Promise<Buffer> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error('FAL_KEY not set in environment');

  const res = await fetch(FAL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: 'portrait_9_16',
      num_inference_steps: 4,
      num_images: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`fal.ai API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as FalResponse;
  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) throw new Error('fal.ai did not return an image URL');

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download fal.ai image: ${imgRes.status}`);

  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}