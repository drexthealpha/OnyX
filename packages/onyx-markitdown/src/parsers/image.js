import fs from "fs";
import path from "path";
// Supported image MIME types for Claude vision
const MIME_MAP = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
};
const VISION_PROMPT = "Describe this image in markdown. Include all text visible in the image. " +
    "Use headers (##, ###) for distinct sections. Use bullet lists for enumerations. " +
    "Be thorough and structured.";
/**
 * Parse an image file by calling Claude vision API.
 * Requires ANTHROPIC_API_KEY in environment (user-provided; zero operator cost).
 * Model: claude-sonnet-4-20250514
 */
export async function parse(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mediaType = MIME_MAP[ext];
    if (!mediaType) {
        throw new Error(`Unsupported image extension: "${ext}"`);
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is required for image parsing. Set it in your environment.");
    }
    // Read and base64-encode the image
    let imageData;
    try {
        const buffer = fs.readFileSync(filePath);
        imageData = buffer.toString("base64");
    }
    catch (err) {
        throw new Error(`Failed to read image file "${path.basename(filePath)}": ${String(err)}`);
    }
    // Call Anthropic Messages API directly (no SDK import needed — zero-dependency vision call)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: imageData,
                            },
                        },
                        {
                            type: "text",
                            text: VISION_PROMPT,
                        },
                    ],
                },
            ],
        }),
    });
    if (!response.ok) {
        const errorText = await response.text().catch(() => "unknown");
        throw new Error(`Claude vision API error ${response.status} for "${path.basename(filePath)}": ${errorText}`);
    }
    const data = (await response.json());
    const textBlock = data.content.find((b) => b.type === "text");
    const markdown = textBlock?.text ?? "";
    return markdown.trim();
}
//# sourceMappingURL=image.js.map