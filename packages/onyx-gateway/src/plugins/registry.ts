import type { OnyxPlugin } from "./types.js";
const registry = new Map<string, OnyxPlugin>();
export function register(name: string, plugin: OnyxPlugin): void { registry.set(name, plugin); }
export function get(name: string): OnyxPlugin | undefined { return registry.get(name); }
export function list(): string[] { return Array.from(registry.keys()); }