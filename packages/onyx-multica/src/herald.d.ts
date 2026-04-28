export type HeraldHandler<T = unknown> = (data: T) => void;
export type HeraldUnsubscribe = () => void;
export declare class Herald {
    private readonly subscribers;
    private readonly debugLabel;
    constructor(debugLabel?: string);
    publish(topic: string, data: unknown): void;
    subscribe<T = unknown>(topic: string, handler: HeraldHandler<T>): HeraldUnsubscribe;
    subscriberCount(topic: string): number;
    clear(): void;
}
export declare function createHerald(label?: string): Herald;
export declare const globalHerald: Herald;
//# sourceMappingURL=herald.d.ts.map