import type { LearnerProfile } from '../types.js';

export type PreferenceKey =
  | 'response_length'
  | 'code_examples'
  | 'analogy_style'
  | 'language'
  | 'formality'
  | 'pace';

export const PREFERENCE_DEFAULTS: Record<PreferenceKey, string> = {
  response_length: 'detailed',
  code_examples:   'sometimes',
  analogy_style:  'everyday',
  language:      'en',
  formality:     'casual',
  pace:          'normal',
};

export function detectPreferences(
  conversationHistory: string[],
): Partial<Record<PreferenceKey, string>> {
  const text = conversationHistory.join(' ').toLowerCase();
  const detected: Partial<Record<PreferenceKey, string>> = {};

  if (/\b(brief|short|quick|tldr|summary)\b/.test(text)) {
    detected.response_length = 'concise';
  } else if (/\b(detail|thorough|explain|comprehensive|full)\b/.test(text)) {
    detected.response_length = 'detailed';
  }

  if (/\b(code|example|snippet|show me|implementation)\b/.test(text)) {
    detected.code_examples = 'always';
  } else if (/\b(no code|without code|conceptual|theory)\b/.test(text)) {
    detected.code_examples = 'never';
  }

  if (/\b(please|kindly|could you|would you)\b/.test(text)) {
    detected.formality = 'formal';
  } else if (/\b(hey|yo|sup|lol|ngl)\b/.test(text)) {
    detected.formality = 'casual';
  }

  if (/\b(slow down|simpler|basic|beginner|confused)\b/.test(text)) {
    detected.pace = 'slow';
  } else if (/\b(fast|quick|already know|skip|advanced)\b/.test(text)) {
    detected.pace = 'fast';
  }

  return detected;
}

export function mergePreferences(
  existing: Record<string, string>,
  detected: Partial<Record<PreferenceKey, string>>,
): Record<string, string> {
  const merged = { ...PREFERENCE_DEFAULTS, ...existing };
  for (const [key, value] of Object.entries(detected)) {
    if (merged[key] === PREFERENCE_DEFAULTS[key as PreferenceKey]) {
      merged[key] = value!;
    }
  }
  return merged;
}

export function preferencesToPromptHint(prefs: Record<string, string>): string {
  const hints: string[] = [];

  if (prefs.response_length === 'concise') hints.push('Keep responses concise and to the point.');
  if (prefs.response_length === 'detailed') hints.push('Provide thorough, detailed explanations.');
  if (prefs.code_examples === 'always') hints.push('Always include code examples.');
  if (prefs.code_examples === 'never') hints.push('Avoid code; use conceptual explanations only.');
  if (prefs.formality === 'formal') hints.push('Use formal, professional language.');
  if (prefs.formality === 'casual') hints.push('Use a friendly, casual tone.');
  if (prefs.pace === 'slow') hints.push('Go slowly and check understanding at each step.');
  if (prefs.pace === 'fast') hints.push('Move quickly; assume strong foundational knowledge.');

  return hints.join(' ');
}
