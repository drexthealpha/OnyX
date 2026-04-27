import { DomainLevel } from '../types.ts';
import type { TutorBot, Question, Score } from '../types.ts';
export declare class ResearchTutor implements TutorBot {
    domain: string;
    teach(topic: string, level: DomainLevel): Promise<string>;
    quiz(topic: string): Promise<Question[]>;
    evaluate(answer: string, question: Question): Promise<Score>;
}
//# sourceMappingURL=research-tutor.d.ts.map