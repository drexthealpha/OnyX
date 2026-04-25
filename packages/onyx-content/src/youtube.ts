/**
 * youtube.ts — YouTube Data API v3 video upload
 * Zero operator cost. YOUTUBE_API_KEY and GOOGLE_OAUTH_TOKEN are user-provided.
 * Requires OAuth2 token with youtube.upload scope.
 */

import fs from 'fs';

const YT_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';

export interface VideoMetadata {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'public' | 'private' | 'unlisted';
}

export async function uploadVideo(
  videoPath: string,
  metadata: VideoMetadata,
): Promise<{ videoId: string; url: string }> {
  const token = process.env.GOOGLE_OAUTH_TOKEN;
  if (!token) throw new Error('GOOGLE_OAUTH_TOKEN not set');

  const videoBuffer = fs.readFileSync(videoPath);
  const fileSize = videoBuffer.length;

  const initRes = await fetch(`${YT_UPLOAD_URL}?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': fileSize.toString(),
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags ?? [],
        categoryId: metadata.categoryId ?? '22',
      },
      status: {
        privacyStatus: metadata.privacyStatus ?? 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    }),
  });

  if (!initRes.ok) {
    throw new Error(`YouTube init error ${initRes.status}: ${await initRes.text()}`);
  }

  const uploadUri = initRes.headers.get('location');
  if (!uploadUri) throw new Error('YouTube did not return upload URI');

  const uploadRes = await fetch(uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': fileSize.toString(),
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    throw new Error(`YouTube upload error ${uploadRes.status}: ${await uploadRes.text()}`);
  }

  const data = (await uploadRes.json()) as { id: string };
  const videoId = data.id;

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}