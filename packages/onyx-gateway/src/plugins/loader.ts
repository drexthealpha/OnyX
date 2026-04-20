import type { OnyxPlugin } from "./types.js";
import { register } from "./registry.js";

export async function loadPlugin(modulePath: string): Promise<OnyxPlugin> {
  const mod = await import(modulePath);
  const plugin: OnyxPlugin = (mod as any).default ?? mod;
  if (!plugin.name || !plugin.init || !plugin.execute) {
    throw new Error(`Invalid plugin at ${modulePath}: missing name, init, or execute`);
  }
  register(plugin.name, plugin);
  return plugin;
}

export async function loadPluginsFromDir(dir: string): Promise<OnyxPlugin[]> {
  const loaded: OnyxPlugin[] = [];
  try {
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(dir);
    for (const entry of entries) {
      if (!entry.endsWith(".js") && !entry.endsWith(".ts")) continue;
      try {
        const plugin = await loadPlugin(`${dir}/${entry}`);
        loaded.push(plugin);
      } catch {
        // skip invalid plugin files
      }
    }
  } catch {
    // dir doesn't exist, no plugins
  }
  return loaded;
}