// ─── Domain & Skill Levels ─────────────────────────────────────────────────────

export enum DomainLevel {
  BEGINNER     = 1,
  INTERMEDIATE = 2,
  ADVANCED     = 3,
  EXPERT       = 4,
}

// ─── Learner Profile ────────────────────────────────────────────────────────

export type LearningStyle = 'visual' | 'verbal' | 'sequential' | 'global';

export interface DomainRecord {
  level: DomainLevel;
  confidence: number;  // 0.0 – 1.0
  lastUpdated: number; // Unix ms timestamp
}

export interface LearnerProfile {
  userId: string;
  domains: Record<string, DomainRecord>;
  style: LearningStyle;
  goals: string[];
  preferences: Record<string, string>;
}

// ─── Quiz & Evaluation ────────────────────────────────────────────────────

export interface Question {
  text: string;
  correctAnswer: string;
  explanation: string;
  difficulty: DomainLevel;
  options?: string[]; // for multiple-choice; correctAnswer must be one of these
}

export interface Score {
  correct: boolean;
  confidence: number; // 0.0 – 1.0 model confidence in evaluation
  feedback: string; // human-readable explanation of grade
}

// ─── TutorBot Interface ──────────────────────────────────────────────────────

export interface TutorBot {
  domain: string;
  teach(topic: string, level: DomainLevel): Promise<string>;
  quiz(topic: string): Promise<Question[]>;
  evaluate(answer: string, question: Question): Promise<Score>;
}

// ─── Study Plan ────────────────────────────────────────────────────────

export interface StudyPlan {
  userId: string;
  topic: string;
  steps: string[];
  estimatedMinutes: number;
  generatedAt: number; // Unix ms timestamp
}

// ─── Progress ─────────────────────────────────────────────────────────────

export interface ProgressRecord {
  userId: string;
  domain: string;
  sessionDate: number; // Unix ms
  topicsCovered: string[];
  quizScore: number; // 0.0 – 1.0
  levelAtTime: DomainLevel;
}

// ─── HTTP API Shapes ────────────────────────────────────────────────────────────

export interface TeachRequest {
  userId: string;
  domain: string;
  topic: string;
}

export interface QuizRequest {
  userId: string;
  domain: string;
  topic: string;
}

export interface EvaluateRequest {
  userId: string;
  answer: string;
  question: Question;
}

export interface PlanRequest {
  userId: string;
  topic: string;
  domain?: string;
}

export interface UpdateScoreRequest {
  userId: string;
  domain: string;
  score: number; // 0.0 – 1.0
}

export interface SetGoalRequest {
  userId: string;
  goal: string;
}
