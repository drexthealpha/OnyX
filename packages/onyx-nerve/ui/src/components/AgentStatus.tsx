import { useState, useEffect } from "react";
import { get, post } from "./api.ts";

interface Agent {
  id: string;
  name: string;
  status: string;
  config?: unknown;
}

export default function AgentStatus() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const fetchAgents = () => {
    get<Agent[]>("/api/agents")
      .then(setAgents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const runAgent = async (id: string) => {
    setSelectedAgent(id);
    setModalOpen(true);
  };

  const submitRun = async () => {
    if (!selectedAgent || !prompt) return;
    try {
      await post(`/api/agents/${selectedAgent}/run`, { prompt });
      setModalOpen(false);
      setPrompt("");
      setSelectedAgent(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agents</h1>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : agents.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
          No agents found
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-t border-gray-800">
                  <td className="px-4 py-3 text-sm font-mono">{agent.id}</td>
                  <td className="px-4 py-3 text-sm">{agent.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      agent.status === "running" ? "bg-green-900/30 text-green-400" :
                      agent.status === "active" ? "bg-blue-900/30 text-blue-400" :
                      "bg-gray-800 text-gray-400"
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => runAgent(agent.id)}
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
                    >
                      Run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Run Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Run Agent</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter prompt..."
              className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm text-gray-100 mb-4 h-32"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitRun}
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded"
              >
                Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}