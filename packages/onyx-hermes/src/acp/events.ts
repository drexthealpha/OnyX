/**
 * Skill execution event emitter.
 * Allows internal modules to subscribe to skill lifecycle events.
 */

import { EventEmitter } from 'events';

export enum SkillEventType {
  BEFORE_EXECUTE = 'skill:before_execute',
  AFTER_EXECUTE = 'skill:after_execute',
  EXECUTE_ERROR = 'skill:execute_error',
  IMPROVED = 'skill:improved',
  BENCHMARK_COMPLETE = 'skill:benchmark_complete',
  GEPA_GENERATION = 'skill:gepa_generation',
}

export interface BeforeExecuteEvent {
  skillName: string;
  input: string;
  sessionId: string;
}

export interface AfterExecuteEvent {
  skillName: string;
  result: string;
  tokensUsed: number;
  latencyMs: number;
  sessionId: string;
}

export interface ExecuteErrorEvent {
  skillName: string;
  error: string;
  sessionId: string;
}

export interface ImprovedEvent {
  skillName: string;
  oldScore: number;
  newPrompt: string;
}

class TypedEventEmitter extends EventEmitter {
  emitTyped(event: SkillEventType.BEFORE_EXECUTE, data: BeforeExecuteEvent): boolean;
  emitTyped(event: SkillEventType.AFTER_EXECUTE, data: AfterExecuteEvent): boolean;
  emitTyped(event: SkillEventType.EXECUTE_ERROR, data: ExecuteErrorEvent): boolean;
  emitTyped(event: SkillEventType.IMPROVED, data: ImprovedEvent): boolean;
  emitTyped(event: string, data: unknown): boolean {
    return this.emit(event, data);
  }
}

export const skillEvents = new EventEmitter();