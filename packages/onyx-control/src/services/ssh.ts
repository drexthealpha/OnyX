import { Client } from 'ssh2';
import { createReadStream, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { generateKeyPairSync, randomBytes } from 'crypto';
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';

export interface SSHConnection {
  client: Client;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
}

export async function createSSHKey(keyPath: string): Promise<string> {
  const dir = dirname(keyPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  const keyContent = privateKey.toString();
  writeFileSync(keyPath, keyContent, { mode: 0o600 });
  return keyContent;
}

export async function connectSSH(config: SSHConnection): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = new Client();
    client.on('ready', () => resolve(client));
    client.on('error', reject);
    client.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      ...(config.password ? { password: config.password } : {}),
      privateKey: config.privateKeyPath ? require('fs').readFileSync(config.privateKeyPath) : undefined,
    });
  });
}

export async function execSSH(client: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, stream) => {
      if (err) { reject(err); return; }
      let output = '';
      stream.on('data', (data: Buffer) => { output += data.toString(); });
      stream.on('close', () => { resolve(output); });
    });
  });
}

export async function uploadFile(client: Client, localPath: string, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.sftp((err, sftp) => {
      if (err) { reject(err); return; }
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export async function downloadFile(client: Client, remotePath: string, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.sftp((err, sftp) => {
      if (err) { reject(err); return; }
      sftp.fastGet(remotePath, localPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export async function closeSSH(client: Client): Promise<void> {
  client.end();
}

export function generateSSHKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return {
    publicKey: publicKey.toString(),
    privateKey: privateKey.toString(),
  };
}

export async function saveSSHKey(keyPath: string, privateKey: string): Promise<void> {
  const dir = dirname(keyPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(keyPath, privateKey, { mode: 0o600 });
}