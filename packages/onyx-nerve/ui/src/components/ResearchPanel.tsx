import { useState, useEffect } from "react";
import { get, post } from "./api.ts";

interface Job {
  jobId: string;
  topic: string;
  status: string;
  deliverAt?: number;
}

export default function ResearchPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    get<Job[]>("/api/research/jobs")
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const runResearch = async () => {
    if (!topic) return;
    setRunning(true);
    try {
      const result = await post<Job>("/api/research/run", { topic });
      setJobs((prev) => [result, ...prev]);
      setTopic("");
    } catch {}
    setRunning(false);
  };

  const scheduleResearch = async () => {
    if (!topic) return;
    const deliverAt = Date.now() + 3600000; // 1 hour from now
    try {
      const result = await post<Job>("/api/research/schedule", { topic, deliverAt });
      setJobs((prev) => [result, ...prev]);
      setTopic("");
    } catch {}
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Research</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Research topic..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={runResearch}
            disabled={running || !topic}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            {running ? "Running..." : "Run Now"}
          </button>
          <button
            onClick={scheduleResearch}
            disabled={!topic}
            className="text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            Schedule (1h)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
          No research jobs
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.jobId} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{job.topic}</div>
                  <div className="text-xs text-gray-500 font-mono">{job.jobId}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  job.status === "complete" ? "bg-green-900/30 text-green-400" :
                  job.status === "running" ? "bg-blue-900/30 text-blue-400" :
                  "bg-gray-800 text-gray-400"
                }`}>
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}