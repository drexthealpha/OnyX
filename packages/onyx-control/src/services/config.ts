import { mkdir, readFile, writeFile, readdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { DeploymentConfig, DeploymentState, Deployment, DeploymentConfigSchema, DeploymentStateSchema } from '../types/index.js';

const ONYX_CONTROL_DIR = join(homedir(), '.onyx', 'control');
const DEPLOYMENTS_DIR = join(ONYX_CONTROL_DIR, 'deployments');

async function ensureDirs() {
  if (!existsSync(ONYX_CONTROL_DIR)) await mkdir(ONYX_CONTROL_DIR, { recursive: true });
  if (!existsSync(DEPLOYMENTS_DIR)) await mkdir(DEPLOYMENTS_DIR, { recursive: true });
}

export function getDeploymentsDir(): string {
  return DEPLOYMENTS_DIR;
}

export function getDeploymentDir(name: string): string {
  return join(DEPLOYMENTS_DIR, name);
}

export async function saveDeployment(deployment: Deployment): Promise<void> {
  await ensureDirs();
  const dir = getDeploymentDir(deployment.config.name);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const configPath = join(dir, 'config.json');
  const statePath = join(dir, 'state.json');
  await writeFile(configPath, JSON.stringify(deployment.config, null, 2));
  await writeFile(statePath, JSON.stringify(deployment.state, null, 2));
}

export async function loadDeployment(name: string): Promise<Deployment | null> {
  const dir = getDeploymentDir(name);
  const configPath = join(dir, 'config.json');
  const statePath = join(dir, 'state.json');
  if (!existsSync(configPath) || !existsSync(statePath)) return null;
  const configData = await readFile(configPath, 'utf-8');
  const stateData = await readFile(statePath, 'utf-8');
  const config = DeploymentConfigSchema.parse(JSON.parse(configData));
  const state = DeploymentStateSchema.parse(JSON.parse(stateData));
  const sshKeyPath = join(dir, 'id_ed25519');
  return { config, state, sshKeyPath };
}

export async function deleteDeployment(name: string): Promise<void> {
  const dir = getDeploymentDir(name);
  if (existsSync(dir)) await rm(dir, { recursive: true, force: true });
}

export function getAllDeployments(): Deployment[] {
  if (!existsSync(DEPLOYMENTS_DIR)) return [];
  const entries = require('fs').readdirSync(DEPLOYMENTS_DIR);
  const deployments: Deployment[] = [];
  for (const entry of entries) {
    const deployment = require('fs').existsSync(join(DEPLOYMENTS_DIR, entry, 'config.json'))
      ? require('fs').existsSync(join(DEPLOYMENTS_DIR, entry, 'state.json'))
        ? require('fs').readFileSync(join(DEPLOYMENTS_DIR, entry, 'config.json'), 'utf-8')
        : null
      : null;
    if (deployment) {
      try {
        const config = DeploymentConfigSchema.parse(JSON.parse(deployment));
        const stateData = require('fs').readFileSync(join(DEPLOYMENTS_DIR, entry, 'state.json'), 'utf-8');
        const state = DeploymentStateSchema.parse(JSON.parse(stateData));
        const sshKeyPath = join(DEPLOYMENTS_DIR, entry, 'id_ed25519');
        deployments.push({ config, state, sshKeyPath });
      } catch {}
    }
  }
  return deployments;
}

export async function updateDeploymentState(name: string, state: Partial<DeploymentState>): Promise<void> {
  const deployment = await loadDeployment(name);
  if (!deployment) throw new Error(`Deployment ${name} not found`);
  const newState = { ...deployment.state, ...state, updatedAt: new Date().toISOString() };
  const statePath = join(getDeploymentDir(name), 'state.json');
  await writeFile(statePath, JSON.stringify(newState, null, 2));
}