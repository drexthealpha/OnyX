/**
 * blog.ts — Blog post formatting and export utilities
 */

import type { BlogPost } from './types.js';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractTitle(markdown: string): { title: string; rest: string } {
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^#{1,2}\s+(.+)$/);
    if (match) {
      const title = match[1].trim();
      const rest = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n').trim();
      return { title, rest };
    }
  }
  const title = lines[0].replace(/^#+\s*/, '').trim();
  return { title, rest: lines.slice(1).join('\n').trim() };
}

export function formatBlogPost(markdownBody: string): BlogPost {
  const { title, rest } = extractTitle(markdownBody);
  const slug = slugify(title);
  const wordCount = rest.split(/\s+/).filter(Boolean).length;

  return {
    title,
    body: rest,
    slug,
    wordCount,
  };
}

export function blogToHtml(post: BlogPost): string {
  let html = post.body
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${post.title}</title>
</head>
<body>
  <article>
    <h1>${post.title}</h1>
    <p>${html}</p>
  </article>
</body>
</html>`;
}