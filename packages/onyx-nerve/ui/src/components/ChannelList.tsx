import { useState, useEffect } from "react";
import { get, post } from "./api.ts";

interface Channel {
  id: string;
  name: string;
}

export default function ChannelList() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    get<Channel[]>("/api/channels")
      .then(setChannels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const sendMessage = async (id: string) => {
    try {
      await post(`/api/channels/${id}/send`, { message });
      setMessage("");
      setSendOpen(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Channels</h1>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : channels.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
          No channels
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => (
            <div key={ch.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{ch.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{ch.id}</div>
                </div>
                <button
                  onClick={() => setSendOpen(ch.id)}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Send
                </button>
              </div>
              {sendOpen === ch.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(ch.id)}
                  />
                  <button
                    onClick={() => sendMessage(ch.id)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}