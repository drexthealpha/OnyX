const NOSANA_API = process.env.NOSANA_API ?? 'https://dashboard.k8s.prd.nos.ci/api';

export interface NosanaJob { jobId: string; image: string; status: string; cost: number; duration: number; }

export async function listNosanaJobs(marketAddress?: string): Promise<NosanaJob[]> {
  const url = marketAddress
    ? `${NOSANA_API}/jobs?market=${marketAddress}`
    : `${NOSANA_API}/jobs`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const data = await r.json() as { jobs?: NosanaJob[] };
  return data.jobs ?? [];
}

export async function cancelNosanaJob(jobId: string): Promise<boolean> {
  const r = await fetch(`${NOSANA_API}/jobs/${jobId}/cancel`, { method: 'POST' });
  return r.ok;
}