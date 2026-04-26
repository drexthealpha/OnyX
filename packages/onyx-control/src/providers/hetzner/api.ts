export interface HetznerServer {
  id: string;
  name: string;
  status: string;
  public_net?: {
    ipv4?: {
      ip: string;
    };
  };
}

export async function createHetznerServer(
  apiKey: string,
  serverType: string = 'cpx11',
  location: string = 'ash',
  image: string = 'ubuntu-24.04',
  sshKey: string
): Promise<HetznerServer> {
  const response = await fetch('https://api.hetzner.cloud/v1/servers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'onyx-' + Date.now(),
      server_type: serverType,
      location: location,
      image: image,
      ssh_keys: [{ name: 'onyx-key-' + Date.now(), public_key: sshKey }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Hetzner API error: ${response.status}`);
  }

  const data = await response.json() as { server: HetznerServer };
  return data.server;
}

export async function deleteHetznerServer(apiKey: string, serverId: string): Promise<void> {
  const response = await fetch(`https://api.hetzner.cloud/v1/servers/${serverId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Hetzner API error: ${response.status}`);
  }
}

export async function getHetznerServerIP(apiKey: string, serverId: string): Promise<string> {
  const response = await fetch(`https://api.hetzner.cloud/v1/servers/${serverId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Hetzner API error: ${response.status}`);
  }

  const data = await response.json() as { server: HetznerServer };
  return data.server.public_net?.ipv4?.ip || '';
}

export async function listHetznerServers(apiKey: string): Promise<HetznerServer[]> {
  const response = await fetch('https://api.hetzner.cloud/v1/servers', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Hetzner API error: ${response.status}`);
  }

  const data = await response.json() as { servers: HetznerServer[] };
  return data.servers;
}