/**
 * Extractive summarisation using TF-IDF sentence scoring.
 * Pure TypeScript — no API calls, no external dependencies.
 *
 * Algorithm:
 *   1. Split text into sentences.
 *   2. Tokenise each sentence into terms (lowercase, strip punctuation).
 *   3. Compute TF (term frequency within sentence).
 *   4. Compute IDF (inverse document frequency across all sentences).
 *   5. Score each sentence: sum of TF-IDF weights for its terms.
 *   6. Greedily pick top-scoring sentences (preserving original order)
 *      until adding another would exceed maxTokens.
 */

/** Approximate tokens: 4 chars ≈ 1 token */
const CHARS_PER_TOKEN = 4;

/** Split text into sentences on '.', '!', '?', '\n\n' boundaries. */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation or double-newline
  const raw = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split(/\n{2,}|\n(?=[A-Z#\-])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  return raw.length > 0 ? raw : [text];
}

/** Tokenise a sentence: lowercase, remove non-alphanumeric, split on whitespace. */
function tokenise(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Compute TF for a list of tokens: Map<term, frequency>. */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const total = tokens.length || 1;
  for (const [term, count] of tf) {
    tf.set(term, count / total);
  }
  return tf;
}

/** Compute IDF across all sentence token lists: Map<term, idf>. */
function computeIDF(allTokenLists: string[][]): Map<string, number> {
  const docCount = allTokenLists.length;
  const docFreq = new Map<string, number>();

  for (const tokens of allTokenLists) {
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, freq] of docFreq) {
    idf.set(term, Math.log((docCount + 1) / (freq + 1)) + 1);
  }
  return idf;
}

/**
 * Compress text to approximately maxTokens using extractive TF-IDF summarisation.
 *
 * @param text     - Input text to compress
 * @param maxTokens - Maximum token budget for output
 * @returns Compressed text with top-scoring sentences preserved in order
 */
export function compress(text: string, maxTokens: number): string {
  const inputTokens = Math.ceil(text.length / CHARS_PER_TOKEN);

  // No compression needed if already within budget
  if (inputTokens <= maxTokens) return text;

  const sentences = splitSentences(text);

  // Can't compress a single sentence — truncate directly
  if (sentences.length <= 1) {
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    return text.slice(0, maxChars);
  }

  // Tokenise all sentences
  const tokenLists = sentences.map(tokenise);

  // Compute IDF over all sentences
  const idf = computeIDF(tokenLists);

  // Score each sentence by summing TF-IDF for its terms
  const scores: number[] = tokenLists.map((tokens) => {
    const tf = computeTF(tokens);
    let score = 0;
    for (const [term, tfVal] of tf) {
      score += tfVal * (idf.get(term) ?? 1);
    }
    // Boost score slightly for sentences that are near the beginning
    // (introductory sentences tend to be high-value)
    return score;
  });

  // Pair sentences with scores and sort descending
  const indexed = sentences.map((s, i) => ({ sentence: s, score: scores[i]!, index: i }));
  indexed.sort((a, b) => b.score - a.score);

  // Greedily pick top sentences within token budget
  let usedTokens = 0;
  const selected = new Set<number>();

  for (const { sentence, index } of indexed) {
    const sentenceTokens = Math.ceil(sentence.length / CHARS_PER_TOKEN) + 1; // +1 for separator
    if (usedTokens + sentenceTokens > maxTokens) continue;
    selected.add(index);
    usedTokens += sentenceTokens;
    if (usedTokens >= maxTokens * 0.95) break;
  }

  // Reconstruct in original order
  const result = sentences
    .filter((_, i) => selected.has(i))
    .join(' ');

  // Final safety: hard truncate if still over budget
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  return result.length > maxChars ? result.slice(0, maxChars) : result;
}