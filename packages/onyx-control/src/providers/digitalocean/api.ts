export interface DigitalOceanServer {
  id: string;
  name: string;
  status: string;
  networks?: {
    v4?: Array<{ ip_address: string; type: string }>;
  };
}

export async function createDigitalOceanServer(
  apiKey: string,
  size: string = 's-1vcpu-2gb',
  region: string = 'nyc1',
  image: string = 'ubuntu-24-04-x64',
  sshKey: string
): Promise<DigitalOceanServer> {
  const response = await fetch('https://api.digitalocean.com/v2/droplets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'onyx-' + Date.now(),
      size: size,
      region: region,
      image: image,
      ssh_keys: [sshKey],
    }),
  });

  if (!response.ok) {
    throw new Error(`DigitalOcean API error: ${response.status}`);
  }

  const data = await response.json() as { droplet: DigitalOceanServer };
  return data.droplet;
}

export async function deleteDigitalOceanServer(apiKey: string, serverId: string): Promise<void> {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${serverId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`DigitalOcean API error: ${response.status}`);
  }
}

export async function getDigitalOceanServerIP(apiKey: string, serverId: string): Promise<string> {
  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${serverId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`DigitalOcean API error: ${response.status}`);
  }

  const data = await response.json() as { droplet: DigitalOceanServer };
  const v4 = data.droplet.networks?.v4?.find(n => n.type === 'public');
  return v4?.ip_address || '';
}

export async function listDigitalOceanServers(apiKey: string): Promise<DigitalOceanServer[]> {
  const response = await fetch('https://api.digitalocean.com/v2/droplets', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`DigitalOcean API error: ${response.status}`);
  }

  const data = await response.json() as { droplets: DigitalOceanServer[] };
  return data.droplets;
}