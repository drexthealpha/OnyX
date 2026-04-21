import Anthropic from '@anthropic-ai/sdk';
import { ProfileStore } from '../learner/profile.ts';
import { DomainLevel } from '../types.ts';
import type { StudyPlan, LearnerProfile } from '../types.ts';

const profiles = new ProfileStore();

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey });
}

function levelLabel(level: DomainLevel): string {
  return {
    [DomainLevel.BEGINNER]:     'beginner',
    [DomainLevel.INTERMEDIATE]: 'intermediate',
    [DomainLevel.ADVANCED]:     'advanced',
    [DomainLevel.EXPERT]:       'expert',
  }[level];
}

function buildProfileContext(profile: LearnerProfile, topic: string): string {
  const domainKeys = Object.keys(profile.domains);
  const topicLower = topic.toLowerCase();

  let relevantLevel = DomainLevel.BEGINNER;
  for (const domain of domainKeys) {
    if (topicLower.includes(domain)) {
      relevantLevel = profile.domains[domain].level;
      break;
    }
  }

  if (domainKeys.length > 0 && relevantLevel === DomainLevel.BEGINNER) {
    relevantLevel = Math.max(
      ...domainKeys.map((d) => profile.domains[d].level),
    ) as DomainLevel;
  }

  return `Student is at ${levelLabel(relevantLevel)} level.
Goals: ${profile.goals.length > 0 ? profile.goals.join(', ') : 'not specified'}.
Learning style: ${profile.style}.`;
}

export async function createPlan(
  userId: string,
  topic: string,
): Promise<StudyPlan> {
  const client = getClient();
  const profile = profiles.getProfile(userId);
  const profileContext = buildProfileContext(profile, topic);

  const prompt = `Create a personalized study plan for the topic: "${topic}"

${profileContext}

Requirements:
- Generate EXACTLY 3 to 5 steps (no more, no less)
- Each step should be specific and actionable
- Calibrate complexity to the student's level
- Include estimated minutes for each step

Return ONLY valid JSON (no markdown) with this shape:
{
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "estimatedMinutes": 45
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  let parsed: { steps: string[]; estimatedMinutes: number };

  try {
    parsed = JSON.parse(content.text.trim());
  } catch {
    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse study plan from Claude response');
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length < 3) {
    throw new Error(`Plan must have at least 3 steps, got ${parsed.steps?.length ?? 0}`);
  }
  parsed.steps = parsed.steps.slice(0, 5);

  return {
    userId,
    topic,
    steps: parsed.steps,
    estimatedMinutes: parsed.estimatedMinutes ?? 30,
    generatedAt: Date.now(),
  };
}