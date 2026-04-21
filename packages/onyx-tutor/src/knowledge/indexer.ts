import type { LoadedDocument } from './loader.ts';

export interface IndexedChunk {
  documentPath: string;
  chunkIndex: number;
  text: string;
  embedding?: number[];
}

export interface SearchResult {
  chunk: IndexedChunk;
  score: number;
}

const inMemoryIndex: IndexedChunk[] = [];

function chunkDocument(doc: LoadedDocument, chunkSize = 500, overlap = 50): IndexedChunk[] {
  const words = doc.content.split(/\s+/);
  const chunks: IndexedChunk[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push({
      documentPath: doc.path,
      chunkIndex: chunks.length,
      text: chunk,
    });
    i += chunkSize - overlap;
  }

  return chunks;
}

export async function indexDocuments(docs: LoadedDocument[]): Promise<void> {
  let semanticAvailable = false;

  try {
    const semantic = await import('@onyx/semantic');
    for (const doc of docs) {
      const chunks = chunkDocument(doc);
      await semantic.upsertChunks(chunks.map((c) => ({ id: `${c.documentPath}:${c.chunkIndex}`, text: c.text })));
    }
    semanticAvailable = true;
  } catch {
    console.warn('[onyx-tutor] @onyx/semantic not available, using in-memory index');
  }

  if (!semanticAvailable) {
    for (const doc of docs) {
      const chunks = chunkDocument(doc);
      inMemoryIndex.push(...chunks);
    }
  }
}

export async function searchKnowledge(
  query: string,
  topK = 3,
): Promise<SearchResult[]> {
  try {
    const semantic = await import('@onyx/semantic');
    const results = await semantic.search(query, topK);
    return results.map((r: { text: string; score: number; id: string }) => ({
      chunk: {
        documentPath: r.id.split(':')[0],
        chunkIndex: parseInt(r.id.split(':')[1] ?? '0'),
        text: r.text,
      },
      score: r.score,
    }));
  } catch {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));

    return inMemoryIndex
      .map((chunk) => {
        const chunkWords = chunk.text.toLowerCase().split(/\s+/);
        const overlap = chunkWords.filter((w) => queryWords.has(w)).length;
        const score = overlap / Math.max(queryWords.size, 1);
        return { chunk, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}