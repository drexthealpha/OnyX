export declare enum DomainLevel {
    BEGINNER = 1,
    INTERMEDIATE = 2,
    ADVANCED = 3,
    EXPERT = 4
}
export type LearningStyle = 'visual' | 'verbal' | 'sequential' | 'global';
export interface DomainRecord {
    level: DomainLevel;
    confidence: number;
    lastUpdated: number;
}
export interface LearnerProfile {
    userId: string;
    domains: Record<string, DomainRecord>;
    style: LearningStyle;
    goals: string[];
    preferences: Record<string, string>;
}
export interface Question {
    text: string;
    correctAnswer: string;
    explanation: string;
    difficulty: DomainLevel;
    options?: string[];
}
export interface Score {
    correct: boolean;
    confidence: number;
    feedback: string;
}
export interface TutorBot {
    domain: string;
    teach(topic: string, level: DomainLevel): Promise<string>;
    quiz(topic: string): Promise<Question[]>;
    evaluate(answer: string, question: Question): Promise<Score>;
}
export interface StudyPlan {
    userId: string;
    topic: string;
    steps: string[];
    estimatedMinutes: number;
    generatedAt: number;
}
export interface ProgressRecord {
    userId: string;
    domain: string;
    sessionDate: number;
    topicsCovered: string[];
    quizScore: number;
    levelAtTime: DomainLevel;
}
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
    score: number;
}
export interface SetGoalRequest {
    userId: string;
    goal: string;
}
//# sourceMappingURL=types.d.ts.map