// ─── ResearchGraph — pure function state machine ──────────────────────────────
// Inspired by DeerFlow's LangGraph-style pipeline:
//   planner → retriever → researcher → synthesizer → reflector → reporter
// Each node is a pure async (state) => state function.
// Edges are fixed — no conditional routing needed for v1.

import type { ResearchState } from "./types.js";
import { createEmptyState } from "./types.js";
import { plan } from "./planner.js";
import { retrieve } from "./retriever.js";
import { analyzeSource } from "./researcher.js";
import { synthesize } from "./synthesizer.js";
import { reflect } from "./reflector.js";
import { report } from "./reporter.js";

type Node = (state: ResearchState) => Promise<ResearchState>;

const EDGES: Array<{ name: string; fn: Node }> = [
  { name: "planner", fn: plan },
  { name: "retriever", fn: retrieve },
  { name: "researcher", fn: researcherNode },
  { name: "synthesizer", fn: synthesize },
  { name: "reflector", fn: reflect },
  { name: "reporter", fn: report },
];

async function researcherNode(state: ResearchState): Promise<ResearchState> {
  if (state.retrievedContent.length === 0) return state;

  const chunks: Array<typeof state.retrievedContent> = [];
  const CHUNK = 8;
  for (let i = 0; i < state.retrievedContent.length; i += CHUNK) {
    chunks.push(state.retrievedContent.slice(i, i + CHUNK));
  }

  let currentState = { ...state };
  for (const chunk of chunks) {
    const results = await Promise.all(chunk.map((item) => analyzeSource(currentState, item)));
    currentState = results[results.length - 1] ?? currentState;
  }

  return currentState;
}

export class ResearchGraph {
  private edges: Array<{ name: string; fn: Node }>;

  constructor(edges = EDGES) {
    this.edges = edges;
  }

  async run(topic: string): Promise<ResearchState> {
    let state = createEmptyState(topic);

    for (const { name, fn } of this.edges) {
      try {
        state = await fn(state);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[ResearchGraph] node "${name}" failed:`, msg);
        state = {
          ...state,
          errors: [...(state.errors ?? []), `${name}: ${msg}`],
        };
      }
    }

    return { ...state, complete: true };
  }
}

export async function runResearch(topic: string): Promise<ResearchState> {
  const graph = new ResearchGraph();
  return graph.run(topic);
}