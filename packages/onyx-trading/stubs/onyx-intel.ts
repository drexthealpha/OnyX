export interface TwitterSearchParams {
  query: string;
  maxResults?: number;
}
export interface TwitterResult {
  text: string;
  publicMetrics?: { like_count?: number; retweet_count?: number };
}
export async function searchTwitter(params: TwitterSearchParams): Promise<TwitterResult[]> {
  return [];
}