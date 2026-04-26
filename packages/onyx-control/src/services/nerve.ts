const NERVE_PORT = process.env.NERVE_PORT ?? '3001';
const NERVE_BASE = `http://localhost:${NERVE_PORT}`;

async function nerveGet<T>(path: string): Promise<T> {
  const r = await fetch(`${NERVE_BASE}${path}`);
  if (!r.ok) throw new Error(`nerve ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}
async function nervePost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${NERVE_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`nerve POST ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}

export const nerve = {
  status:         () => nerveGet('/status'),
  channels:       () => nerveGet('/channels'),
  computeJobs:    () => nerveGet('/compute/jobs'),
  portfolio:      () => nerveGet('/trading/portfolio'),
  privateBalance: () => nerveGet('/vault/private-balance'),
  intelBrief:     (topic: string) => nerveGet(`/intel/brief?topic=${encodeURIComponent(topic)}`),
  tutorProfile:   (id = 'default') => nerveGet(`/tutor/profile/${id}`),
  navigate:       (url: string) => nervePost('/browser-tab/navigate', { url }),
  deployments:    () => nerveGet('/deployments'),
  deploymentStatus: (name: string) => nerveGet(`/deployments/${name}/status`),
  deploymentLogs: (name: string) => nerveGet(`/deployments/${name}/logs`),
  startDeployment:(name: string) => nervePost(`/deployments/${name}/start`, {}),
};