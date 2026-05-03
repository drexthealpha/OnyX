import Anthropic from '@anthropic-ai/sdk';
import { DomainLevel } from '../types.js';
import type { TutorBot, Question, Score } from '../types.js';

function getClient(): Anthropic {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

function levelLabel(level: DomainLevel): string {
  return {
    [DomainLevel.BEGINNER]:     'beginner (no prior crypto knowledge)',
    [DomainLevel.INTERMEDIATE]: 'intermediate (familiar with blockchain basics)',
    [DomainLevel.ADVANCED]:     'advanced (understands DeFi protocols and smart contracts)',
    [DomainLevel.EXPERT]:       'expert (deep protocol-level knowledge, reads Anchor code)',
  }[level];
}

export class CryptoTutor implements TutorBot {
  domain = 'crypto';

  async teach(topic: string, level: DomainLevel): Promise<string> {
    const client = getClient();

    const systemPrompt = `You are an expert Solana and DeFi educator. 
Your student is at ${levelLabel(level)} level.
Teach "${topic}" in a way appropriate for this level.
- For beginners: use simple analogies, no jargon without explanation.
- For intermediate: explain mechanisms, give examples from Solana ecosystem.
- For advanced: discuss protocol design, trade-offs, and real implementations.
- For expert: discuss internals, security considerations, code-level details.
Keep your response focused and educational. Use markdown formatting.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Teach me about: ${topic}` }],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') throw new Error('Unexpected response type');
    return (content as any).text || '';
  }

  async quiz(topic: string): Promise<Question[]> {
    const client = getClient();

    const prompt = `Generate exactly 3 multiple-choice quiz questions about "${topic}" in the context of Solana and DeFi.

Return ONLY valid JSON array with this exact shape (no markdown, no explanation):
[
  {
    "text": "Question text here?",
    "options": ["A) option", "B) option", "C) option", "D) option"],
    "correctAnswer": "A) option",
    "explanation": "Why this is correct",
    "difficulty": 2
  }
]

difficulty: 1=beginner, 2=intermediate, 3=advanced, 4=expert
Make questions progressively harder.`;

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
      if (!match) throw new Error('Could not parse quiz questions from Claude response');
      return JSON.parse(match[0]!) as Question[];
    }
  }

  async evaluate(answer: string, question: Question): Promise<Score> {
    const client = getClient();

    const prompt = `You are grading a student's answer to a quiz question.

Question: ${question.text}
Correct Answer: ${question.correctAnswer}
Explanation: ${question.explanation}
Student's Answer: ${answer}

Evaluate the answer and return ONLY valid JSON with this shape (no markdown):
{
  "correct": true or false,
  "confidence": 0.0 to 1.0 (how confident you are in your grading),
  "feedback": "Short, constructive feedback for the student"
}`;

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
      if (!match) throw new Error('Could not parse score from Claude response');
      return JSON.parse(match[0]!) as Score;
    }
  }
}
