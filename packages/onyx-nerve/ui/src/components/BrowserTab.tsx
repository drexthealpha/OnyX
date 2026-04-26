import { useState, useEffect } from "react";

const BROWSER_PORT = 9377;
const BROWSER_URL = `http://localhost:${BROWSER_PORT}`;

export default function BrowserTab() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`${BROWSER_URL}/health`, { mode: "no-cors" })
      .then(() => setConnected(true))
      .catch(() => setConnected(false))
      .finally(() => setChecking(false));

    const interval = setInterval(() => {
      fetch(`${BROWSER_URL}/health`, { mode: "no-cors" })
        .then(() => setConnected(true))
        .catch(() => setConnected(false));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Browser</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        {checking ? (
          <p className="text-gray-500">Checking browser status...</p>
        ) : connected ? (
          <>
            <div className="text-emerald-400 text-4xl mb-4">●</div>
            <p className="text-gray-300 mb-4">Browser backend is running</p>
            <a
              href={BROWSER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded"
            >
              Open Browser
            </a>
          </>
        ) : (
          <>
            <div className="text-red-400 text-4xl mb-4">●</div>
            <p className="text-gray-300 mb-2">Browser backend is not running</p>
            <p className="text-gray-600 text-sm mb-4">
              Start onyx-browser on port {BROWSER_PORT} to enable this feature
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded"
            >
              Retry
            </button>
          </>
        )}
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Instructions</h2>
        <p className="text-sm text-gray-500">
          The ONYX Browser provides a headless browsing capability for agents to interact with web content.
          To use this feature, you need to have <code className="bg-gray-800 px-1 py-0.5 rounded">@onyx/browser</code>{" "}
          installed and running.
        </p>
      </div>
    </div>
  );
}