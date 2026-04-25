import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(path.resolve(filePath), 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, 'utf-8');
}