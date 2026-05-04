import { connectSSH, execSSH, createSSHKey, saveSSHKey, generateSSHKeyPair } from './ssh.js';
import { saveDeployment, updateDeploymentState, loadDeployment, getDeploymentDir } from './config.js';
import type { Deployment, DeploymentConfig, DeploymentState, CheckpointName } from '../types/index.js';
import { createHetznerServer, deleteHetznerServer, getHetznerServerIP } from '../providers/hetzner/api.js';
import { createDigitalOceanServer, deleteDigitalOceanServer, getDigitalOceanServerIP } from '../providers/digitalocean/api.js';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface DeploymentProgress {
  checkpoint: CheckpointName;
  progress: number;
  message: string;
}

const CHECKPOINTS: CheckpointName[] = [
  'server_created',
  'ssh_key_uploaded',
  'ssh_connected',
  'swap_configured',
  'system_updated',
  'nvm_installed',
  'node_installed',
  'pnpm_installed',
  'chrome_installed',
  'onyx_installed',
  'onyx_configured',
  'tailscale_installed',
  'tailscale_authenticated',
  'tailscale_configured',
  'daemon_started',
  'completed',
];

export function getCheckpointDescription(checkpoint: CheckpointName): string {
  const map: Record<CheckpointName, string> = {
    server_created: 'Creating server',
    ssh_key_uploaded: 'Uploading SSH key',
    ssh_connected: 'Connecting via SSH',
    swap_configured: 'Configuring swap',
    system_updated: 'Updating system',
    nvm_installed: 'Installing nvm',
    node_installed: 'Installing Node.js',
    pnpm_installed: 'Installing pnpm',
    chrome_installed: 'Installing Chrome',
    onyx_installed: 'Installing ONYX',
    onyx_configured: 'Configuring ONYX',
    tailscale_installed: 'Installing Tailscale',
    tailscale_authenticated: 'Authenticating Tailscale',
    tailscale_configured: 'Configuring Tailscale',
    daemon_started: 'Starting ONYX daemon',
    completed: 'Deployment complete',
  };
  return map[checkpoint] || checkpoint;
}

function getNextCheckpoint(current: CheckpointName): CheckpointName | null {
  const idx = CHECKPOINTS.indexOf(current);
  return idx >= 0 && idx < CHECKPOINTS.length - 1 ? (CHECKPOINTS[idx + 1] ?? null) : null;
}

