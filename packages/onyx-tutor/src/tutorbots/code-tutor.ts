import Anthropic from '@anthropic-ai/sdk';
import { DomainLevel } from '../types.ts';
import type { TutorBot, Question, Score } from '../types.ts';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

function levelLabel(level: DomainLevel): string {
  return {
    [DomainLevel.BEGINNER]:     'beginner (new to programming or TypeScript)',
    [DomainLevel.INTERMEDIATE]: 'intermediate (comfortable with TypeScript, new to Rust/Anchor)',
    [DomainLevel.ADVANCED]:     'advanced (proficient in Rust, understands Anchor basics)',
    [DomainLevel.EXPERT]:      'expert (deep Rust, Anchor internals, Solana runtime)',
  }[level];
}

export class CodeTutor implements TutorBot {
  domain = 'code';

  async teach(topic: string, level: DomainLevel): Promise<string> {
    const client = getClient();

    const systemPrompt = `You are an expert software engineering educator specializing in TypeScript, Rust, and Anchor (Solana smart contracts).
Your student is at ${levelLabel(level)} level.
Teach "${topic}" with concrete, runnable code examples.
- For beginners: explain syntax, use comments in code, avoid complex patterns.
- For intermediate: introduce idiomatic patterns, compare with familiar languages.
- For advanced: discuss performance, safety, ownership, and Anchor constraints.
- For expert: cover edge cases, runtime internals, security vulnerabilities to avoid.
Always show working code. Use markdown with proper syntax highlighting.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Teach me: ${topic}` }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    return content.text;
  }

  async quiz(topic: string): Promise<Question[]> {
    const client = getClient();

    const prompt = `Generate exactly 3 coding quiz questions about "${topic}" covering TypeScript, Rust, or Anchor.
Mix conceptual and code-reading questions.

Return ONLY valid JSON array (no markdown):
[
  {
    "text": "Question or code snippet + question?",
    "options": ["A) option", "B) option", "C) option", "D) option"],
    "correctAnswer": "A) option",
    "explanation": "Explanation of the correct answer",
    "difficulty": 2
  }
]`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    try {
      return JSON.parse(content.text.trim()) as Question[];
    } catch {
      const match = content.text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Could not parse quiz questions');
      return JSON.parse(match[0]) as Question[];
    }
  }

  async evaluate(answer: string, question: Question): Promise<Score> {
    const client = getClient();

    const prompt = `Grade this coding quiz answer.

Question: ${question.text}
Correct Answer: ${question.correctAnswer}
Explanation: ${question.explanation}
Student Answer: ${answer}

Return ONLY valid JSON (no markdown):
{"correct": boolean, "confidence": 0.0-1.0, "feedback": "constructive feedback"}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    try {
      return JSON.parse(content.text.trim()) as Score;
    } catch {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse score');
      return JSON.parse(match[0]) as Score;
    }
  }
}