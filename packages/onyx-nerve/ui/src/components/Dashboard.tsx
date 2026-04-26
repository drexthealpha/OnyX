import { useState, useEffect } from "react";
import { get } from "./api.ts";
import { connectSSE } from "./api.ts";

interface HealthData {
  status: string;
  version: string;
  port: number;
}

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface Channel {
  id: string;
  name: string;
}

interface VaultBalance {
  sol?: number;
  usdc?: number;
}

interface SSEEvent {
  type: string;
  data: unknown;
  timestamp: number;
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [balance, setBalance] = useState<VaultBalance | null>(null);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch health
    get<HealthData>("/health")
      .then(setHealth)
      .catch((e) => setError(e.message));

    // Fetch agents
    get<Agent[]>("/api/agents")
      .then(setAgents)
      .catch(() => {});

    // Fetch channels
    get<Channel[]>("/api/channels")
      .then(setChannels)
      .catch(() => {});

    // Fetch vault balance
    get<VaultBalance>("/api/vault/balance")
      .then(setBalance)
      .catch(() => {});

    // Open SSE connection
    const es = connectSSE((e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents((prev) => [data, ...prev].slice(0, 10));
      } catch {}
    });

    setLoading(false);

    return () => es.close();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Status</div>
              <div className="text-xl font-bold text-emerald-400">{health?.status ?? "—"}</div>
              <div className="text-xs text-gray-600">v{health?.version ?? "—"}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Agents</div>
              <div className="text-xl font-bold text-purple-400">{agents.length}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Channels</div>
              <div className="text-xl font-bold text-blue-400">{channels.length}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Vault (SOL)</div>
              <div className="text-xl font-bold text-yellow-400">{balance?.sol ?? "—"}</div>
            </div>
          </div>

          {/* Event Feed */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Live Events</h2>
            {events.length === 0 ? (
              <p className="text-gray-600 text-sm">Waiting for events...</p>
            ) : (
              <div className="space-y-2">
                {events.map((ev, i) => (
                  <div key={i} className="text-xs font-mono bg-gray-800 rounded p-2">
                    <span className="text-purple-400">[{ev.type}]</span>{" "}
                    <span className="text-gray-300">{JSON.stringify(ev.data)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}