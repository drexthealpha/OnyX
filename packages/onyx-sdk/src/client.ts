// packages/onyx-sdk/src/client.ts

// ── Internal stub types (matching upstream signatures) ────────────────────────────────
import type { OnyxRuntime, IntelBrief, ResearchState, TradeDecision, OrchestratorConfig } from '@onyx/agent';

type RunResearchFn = (topic: string) => Promise<ResearchState>;
type RunIntelFn = (topic: string) => Promise<IntelBrief>;
type RunAnalysisFn = (token: string, config?: Partial<OrchestratorConfig>) => Promise<TradeDecision>;
type GetComputeFn = () => Promise<string>;

type PrivacyClient = unknown;
type TutorApp = unknown;

export interface OnyxClientConfig {
  nerveUrl: string;
  walletPath: string;
  network: 'mainnet' | 'devnet';
}

export class OnyxClient {
  readonly config: OnyxClientConfig;

  private _agent: OnyxRuntime | undefined;
  private _vault: unknown | undefined;
  private _research: RunResearchFn | undefined;
  private _intel: RunIntelFn | undefined;
  private _trading: RunAnalysisFn | undefined;
  private _privacy: PrivacyClient | undefined;
  private _compute: GetComputeFn | undefined;
  private _tutor: TutorApp | undefined;

  constructor(config: OnyxClientConfig) {
    this.config = config;
  }

  async getAgent(): Promise<OnyxRuntime> {
    if (!this._agent) {
      const { createOnyxRuntime } = await import('@onyx/agent');
      const { onyxCharacter } = await import('@onyx/agent');
      this._agent = createOnyxRuntime(onyxCharacter, []);
    }
    return this._agent;
  }

  async getVault(): Promise<unknown> {
    if (!this._vault) {
      const vault = await import('@onyx/vault');
      this._vault = vault;
    }
    return this._vault;
  }

  async getResearch(): Promise<RunResearchFn> {
    if (!this._research) {
      const { ResearchGraph, runResearch } = await import('@onyx/research');
      this._research = async (topic: string): Promise<ResearchState> => {
        return runResearch(topic);
      };
    }
    return this._research;
  }

  async research(topic: string): Promise<ResearchState> {
    const fn = await this.getResearch();
    return fn(topic);
  }

  async getIntel(): Promise<RunIntelFn> {
    if (!this._intel) {
      const { runIntel } = await import('@onyx/intel');
      this._intel = runIntel;
    }
    return this._intel;
  }

  async intel(topic: string): Promise<IntelBrief> {
    const fn = await this.getIntel();
    return fn(topic);
  }

  async getTrading(): Promise<RunAnalysisFn> {
    if (!this._trading) {
      const { runAnalysis } = await import('@onyx/trading');
      this._trading = runAnalysis;
    }
    return this._trading;
  }

  async trade(
    token: string,
    config?: Partial<OrchestratorConfig>,
  ): Promise<TradeDecision> {
    const fn = await this.getTrading();
    return fn(token, config);
  }

  async getPrivacy(signerOverride?: unknown): Promise<PrivacyClient> {
    if (!this._privacy) {
      const { createUmbraClient } = await import('@onyx/privacy');
      if (!signerOverride) {
        throw new Error(
          '[OnyxClient] privacy requires a signer. Pass signerOverride to getPrivacy(signer).',
        );
      }
      this._privacy = await createUmbraClient({
        signer: signerOverride,
        network: this.config.network,
      });
    }
    return this._privacy;
  }

  async getCompute(): Promise<GetComputeFn> {
    if (!this._compute) {
      const { getCompute } = await import('@onyx/compute');
      this._compute = getCompute;
    }
    return this._compute;
  }

  async compute(): Promise<string> {
    const fn = await this.getCompute();
    return fn();
  }

  async getTutor(): Promise<TutorApp> {
    if (!this._tutor) {
      const tutorMod = await import('@onyx/tutor');
      this._tutor = tutorMod as TutorApp;
    }
    return this._tutor;
  }
}

export default OnyxClient;