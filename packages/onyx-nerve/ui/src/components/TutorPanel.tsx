import { useState, useEffect, useRef } from "react";
import { get, post } from "./api.ts";

interface Session {
  id: string;
  createdAt: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TutorPanel() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    get<Session[]>("/api/tutor/sessions")
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input || !activeSession) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await post<{ answer: string }>("/api/tutor/ask", {
        question: input,
        sessionId: activeSession,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch {}

    setSending(false);
  };

  const startSession = async () => {
    try {
      const res = await post<{ sessionId: string }>("/api/tutor/ask", {
        question: "start session",
      });
      setActiveSession(res.sessionId);
      setMessages([]);
      setSessions((prev) => [{ id: res.sessionId, createdAt: new Date().toISOString() }, ...prev]);
    } catch {}
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tutor</h1>

      <div className="flex gap-4">
        {/* Sessions Sidebar */}
        <div className="w-48 bg-gray-900 border border-gray-800 rounded-lg p-3">
          <h2 className="text-xs text-gray-500 uppercase mb-2">Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-600">No sessions</p>
          ) : (
            <div className="space-y-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s.id)}
                  className={`w-full text-left text-xs px-2 py-1 rounded truncate ${
                    activeSession === s.id ? "bg-purple-900 text-purple-200" : "hover:bg-gray-800"
                  }`}
                >
                  {s.id.slice(0, 8)}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={startSession}
            className="w-full text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded mt-2"
          >
            New Session
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-gray-600 text-center mt-8">Start a conversation...</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white ml-auto"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {sending && (
              <div className="bg-gray-800 text-gray-500 rounded-lg px-4 py-2 animate-pulse">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-800 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={activeSession ? "Ask a question..." : "Start a session first"}
                disabled={!activeSession || sending}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!activeSession || sending || !input}
                className="text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}