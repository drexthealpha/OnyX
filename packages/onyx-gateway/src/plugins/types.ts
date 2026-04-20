export interface OnyxPlugin {
  name: string;
  version: string;
  init(config: Record<string, unknown>): Promise<void>;
  execute(input: unknown): Promise<unknown>;
  teardown?(): Promise<void>;
}