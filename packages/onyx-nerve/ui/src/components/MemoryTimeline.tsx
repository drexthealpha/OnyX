import { useState, useEffect } from "react";
import { get } from "./api.ts";

interface MemoryEntry {
  id: string;
  content: string;
  timestamp: string;
}

interface Agent {
  id: string;
  name: string;
}

export default function MemoryTimeline() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<Agent[]>("/api/agents")
      .then(setAgents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchMemories = async (agentId: string) => {
    setSelectedAgent(agentId);
    setLoading(true);
    setError(null);
    try {
      // Try to fetch from agent's memory endpoint
      const result = await get<MemoryEntry[]>(`/api/agents/${agentId}/memories`);
      setMemories(result);
    } catch (e) {
      // Fallback: show placeholder data
      setError("Memory module not available - install @onyx/mem for full timeline");
      setMemories([
        {
          id: "1",
          content: "Agent initialized with default configuration",
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          content: "Loaded skill: basic_trading",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Memory Timeline</h1>

      {error && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded p-3 mb-4 text-yellow-400">
          {error}
        </div>
      )}

      {/* Agent Selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Select Agent</h2>
        {loading && agents.length === 0 ? (
          <div className="animate-pulse">Loading agents...</div>
        ) : agents.length === 0 ? (
          <p className="text-gray-600 text-sm">No agents available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => fetchMemories(agent.id)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedAgent === agent.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {agent.name || agent.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      {selectedAgent && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Timeline</h2>
          {loading ? (
            <div className="animate-pulse">Loading memories...</div>
          ) : memories.length === 0 ? (
            <p className="text-gray-600 text-sm">No memories found</p>
          ) : (
            <div className="relative pl-8">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800" />
              
              {memories.map((mem, i) => (
                <div key={mem.id} className="relative pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-purple-500" />
                  
                  <div className="ml-4">
                    <p className="text-sm text-gray-300">{mem.content}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(mem.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedAgent && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
          Select an agent to view memory timeline
        </div>
      )}
    </div>
  );
}