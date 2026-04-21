import Anthropic from '@anthropic-ai/sdk';
import { DomainLevel } from '../types.ts';
import type { TutorBot, Question, Score } from '../types.ts';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

const levelMap: Record<DomainLevel, string> = {
  [DomainLevel.BEGINNER]:     'beginner (no prior finance or investing knowledge)',
  [DomainLevel.INTERMEDIATE]: 'intermediate (understands TradFi basics, new to DeFi)',
  [DomainLevel.ADVANCED]:     'advanced (familiar with DeFi protocols, AMMs, yield strategies)',
  [DomainLevel.EXPERT]:     'expert (deep knowledge of financial engineering and on-chain mechanics)',
};

export class FinanceTutor implements TutorBot {
  domain = 'finance';

  async teach(topic: string, level: DomainLevel): Promise<string> {
    const client = getClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: `You are a financial educator specializing in both traditional finance and DeFi/crypto economics.
Your student is a ${levelMap[level]}. Teach "${topic}" with concrete examples.
Always contextualize within the Solana ecosystem where relevant.
Include risk considerations and practical applications. Use markdown formatting.`,
      messages: [{ role: 'user', content: `Teach me: ${topic}` }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    return content.text;
  }

  async quiz(topic: string): Promise<Question[]> {
    const client = getClient();

    const prompt = `Generate exactly 3 finance quiz questions about "${topic}" with a DeFi/crypto angle where applicable.

Return ONLY valid JSON array (no markdown):
[{"text": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A) ...", "explanation": "...", "difficulty": 2}]`;

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

    const prompt = `Grade this finance quiz answer.
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