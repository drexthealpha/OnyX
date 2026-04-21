import { readFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';

export interface LoadedDocument {
  path: string;
  content: string;
  mimeType: string;
  sizeBytes: number;
  loadedAt: number;
}

export async function loadDocument(filePath: string): Promise<LoadedDocument> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = extname(filePath).toLowerCase();
  let content: string;

  if (ext === '.md' || ext === '.txt') {
    content = readFileSync(filePath, 'utf-8');
  } else {
    try {
      const markitdown = await import('@onyx/markitdown');
      content = await markitdown.convert(filePath);
    } catch {
      console.warn('[onyx-tutor] @onyx/markitdown not available, reading raw');
      content = readFileSync(filePath, 'utf-8');
    }
  }

  const stats = Bun.file(filePath);

  return {
    path: filePath,
    content,
    mimeType: mimeTypeFor(ext),
    sizeBytes: await stats.size,
    loadedAt: Date.now(),
  };
}

export async function loadDocuments(filePaths: string[]): Promise<LoadedDocument[]> {
  return Promise.all(filePaths.map(loadDocument));
}

function mimeTypeFor(ext: string): string {
  const map: Record<string, string> = {
    '.pdf':  'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt':  'text/plain',
    '.md':   'text/markdown',
    '.html': 'text/html',
  };
  return map[ext] ?? 'application/octet-stream';
}