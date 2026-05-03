export async function llmInvoke(prompt: string, model?: string): Promise<string> {
  const router = await import('@onyx/router');
  const budget: any = { userId: "lobster", maxCostPerRequestUSD: 0.1 };
  const response = await router.routeRequest(prompt, budget);
  return response.reasoning;
}