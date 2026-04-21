export type HeraldHandler<T = unknown> = (data: T) => void;
export type HeraldUnsubscribe = () => void;

export class Herald {
  private readonly subscribers = new Map<string, Set<HeraldHandler>>();
  private readonly debugLabel: string;

  constructor(debugLabel = "Herald") {
    this.debugLabel = debugLabel;
  }

  publish(topic: string, data: unknown): void {
    const handlers = this.subscribers.get(topic);
    if (handlers === undefined || handlers.size === 0) return;

    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(
          `[${this.debugLabel}] Handler error on topic "${topic}":`,
          err,
        );
      }
    }
  }

  subscribe<T = unknown>(
    topic: string,
    handler: HeraldHandler<T>,
  ): HeraldUnsubscribe {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }

    const typedHandler = handler as HeraldHandler;
    this.subscribers.get(topic)!.add(typedHandler);

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      this.subscribers.get(topic)?.delete(typedHandler);
    };
  }

  subscriberCount(topic: string): number {
    return this.subscribers.get(topic)?.size ?? 0;
  }

  clear(): void {
    this.subscribers.clear();
  }
}

export function createHerald(label?: string): Herald {
  return new Herald(label);
}

export const globalHerald: Herald = createHerald("ONYX");