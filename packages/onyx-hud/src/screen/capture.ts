// ─────────────────────────────────────────────
//  @onyx/hud — screen/capture.ts
//  capture(region?) → PNG Buffer
//  Uses screenshot-desktop. Crops with jimp if region specified.
// ─────────────────────────────────────────────

import screenshot from "screenshot-desktop";
import type { Region } from "../types.js";

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

/**
 * Captures the primary display as PNG. If region is provided, crops to it.
 * @returns PNG Buffer — first 4 bytes are always [137, 80, 78, 71]
 */
export async function capture(region?: Region): Promise<Buffer> {
  const raw: Buffer = await screenshot({ format: "png" });

  if (!raw.slice(0, 4).equals(PNG_HEADER)) {
    throw new Error("[onyx-hud/capture] screenshot-desktop did not return PNG data");
  }

  if (!region) return raw;

  const Jimp = await import("jimp");
  const image = await Jimp.Jimp.fromBuffer(raw);
  image.crop({
    x: Math.max(0, region.x),
    y: Math.max(0, region.y),
    w: Math.max(1, region.width),
    h: Math.max(1, region.height),
  });
  return await image.getBuffer("image/png");
}

/** Returns true if Buffer starts with PNG magic bytes. Used in tests. */
export function isPNG(buf: Buffer): boolean {
  return buf.length >= 4 && buf.slice(0, 4).equals(PNG_HEADER);
}