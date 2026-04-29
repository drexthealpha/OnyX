import path from "path";
import fs from "fs";
// JSZip + xml2js approach for PPTX (pure JS, no native deps)
async function getJSZip() {
    // @ts-ignore
    const mod = await import("jszip");
    return mod.default ?? mod;
}
async function getXml2js() {
    // @ts-ignore
    const mod = await import("xml2js");
    return mod.default ?? mod;
}
/**
 * Extract all text runs from a parsed XML object recursively.
 * PPTX text is in a:t (DrawingML text run) elements.
 */
function extractTextRuns(obj) {
    const texts = [];
    function walk(node) {
        if (typeof node === "string")
            return;
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }
        if (node && typeof node === "object") {
            const o = node;
            // a:t = text run in DrawingML
            if ("a:t" in o) {
                const t = o["a:t"];
                if (Array.isArray(t))
                    texts.push(...t.map(String));
                else if (typeof t === "string")
                    texts.push(t);
            }
            Object.values(o).forEach(walk);
        }
    }
    walk(obj);
    return texts;
}
/**
 * Extract the slide title from a parsed slide XML.
 * The title placeholder has idx=0 or type="title"/"ctrTitle".
 */
function extractSlideTitle(slideXml) {
    try {
        const spTree = slideXml["p:sld"]?.["p:cSld"]?.[0]?.["p:spTree"]?.[0];
        if (!spTree)
            return null;
        const shapes = spTree["p:sp"] ?? [];
        for (const shape of shapes) {
            const sp = shape;
            const nvSpPr = sp["p:nvSpPr"]?.[0];
            const nvPr = nvSpPr?.["p:nvPr"]?.[0];
            const ph = nvPr?.["p:ph"]?.[0];
            const phAttr = ph?.["$"];
            const isTitle = phAttr?.["type"] === "title" ||
                phAttr?.["type"] === "ctrTitle" ||
                phAttr?.["idx"] === "0";
            if (isTitle) {
                const txBody = sp["p:txBody"]?.[0];
                if (txBody) {
                    const texts = extractTextRuns(txBody);
                    const title = texts.join("").trim();
                    if (title)
                        return title;
                }
            }
        }
    }
    catch {
        // ignore parse errors
    }
    return null;
}
/**
 * Parse a PPTX file.
 * Each slide → ## Slide N: {title} heading + bullet points for text content.
 * Uses JSZip to unzip the OOXML and xml2js to parse slide XML.
 */
export async function parse(filePath) {
    const JSZip = await getJSZip();
    const xml2js = await getXml2js();
    const buffer = fs.readFileSync(filePath);
    let zip;
    try {
        zip = await JSZip.loadAsync(buffer);
    }
    catch (err) {
        throw new Error(`PPTX parsing failed for "${path.basename(filePath)}": ${String(err)}`);
    }
    // Find all slide files in order
    const slideFiles = Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
        const numA = parseInt(a.match(/(\d+)/)?.[1] ?? "0", 10);
        const numB = parseInt(b.match(/(\d+)/)?.[1] ?? "0", 10);
        return numA - numB;
    });
    const parts = [];
    for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const xmlContent = await zip.files[slideFile].async("string");
        let slideXml;
        try {
            slideXml = await xml2js.parseStringPromise(xmlContent, {
                explicitArray: true,
                mergeAttrs: false,
            });
        }
        catch {
            parts.push(`## Slide ${i + 1}\n\n_[Unable to parse slide XML]_`);
            continue;
        }
        const title = extractSlideTitle(slideXml);
        const slideHeading = title
            ? `## Slide ${i + 1}: ${title}`
            : `## Slide ${i + 1}`;
        // Extract all text from the slide
        const allTexts = extractTextRuns(slideXml)
            .map((t) => t.trim())
            .filter((t) => t.length > 0 && t !== title);
        const bullets = allTexts.map((t) => `- ${t}`).join("\n");
        parts.push(bullets ? `${slideHeading}\n\n${bullets}` : slideHeading);
    }
    return parts.join("\n\n").trim();
}
//# sourceMappingURL=pptx.js.map