export async function llmInvoke(prompt: string, model?: string): Promise<string> {
  const router = await import('@onyx/router');
  const response = await router.routeRequest(prompt, model ? 'MEDIUM' : undefined);
  return response;
}