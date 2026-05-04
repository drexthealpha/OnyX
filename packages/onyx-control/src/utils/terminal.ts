import { execSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync } from 'fs';

export type OSType = 'windows' | 'macos' | 'linux' | 'unknown';

export function getOSType(): OSType {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  if (platform === 'linux') return 'linux';
  return 'unknown';
}

export function isTerminalSupported(): boolean {
  const os = getOSType();
  return os === 'windows' || os === 'macos' || os === 'linux';
}

export function openTerminalWithCommand(command: string): void {
  const os = getOSType();
  const shell = process.env['SHELL'] || '/bin/bash';
  
  if (os === 'windows') {
    const psCommand = `Start-Process powershell -ArgumentList '-NoExit', '-Command', '${command.replace(/'/g, "''")}'`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'ignore', windowsHide: true });
  } else if (os === 'macos') {
    const scriptPath = join(homedir(), '.onyx', 'control', 'temp_terminal_script.sh');
    const dir = join(homedir(), '.onyx', 'control');
    if (!existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
    const script = `osascript -e 'tell app "Terminal" to do script "${command.replace(/"/g, '\\"')}"'`;
    writeFileSync(scriptPath, script);
    execSync(`chmod +x "${scriptPath}" && "${scriptPath}"`, { stdio: 'ignore' });
    try { unlinkSync(scriptPath); } catch {}
  } else {
    const xterm = process.env['TERMINAL'] || 'xterm';
    execSync(`${xterm} -e "${command}" &`, { stdio: 'ignore' });
  }
}

export function getDefaultShell(): string {
  const os = getOSType();
  if (os === 'windows') return 'powershell';
  if (os === 'macos') return process.env['SHELL'] || '/bin/zsh';
  return process.env['SHELL'] || '/bin/bash';
}

export function detectTerminalEmulator(): string {
  const os = getOSType();
  if (os === 'windows') return 'Windows Terminal';
  if (os === 'macos') {
    const termApps = ['iTerm.app', 'Terminal.app'];
    for (const app of termApps) {
      try {
        execSync(`osascript -e 'tell app "System Events" to name of processes where background only is false'`);
        if (app === 'iTerm.app') return 'iTerm';
        return 'Terminal';
      } catch {}
    }
  }
  const linuxTerms = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm', 'urxvt'];
  for (const term of linuxTerms) {
    try {
      execSync(`which ${term}`, { stdio: 'ignore' });
      return term;
    } catch {}
  }
  return 'unknown';
}