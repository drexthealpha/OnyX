export type PreferenceKey = 'response_length' | 'code_examples' | 'analogy_style' | 'language' | 'formality' | 'pace';
export declare const PREFERENCE_DEFAULTS: Record<PreferenceKey, string>;
export declare function detectPreferences(conversationHistory: string[]): Partial<Record<PreferenceKey, string>>;
export declare function mergePreferences(existing: Record<string, string>, detected: Partial<Record<PreferenceKey, string>>): Record<string, string>;
export declare function preferencesToPromptHint(prefs: Record<string, string>): string;
//# sourceMappingURL=preferences.d.ts.map