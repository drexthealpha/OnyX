import { useState, useEffect } from "react";
import { get, post } from "./api.ts";

interface IntelBrief {
  topic: string;
  brief: string;
  confidence: number;
  sources?: { url: string; title: string }[];
}

interface CachedTopic {
  key: string;
  topic: string;
}

export default function IntelFeed() {
  const [cache, setCache] = useState<CachedTopic[]>([]);
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<IntelBrief | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    get<CachedTopic[]>("/api/intel/cache")
      .then(setCache)
      .catch(() => {});
  }, []);

  const runIntel = async () => {
    if (!topic) return;
    setRunning(true);
    try {
      const res = await post<IntelBrief>("/api/intel/run", { topic });
      setResult(res);
      setTopic("");
    } catch {}
    setRunning(false);
  };

  const evictCache = async (key: string) => {
    try {
      await fetch(`/api/intel/cache/${key}`, { method: "DELETE" });
      setCache((prev) => prev.filter((c) => c.key !== key));
    } catch {}
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Intel</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Run Intel</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic to research..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={runIntel}
            disabled={running || !topic}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            {running ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{result.topic}</h3>
            <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
              {(result.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-4">{result.brief}</p>
          {result.sources && result.sources.length > 0 && (
            <div className="border-t border-gray-800 pt-3">
              <p className="text-xs text-gray-500 uppercase mb-2">Sources</p>
              <div className="space-y-1">
                {result.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-400 hover:underline"
                  >
                    {src.title || src.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {cache.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Cached Topics</h2>
          <div className="space-y-2">
            {cache.map((c) => (
              <div key={c.key} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{c.topic}</span>
                <button
                  onClick={() => evictCache(c.key)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Evict
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}