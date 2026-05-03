// ============================================================
// packages/onyx-seo/src/commands/publish.ts
// publish(article) — publishes to WordPress via REST API
// WP_URL, WP_USERNAME, WP_APP_PASSWORD — user-provided, operator cost: $0
// ============================================================

import type { Article, PublishResult } from "../types.js";

interface WPPost {
  title: string;
  content: string;
  status: "draft" | "publish";
  meta: {
    _yoast_wpseo_title: string;
    _yoast_wpseo_metadesc: string;
    _yoast_wpseo_focuskw: string;
  };
}

function getWPCredentials(): {
  url: string;
  username: string;
  appPassword: string;
} {
  const url = process.env.WP_URL;
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!url || !username || !appPassword) {
    throw new Error(
      "WP_URL, WP_USERNAME, and WP_APP_PASSWORD must be set in environment"
    );
  }

  return { url, username, appPassword };
}

/**
 * Publishes an article to WordPress via REST API with Yoast SEO metadata.
 * Requires the seo-machine-yoast-rest.php MU-plugin installed on WordPress site.
 *
 * @param article - The article to publish
 * @param status - "draft" (default) or "publish"
 * @returns PublishResult with success status and URL or error
 */
export async function publish(
  article: Article,
  status: "draft" | "publish" = "draft"
): Promise<PublishResult> {
  const { url, username, appPassword } = getWPCredentials();

  const auth = btoa(`${username}:${appPassword}`);

  const post: WPPost = {
    title: article.title,
    content: article.content,
    status,
    meta: {
      _yoast_wpseo_title: article.title,
      _yoast_wpseo_metadesc: article.metaDescription,
      _yoast_wpseo_focuskw: article.keywords[0] ?? "",
    },
  };

  try {
    const res = await fetch(`${url}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(post),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `WordPress API error ${res.status}: ${err}` };
    }

    const data = await res.json() as any;
    return {
      success: true,
      url: data.link ?? `${url}/?p=${data.id}`,
      postId: data.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}