import { DomainLevel } from '../types.ts';
import type { Question } from '../types.ts';
export declare function generateQuiz(topic: string, level: DomainLevel): Promise<Question[]>;
export interface QuizResult {
    score: number;
    correctCount: number;
    totalCount: number;
    feedback: string[];
}
export declare function evaluateAnswers(answers: string[], questions: Question[], userId?: string, domain?: string): Promise<QuizResult>;
//# sourceMappingURL=quizzer.d.ts.map