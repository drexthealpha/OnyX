import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard.tsx";
import AgentStatus from "./components/AgentStatus.tsx";
import ChannelList from "./components/ChannelList.tsx";
import TradingPanel from "./components/TradingPanel.tsx";
import ResearchPanel from "./components/ResearchPanel.tsx";
import VaultPanel from "./components/VaultPanel.tsx";
import IntelFeed from "./components/IntelFeed.tsx";
import TutorPanel from "./components/TutorPanel.tsx";
import BrowserTab from "./components/BrowserTab.tsx";
import MemoryTimeline from "./components/MemoryTimeline.tsx";

function getPanel(hash: string) {
  switch (hash.replace("#/", "") || "dashboard") {
    case "agents": return <AgentStatus />;
    case "channels": return <ChannelList />;
    case "trading": return <TradingPanel />;
    case "research": return <ResearchPanel />;
    case "vault": return <VaultPanel />;
    case "intel": return <IntelFeed />;
    case "tutor": return <TutorPanel />;
    case "browser": return <BrowserTab />;
    case "memory": return <MemoryTimeline />;
    default: return <Dashboard />;
  }
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "#/dashboard" },
  { label: "Agents", href: "#/agents" },
  { label: "Channels", href: "#/channels" },
  { label: "Trading", href: "#/trading" },
  { label: "Research", href: "#/research" },
  { label: "Vault", href: "#/vault" },
  { label: "Intel", href: "#/intel" },
  { label: "Tutor", href: "#/tutor" },
  { label: "Browser", href: "#/browser" },
  { label: "Memory", href: "#/memory" },
];

export default function App() {
  const [hash, setHash] = useState(window.location.hash || "#/dashboard");
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <nav className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-2">
        <div className="text-lg font-bold text-purple-400 mb-4">⬡ ONYX</div>
        {NAV_ITEMS.map(({ label, href }) => (
          <a key={href} href={href}
            className={`px-3 py-2 rounded text-sm ${hash === href ? "bg-purple-900 text-purple-200" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}`}>
            {label}
          </a>
        ))}
      </nav>
      <main className="flex-1 overflow-auto p-6">
        {getPanel(hash)}
      </main>
    </div>
  );
}