export async function startDeployment(config: DeploymentConfig, onProgress?: (p: DeploymentProgress) => void): Promise<Deployment> {
  const initialState: DeploymentState = {
    status: 'initialized',
    serverId: undefined,
    serverIp: undefined,
    tailscaleIp: undefined,
    sshKeyId: undefined,
    checkpoints: [],
    gatewayToken: undefined,
    lastError: undefined,
    deployedAt: undefined,
    updatedAt: new Date().toISOString(),
  };

  const { publicKey, privateKey } = generateSSHKeyPair();
  const sshKeyPath = join(getDeploymentDir(config.name), 'id_ed25519');
  await saveSSHKey(sshKeyPath, privateKey);

  const deployment: Deployment = {
    config,
    state: initialState,
    sshKeyPath,
  };

  await saveDeployment(deployment);

  const progress = async (checkpoint: CheckpointName, message: string) => {
    const cp = {
      name: checkpoint,
      completedAt: new Date().toISOString(),
      retryCount: 0,
    };
    deployment.state.checkpoints.push(cp);
    deployment.state.status = checkpoint === 'completed' ? 'deployed' : 'provisioning';
    if (checkpoint === 'completed') {
      deployment.state.deployedAt = new Date().toISOString();
    }
    deployment.state.updatedAt = new Date().toISOString();
    await updateDeploymentState(config.name, deployment.state);
    onProgress?.({ checkpoint, progress: (CHECKPOINTS.indexOf(checkpoint) / CHECKPOINTS.length) * 100, message });
  };

  try {
    await progress('server_created', 'Creating server...');

    let serverIp: string | undefined;
    if (config.provider === 'hetzner' && config.hetzner) {
      const server = await createHetznerServer(config.hetzner.apiKey, config.hetzner.serverType, config.hetzner.location, config.hetzner.image, publicKey);
      deployment.state.serverId = server.id;
      serverIp = await getHetznerServerIP(config.hetzner.apiKey, server.id);
    } else if (config.provider === 'digitalocean' && config.digitalocean) {
      const server = await createDigitalOceanServer(config.digitalocean.apiKey, config.digitalocean.size, config.digitalocean.region, config.digitalocean.image, publicKey);
      deployment.state.serverId = server.id;
      serverIp = await getDigitalOceanServerIP(config.digitalocean.apiKey, server.id);
    }

    if (!serverIp) throw new Error('Failed to get server IP');
    deployment.state.serverIp = serverIp;

    await progress('ssh_key_uploaded', 'SSH key uploaded');
    await progress('ssh_connected', 'Connecting via SSH...');

    const ssh = await connectSSH({
      client: new (require('ssh2')).Client(),
      host: serverIp,
      port: 22,
      username: 'root',
      privateKeyPath: sshKeyPath,
    });

    await progress('swap_configured', 'Configuring swap...');
    await execSSH(ssh, 'fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile || true');

    await progress('system_updated', 'Updating system...');
    await execSSH(ssh, 'apt-get update && apt-get upgrade -y');

    await progress('nvm_installed', 'Installing nvm...');
    await execSSH(ssh, 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash');
    await execSSH(ssh, 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm install 20');

    await progress('node_installed', 'Installing Node.js...');
    await execSSH(ssh, 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && node -v');

    await progress('pnpm_installed', 'Installing pnpm...');
    await execSSH(ssh, 'npm install -g pnpm');

    await progress('chrome_installed', 'Installing Chrome...');
    await execSSH(ssh, 'apt-get install -y wget gnupg2');
    await execSSH(ssh, 'wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -');
    await execSSH(ssh, 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list');
    await execSSH(ssh, 'apt-get update && apt-get install -y google-chrome-stable');

    await progress('onyx_installed', 'Installing ONYX...');
    const onyxInstallCmd = config.provider === 'nosana'
      ? 'npm install -g @onyx/agent'
      : 'git clone https://github.com/onyx/onyx-agent.git /opt/onyx && cd /opt/onyx && pnpm install';
    await execSSH(ssh, onyxInstallCmd);

    await progress('onyx_configured', 'Configuring ONYX...');
    if (config.onyxAgent) {
      const configJson = JSON.stringify(config.onyxAgent);
      await execSSH(ssh, `echo '${configJson}' > /opt/onyx/config.json`);
    }

    if (!config.skipTailscale) {
      await progress('tailscale_installed', 'Installing Tailscale...');
      await execSSH(ssh, 'curl -fsSL https://tailscale.com/install.sh | sh');

      await progress('tailscale_authenticated', 'Authenticating Tailscale...');
      await execSSH(ssh, 'tailscale up --operator root');

      await progress('tailscale_configured', 'Configuring Tailscale...');
      const tailscaleIp = await execSSH(ssh, 'tailscale ip -4');
      deployment.state.tailscaleIp = tailscaleIp.trim();
    }

    await progress('daemon_started', 'Starting ONYX daemon...');
    const startCmd = config.provider === 'nosana'
      ? 'nohup onyx-agent start &'
      : 'cd /opt/onyx && nohup pnpm start &';
    await execSSH(ssh, startCmd);

    await progress('completed', 'Deployment complete!');
    ssh.end();

    return deployment;
  } catch (error) {
    deployment.state.status = 'failed';
    deployment.state.lastError = error instanceof Error ? error.message : String(error);
    deployment.state.updatedAt = new Date().toISOString();
    await updateDeploymentState(config.name, deployment.state);
    throw error;
  }
}

export async function destroyDeployment(name: string): Promise<void> {
  const deployment = await loadDeployment(name);
  if (!deployment) throw new Error(`Deployment ${name} not found`);

  if (deployment.config.provider === 'hetzner' && deployment.config.hetzner && deployment.state.serverId) {
    await deleteHetznerServer(deployment.config.hetzner.apiKey, deployment.state.serverId);
  } else if (deployment.config.provider === 'digitalocean' && deployment.config.digitalocean && deployment.state.serverId) {
    await deleteDigitalOceanServer(deployment.config.digitalocean.apiKey, deployment.state.serverId);
  }

  const { deleteDeployment } = await import('./config.js');
  await deleteDeployment(name);
}

export async function getDeploymentLogs(name: string): Promise<string[]> {
  const deployment = await loadDeployment(name);
  if (!deployment) throw new Error(`Deployment ${name} not found`);
  if (!deployment.state.serverIp) return ['No server IP available'];
  
  try {
    const ssh = await connectSSH({
      client: new (require('ssh2')).Client(),
      host: deployment.state.serverIp,
      port: 22,
      username: 'root',
      privateKeyPath: deployment.sshKeyPath,
    });
    const logs = await execSSH(ssh, 'journalctl -u onyx -n 100 --no-pager || cat /var/log/onyx.log 2>/dev/null || echo "No logs available"');
    ssh.end();
    return logs.split('\n').filter(l => l.trim());
  } catch {
    return ['Failed to fetch logs'];
  }
}
