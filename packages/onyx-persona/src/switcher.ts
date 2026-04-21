// packages/onyx-persona/src/switcher.ts
// Persona switching logic with @onyx/multica herald event emission.

import type { Persona } from './types';
import type { ConversationContext } from './context';
import { analyzeContext } from './context';
import { PERSONA_REGISTRY, DEFAULT_PERSONA_NAME } from './index';

// Lazy import of herald to avoid hard circular dependency at load time.
// @onyx/multica exposes a singleton herald bus compatible with EventEmitter.
let _herald: { emit: (event: string, payload: unknown) => void } | null = null;

async function getHerald() {
  if (!_herald) {
    try {
      // Dynamic import — multica may not be present in all runtime environments (e.g. nomad/offline)
      const mod = await import('@onyx/multica');
      _herald = mod.herald ?? mod.default?.herald ?? null;
    } catch {
      // Gracefully degrade: no herald in offline/nomad environments
      _herald = { emit: () => {} };
    }
  }
  return _herald!;
}

let _active: Persona | null = null;

function getActivePersona(): Persona {
  if (!_active) {
    _active = PERSONA_REGISTRY[DEFAULT_PERSONA_NAME]!;
  }
  return _active;
}

/**
 * Explicitly switch to a named persona.
 * Emits a `persona:switch` event via @onyx/multica herald.
 * Throws if the name is not found in the registry.
 */
export async function switchTo(
  name: string,
  context: ConversationContext
): Promise<Persona> {
  const persona = PERSONA_REGISTRY[name];
  if (!persona) {
    throw new Error(
      `[onyx-persona] Unknown persona "${name}". ` +
        `Available: ${Object.keys(PERSONA_REGISTRY).join(', ')}`
    );
  }

  const previous = getActivePersona().name;
  _active = persona;

  const herald = await getHerald();
  herald.emit('persona:switch', {
    from: previous,
    to: persona.name,
    trigger: 'explicit',
    contextSnapshot: context.messages.slice(-3),
    ts: Date.now(),
  });

  return persona;
}

/**
 * Auto-detect the best persona for the current conversation context.
 * Scans all registered personas' contextTriggers against the context.
 * Returns the first matching persona, or the default ('research') if none match.
 * Emits a `persona:switch` event if the detected persona differs from the current active one.
 *
 * Priority order follows PERSONA_REGISTRY insertion order. To change priority,
 * re-order the registry in index.ts.
 */
export async function autoDetect(
  context: ConversationContext
): Promise<Persona> {
  let detected: Persona | null = null;

  for (const persona of Object.values(PERSONA_REGISTRY)) {
    if (analyzeContext(context, persona.contextTriggers)) {
      detected = persona;
      break;
    }
  }

  const target = detected ?? PERSONA_REGISTRY[DEFAULT_PERSONA_NAME]!;

  if (target.name !== getActivePersona().name) {
    const previous = getActivePersona().name;
    _active = target;

    const herald = await getHerald();
    herald.emit('persona:switch', {
      from: previous,
      to: target.name,
      trigger: 'auto',
      contextSnapshot: context.messages.slice(-3),
      ts: Date.now(),
    });
  }

  return target;
}

/** Returns the currently active persona without switching. */
export function activePersona(): Persona {
  return getActivePersona();
}