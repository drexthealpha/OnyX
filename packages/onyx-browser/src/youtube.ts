import { execFile } from "child_process";
import { mkdtemp, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const YT_DLP_CANDIDATES = [
  "yt-dlp",
  "/usr/local/bin/yt-dlp",
  "/usr/bin/yt-dlp",
];
let ytDlpPath: string | null = null;

const SAFE_ENV = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  LANG: process.env.LANG,
  LC_ALL: process.env.LC_ALL,
  LC_CTYPE: process.env.LC_CTYPE,
  TMPDIR: process.env.TMPDIR,
};

export async function detectYtDlp(): Promise<boolean> {
  for (const candidate of YT_DLP_CANDIDATES) {
    try {
      await new Promise<void>((resolve, reject) => {
        execFile(candidate, ["--version"], { timeout: 5000 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      ytDlpPath = candidate;
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

function parseJson3(content: string): string {
  try {
    const data = JSON.parse(content);
    const lines: string[] = [];
    for (const event of data.events || []) {
      const start = event.start || 0;
      const mins = Math.floor(start / 60);
      const secs = start % 60;
      const prefix = `[${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}]`;
      for (const seg of event.segs || []) {
        lines.push(prefix + " " + (seg.utf8 || ""));
      }
    }
    return lines.join("\n");
  } catch {
    return content;
  }
}

function parseVtt(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let skip = true;

  for (const line of lines) {
    if (line.startsWith("WEBVTT")) continue;
    if (line.startsWith("Kind:")) continue;
    if (line.startsWith("Language:")) continue;
    if (line.startsWith("NOTE")) continue;
    if (/^\d{2}:\d{2}:\d{2}\.\d{3}/.test(line)) continue;
    if (!line.trim()) {
      skip = false;
      continue;
    }
    if (!skip) {
      out.push(line.replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, ""));
    }
  }

  return out.join("\n");
}

export async function getTranscript(videoUrl: string): Promise<string> {
  const ytRegex = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=|^https?:\/\/youtu\.be\//;
  if (!ytRegex.test(videoUrl)) {
    throw new Error("Invalid YouTube URL");
  }

  if (!ytDlpPath) {
    const found = await detectYtDlp();
    if (!found) {
      throw new Error("yt-dlp not found");
    }
  }

  const tmpDir = await mkdtemp(join(tmpdir(), "onyx-browser-"));
  const outTemplate = join(tmpDir, "%(id)s");

  await new Promise<void>((resolve, reject) => {
    execFile(
      ytDlpPath!,
      [
        "--skip-download",
        "--write-auto-sub",
        "--sub-lang",
        "en",
        "--sub-format",
        "json3",
        "-o",
        outTemplate,
        videoUrl,
      ],
      { timeout: 30000, env: SAFE_ENV },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  const files = await readdir(tmpDir);
  const subFile = files.find(
    (f) => f.endsWith(".json3") || f.endsWith(".vtt") || f.endsWith(".srv3")
  );

  if (!subFile) {
    await rm(tmpDir, { recursive: true, force: true });
    throw new Error("No subtitle file generated");
  }

  const content = await readFile(join(tmpDir, subFile), "utf-8");
  await rm(tmpDir, { recursive: true, force: true });

  if (subFile.endsWith(".json3")) {
    return parseJson3(content);
  }
  return parseVtt(content);
}
