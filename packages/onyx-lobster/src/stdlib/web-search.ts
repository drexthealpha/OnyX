export async function webSearch(query: string): Promise<string> {
  const intel = await import('@onyx/intel');
  const brief = await intel.runIntel(query);
  return brief.brief;
}