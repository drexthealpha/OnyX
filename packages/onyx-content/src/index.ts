/**
 * @onyx/content — barrel export
 * Automated content generation and revenue routing.
 */

export { generateContent } from './generator.js';
export { createVideo } from './video.js';
export { postThread } from './social.js';
export { crosspost } from './crosspost.js';
export { generateImage } from './fal.js';
export { uploadVideo } from './youtube.js';
export { routeRevenue } from './revenue.js';
export { formatBlogPost } from './blog.js';

export type { Content, ContentType, CrosspostPlatform } from './types.js';