import type { LoadedDocument } from './loader.js';

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
    const { createSemanticClient } = await import('@onyx/semantic');
    const sem = createSemanticClient();
    for (const doc of docs) {
      const chunks = chunkDocument(doc);
      await sem.documents.upsert(chunks.map((c) => ({ 
        id: `${c.documentPath}:${c.chunkIndex}`, 
        text: c.text,
        payload: {
          timestamp: Date.now(),
          title: c.documentPath,
          chunkIndex: c.chunkIndex,
          totalChunks: chunks.length
        }
      })));
    }
    semanticAvailable = true;
  } catch (err) {
    console.warn('[onyx-tutor] @onyx/semantic not available or error occurred, using in-memory index:', err);
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
    const { createSemanticClient } = await import('@onyx/semantic');
    const sem = createSemanticClient();
    const results = await sem.documents.search(query, topK);
    return results.map((r) => ({
      chunk: {
        documentPath: r.id.split(':')[0]!,
        chunkIndex: parseInt(r.id.split(':')[1] ?? '0'),
        text: (r.payload as any).text || '',
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
