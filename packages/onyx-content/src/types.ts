export type ContentType = 'blog' | 'twitter-thread' | 'youtube-script' | 'linkedin';

export type CrosspostPlatform = 'blog' | 'twitter' | 'linkedin';

export interface Content {
  type: ContentType;
  topic: string;
  body: string;
  tweets?: string[];
  wordCount: number;
  generatedAt: number;
}

export interface VideoScene {
  text: string;
  imagePrompt: string;
  imagePath?: string;
  durationSeconds: number;
}

export interface BlogPost {
  title: string;
  body: string;
  slug: string;
  wordCount: number;
}