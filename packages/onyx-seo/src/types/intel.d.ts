declare module "@onyx/intel" {
  export interface IntelBrief {
    topic: string;
    brief: string;
    sources: string[];
    timestamp: number;
    confidence: number;
  }
  export function runIntel(topic: string): Promise<IntelBrief>;
}