import { z } from 'zod';

export type Provider = 'hetzner' | 'digitalocean' | 'nosana';
export const ProviderSchema = z.enum(['hetzner', 'digitalocean', 'nosana']);

export type DeploymentStatus = 'initialized' | 'provisioning' | 'configuring' | 'deployed' | 'failed' | 'updating';

export type CheckpointName =
  | 'server_created' | 'ssh_key_uploaded' | 'ssh_connected' | 'swap_configured'
  | 'system_updated' | 'nvm_installed' | 'node_installed' | 'pnpm_installed'
  | 'chrome_installed' | 'onyx_installed' | 'onyx_configured'
  | 'tailscale_installed' | 'tailscale_authenticated' | 'tailscale_configured'
  | 'daemon_started' | 'completed';

export interface Checkpoint { name: CheckpointName; completedAt: string; retryCount: number; }

export const HetznerConfigSchema = z.object({
  apiKey: z.string().min(1),
  serverType: z.string().default('cpx11'),
  location: z.string().default('ash'),
  image: z.string().default('ubuntu-24.04'),
});
export type HetznerConfig = z.infer<typeof HetznerConfigSchema>;

export const DigitalOceanConfigSchema = z.object({
  apiKey: z.string().min(1),
  size: z.string().default('s-1vcpu-2gb'),
  region: z.string().default('nyc1'),
  image: z.string().default('ubuntu-24-04-x64'),
});
export type DigitalOceanConfig = z.infer<typeof DigitalOceanConfigSchema>;

export const OnyxAgentConfigSchema = z.object({
  aiProvider: z.string().min(1),
  aiApiKey: z.string().min(1),
  model: z.string().min(1),
  channel: z.string().default('telegram'),
  telegramBotToken: z.string().default(''),
  telegramAllowFrom: z.string().optional(),
});
export type OnyxAgentConfig = z.infer<typeof OnyxAgentConfigSchema>;

export const DeploymentConfigSchema = z.object({
  name: z.string().min(1),
  provider: ProviderSchema,
  createdAt: z.string(),
  hetzner: HetznerConfigSchema.optional(),
  digitalocean: DigitalOceanConfigSchema.optional(),
  onyxAgent: OnyxAgentConfigSchema.optional(),
  skipTailscale: z.boolean().optional(),
});
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

export const DeploymentStateSchema = z.object({
  status: z.enum(['initialized','provisioning','configuring','deployed','failed','updating']),
  serverId: z.string().optional(),
  serverIp: z.string().optional(),
  tailscaleIp: z.string().optional(),
  sshKeyId: z.string().optional(),
  checkpoints: z.array(z.object({
    name: z.string(),
    completedAt: z.string(),
    retryCount: z.number(),
  })),
  gatewayToken: z.string().optional(),
  lastError: z.string().optional(),
  deployedAt: z.string().optional(),
  updatedAt: z.string(),
});
export type DeploymentState = z.infer<typeof DeploymentStateSchema>;

export interface Deployment { config: DeploymentConfig; state: DeploymentState; sshKeyPath: string; }

export type ViewName =
  | 'home' | 'new' | 'list' | 'deploy' | 'deploying' | 'status'
  | 'ssh' | 'logs' | 'dashboard' | 'destroy' | 'help' | 'templates' | 'channels'
  | 'nosana' | 'trading' | 'privacy' | 'intel' | 'tutor' | 'browser' | 'qvac';

export interface NosanaJob { jobId: string; image: string; status: string; cost: number; duration: number; }

export interface TradingPosition { token: string; amount: number; value: number; pnl: number; }
export interface TradeRecord { id: string; token: string; side: 'buy'|'sell'; amount: number; price: number; timestamp: number; }
export interface Portfolio { totalValue: number; positions: TradingPosition[]; recentTrades: TradeRecord[]; }

export interface PrivateBalance { balance: number; mint: string; shielded: boolean; }

export interface IntelSource { platform: string; title: string; url: string; score: number; snippet: string; }
export interface IntelBrief { topic: string; brief: string; sources: IntelSource[]; confidence: number; }

export interface TutorDomain { name: string; level: number; sessions: number; }
export interface TutorProfile { profileId: string; domains: TutorDomain[]; }

export interface BrowserElement { elementRef: string; type: string; text: string; }
export interface BrowserSnapshot { tabId: string; elements: BrowserElement[]; text: string; }

export const TemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  builtIn: z.boolean(),
  createdAt: z.string(),
  provider: ProviderSchema,
  hetzner: z.object({ serverType: z.string(), location: z.string(), image: z.string() }).optional(),
  digitalocean: z.object({ size: z.string(), region: z.string(), image: z.string() }).optional(),
  aiProvider: z.string().min(1),
  model: z.string().min(1),
  channel: z.string().default('telegram'),
});
export type Template = z.infer<typeof TemplateSchema>;

export const SavedSecretSchema = z.object({ id: z.string(), name: z.string(), value: z.string(), createdAt: z.string() });
export type SavedSecret = z.infer<typeof SavedSecretSchema>;

export interface SystemStatus { status: string; uptime: number; memory: { used: number; total: number }; nerve_port?: number; }
export interface Channel { id: string; name: string; type: string; agentId: string; }