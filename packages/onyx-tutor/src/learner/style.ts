import type { LearningStyle } from '../types.js';

const STYLE_VOCAB: Record<LearningStyle, string[]> = {
  visual: [
    'show', 'diagram', 'see', 'picture', 'chart', 'graph', 'visualize',
    'draw', 'display', 'illustrate', 'map', 'figure', 'image', 'look',
  ],
  verbal: [
    'explain', 'describe', 'tell', 'discuss', 'elaborate', 'clarify',
    'define', 'articulate', 'say', 'what is', 'what does', 'how does',
  ],
  sequential: [
    'step', 'first', 'then', 'next', 'after', 'before', 'finally',
    'second', 'third', 'order', 'sequence', 'process', 'procedure', 'flow',
  ],
  global: [
    'overview', 'summary', 'big picture', 'overall', 'general', 'concept',
    'idea', 'briefly', 'high-level', 'gist', 'in short', 'main point',
  ],
};

export function detectStyle(conversationHistory: string[]): LearningStyle {
  const text = conversationHistory.join(' ').toLowerCase();

  const scores: Record<LearningStyle, number> = {
    visual: 0,
    verbal: 0,
    sequential: 0,
    global: 0,
  };

  for (const [style, words] of Object.entries(STYLE_VOCAB) as [LearningStyle, string[]][]) {
    for (const word of words) {
      let pos = 0;
      while ((pos = text.indexOf(word, pos)) !== -1) {
        scores[style]++;
        pos += word.length;
      }
    }
  }

  const priority: LearningStyle[] = ['sequential', 'visual', 'verbal', 'global'];
  let winner: LearningStyle = 'verbal';
  let maxScore = -1;

  for (const style of priority) {
    if (scores[style] > maxScore) {
      maxScore = scores[style];
      winner = style;
    }
  }

  return winner;
}

export function styleDescription(style: LearningStyle): string {
  const descriptions: Record<LearningStyle, string> = {
    visual:     'Use diagrams, code blocks, tables, and visual metaphors. Prefer showing over telling.',
    verbal:     'Use clear narrative explanations. Define terms explicitly. Avoid jargon without context.',
    sequential: 'Present ideas step-by-step in strict order. Number your steps. Avoid jumping ahead.',
    global:     'Start with the big picture and context before diving into details. Summarize frequently.',
  };
  return descriptions[style];
}
