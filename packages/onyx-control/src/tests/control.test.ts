import { describe, it, expect, vi } from 'vitest';

describe('Theme', () => {
  it('exports statusColor function', async () => {
    const { statusColor } = await import('../theme.js');
    expect(statusColor).toBeDefined();
    expect(typeof statusColor).toBe('function');
  });

  it('exports logLevelColor function', async () => {
    const { logLevelColor } = await import('../theme.js');
    expect(logLevelColor).toBeDefined();
    expect(typeof logLevelColor).toBe('function');
  });

  it('exports theme object', async () => {
    const { t } = await import('../theme.js');
    expect(t).toBeDefined();
    expect(t.accent).toBeDefined();
    expect(t.status).toBeDefined();
  });
});

describe('Nerve service', () => {
  it('has all required methods', async () => {
    const { nerve } = await import('../services/nerve.js');
    expect(nerve.status).toBeDefined();
    expect(nerve.channels).toBeDefined();
    expect(nerve.computeJobs).toBeDefined();
    expect(nerve.portfolio).toBeDefined();
    expect(nerve.privateBalance).toBeDefined();
    expect(nerve.intelBrief).toBeDefined();
    expect(nerve.tutorProfile).toBeDefined();
    expect(nerve.navigate).toBeDefined();
  });
});

describe('Providers', () => {
  it('nosana provider exports functions', async () => {
    const nosana = await import('../providers/nosana/index.js');
    expect(nosana.listNosanaJobs).toBeDefined();
    expect(nosana.cancelNosanaJob).toBeDefined();
  });

  it('hetzner provider exports functions', async () => {
    const hetzner = await import('../providers/hetzner/index.js');
    expect(hetzner.createHetznerServer).toBeDefined();
    expect(hetzner.deleteHetznerServer).toBeDefined();
  });

  it('digitalocean provider exports functions', async () => {
    const doApi = await import('../providers/digitalocean/index.js');
    expect(doApi.createDigitalOceanServer).toBeDefined();
    expect(doApi.deleteDigitalOceanServer).toBeDefined();
  });
});

describe('Utils', () => {
  it('terminal utils are defined', async () => {
    const terminal = await import('../utils/terminal.js');
    expect(terminal.getOSType).toBeDefined();
    expect(terminal.openTerminalWithCommand).toBeDefined();
  });
});