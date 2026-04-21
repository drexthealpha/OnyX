import { tallyVotes } from "./consensus.js";
import type { CouncilDecision, Vote } from "./consensus.js";
import { globalHerald } from "./herald.js";
import type { Herald } from "./herald.js";

export type { CouncilDecision, Vote };

const PROPOSAL_TIMEOUT_MS = 30_000;

export interface CouncilMember {
  agentId: string;
  weight: number;
}

export interface CouncilProposal {
  id: string;
  topic: string;
  payload: unknown;
  submittedAt: number;
}

export interface AgentProposalEvent {
  proposal: CouncilProposal;
  respond: (agentId: string, decision: boolean) => void;
}

let proposalCounter = 0;

function nextProposalId(): string {
  return `proposal-${Date.now()}-${++proposalCounter}`;
}

export class Council {
  private readonly members = new Map<string, CouncilMember>();
  private readonly herald: Herald;

  constructor(herald: Herald = globalHerald) {
    this.herald = herald;
  }

  join(agentId: string, weight: number): void {
    if (weight <= 0) {
      throw new RangeError(
        `Council.join: weight must be > 0, got ${weight} for agent "${agentId}"`,
      );
    }
    this.members.set(agentId, { agentId, weight });
  }

  leave(agentId: string): void {
    this.members.delete(agentId);
  }

  listMembers(): readonly CouncilMember[] {
    return [...this.members.values()];
  }

  async propose(topic: string, payload: unknown): Promise<CouncilDecision> {
    const proposalId = nextProposalId();
    const members = [...this.members.values()];

    if (members.length === 0) {
      return { approved: true, totalWeight: 0, yesWeight: 0, noWeight: 0 };
    }

    const votes: Vote[] = [];
    const responded = new Set<string>();

    return new Promise<CouncilDecision>((resolve) => {
      let settled = false;

      const timeoutHandle = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(tallyVotes(votes));
      }, PROPOSAL_TIMEOUT_MS);

      const proposal: CouncilProposal = {
        id: proposalId,
        topic,
        payload,
        submittedAt: Date.now(),
      };

      const respond = (agentId: string, decision: boolean): void => {
        if (settled) return;
        if (!this.members.has(agentId)) return;
        if (responded.has(agentId)) return;

        responded.add(agentId);
        const member = this.members.get(agentId)!;
        votes.push({ agentId, weight: member.weight, decision });

        if (responded.size === members.length) {
          settled = true;
          clearTimeout(timeoutHandle);
          cleanup();
          resolve(tallyVotes(votes));
        }
      };

      const event: AgentProposalEvent = { proposal, respond };
      const cleanup = this.herald.subscribe(
        `council.proposal.${proposalId}`,
        () => {},
      );

      this.herald.publish(`council.proposal.${proposalId}`, event);
    });
  }
}

export function createCouncil(herald?: Herald): Council {
  return new Council(herald);
}