import Anthropic from '@anthropic-ai/sdk';
import { DomainLevel } from '../types.js';
import type { TutorBot, Question, Score } from '../types.js';

function getClient(): Anthropic {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

const levelMap: Record<DomainLevel, string> = {
  [DomainLevel.BEGINNER]:     'beginner researcher (undergraduate level)',
  [DomainLevel.INTERMEDIATE]: 'intermediate (graduate student with some research experience)',
  [DomainLevel.ADVANCED]:     'advanced (PhD candidate, familiar with research methodology)',
  [DomainLevel.EXPERT]:       'expert (practicing researcher, publishing author)',
};

export class ResearchTutor implements TutorBot {
  domain = 'research';

  async teach(topic: string, level: DomainLevel): Promise<string> {
    const client = getClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: `You are an expert research mentor helping a ${levelMap[level]} understand research concepts.
Teach "${topic}" with practical examples from AI/ML and crypto research where relevant.
Emphasize critical thinking, source evaluation, and rigorous methodology.`,
      messages: [{ role: 'user', content: `Teach me about: ${topic}` }],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') throw new Error('Unexpected response type');
    return (content as any).text || '';
  }

  async quiz(topic: string): Promise<Question[]> {
    const client = getClient();

    const prompt = `Generate exactly 3 quiz questions testing research skills about "${topic}".
Include questions about methodology, critical evaluation, and application.

Return ONLY valid JSON array (no markdown):
[{"text": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A) ...", "explanation": "...", "difficulty": 2}]`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') throw new Error('Unexpected response type');

    const text = (content as any).text || '';
    try {
      return JSON.parse(text.trim()) as Question[];
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Could not parse quiz questions');
      return JSON.parse(match[0]!) as Question[];
    }
  }

  async evaluate(answer: string, question: Question): Promise<Score> {
    const client = getClient();

    const prompt = `Grade this research quiz answer.
Question: ${question.text}
Correct Answer: ${question.correctAnswer}
Student Answer: ${answer}

Return ONLY JSON: {"correct": boolean, "confidence": 0.0-1.0, "feedback": "string"}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') throw new Error('Unexpected response type');

    const text = (content as any).text || '';
    try {
      return JSON.parse(text.trim()) as Score;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse score');
      return JSON.parse(match[0]!) as Score;
    }
  }
}
