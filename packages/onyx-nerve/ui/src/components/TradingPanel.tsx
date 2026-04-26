import { useState, useEffect, useRef } from "react";
import { get, post } from "./api.ts";

interface Portfolio {
  positions?: { token: string; amount: number; value: number }[];
  totalValue?: number;
}

interface TradeDecision {
  action: string;
  confidence: number;
  rationale: string;
}

interface BacktestResult {
  token: string;
  pnl: number;
  trades: number;
}

export default function TradingPanel() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [analyzeToken, setAnalyzeToken] = useState("");
  const [decision, setDecision] = useState<TradeDecision | null>(null);
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [wsPrice, setWsPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    get<Portfolio>("/api/trading/portfolio")
      .then(setPortfolio)
      .catch(() => {})
      .finally(() => setLoading(false));

    // WebSocket for live price
    const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/trading`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.data?.price) setWsPrice(data.data.price);
      } catch {}
    };
    wsRef.current = ws;

    return () => ws.close();
  }, []);

  const runAnalyze = async () => {
    if (!analyzeToken) return;
    try {
      const res = await post<TradeDecision>("/api/trading/analyze", { token: analyzeToken });
      setDecision(res);
    } catch {}
  };

  const runBacktest = async () => {
    if (!analyzeToken) return;
    try {
      const res = await post<BacktestResult>("/api/trading/backtest", { token: analyzeToken, days: 30 });
      setBacktest(res);
    } catch {}
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trading</h1>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <>
          {/* Live Price */}
          {wsPrice !== null && (
            <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-800 rounded flex items-center gap-3">
              <span className="animate-pulse text-emerald-400">●</span>
              <span className="text-emerald-400 font-bold">SOL ${wsPrice.toFixed(2)}</span>
            </div>
          )}

          {/* Portfolio */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Portfolio</h2>
            <div className="text-2xl font-bold text-emerald-400">
              ${portfolio?.totalValue?.toLocaleString() ?? "0"}
            </div>
            {portfolio?.positions?.map((pos, i) => (
              <div key={i} className="flex justify-between text-sm mt-2">
                <span>{pos.token}</span>
                <span>${pos.value.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Analyze/Backtest */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Analyze Token</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={analyzeToken}
                onChange={(e) => setAnalyzeToken(e.target.value)}
                placeholder="Token (e.g. SOL)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={runAnalyze}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
              >
                Analyze
              </button>
              <button
                onClick={runBacktest}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
              >
                Backtest
              </button>
            </div>

            {decision && (
              <div className="mt-3 p-3 bg-gray-800 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold ${
                    decision.action === "BUY" ? "text-green-400" :
                    decision.action === "SELL" ? "text-red-400" : "text-yellow-400"
                  }`}>{decision.action}</span>
                  <span className="text-xs text-gray-500">{(decision.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="text-sm text-gray-300">{decision.rationale}</p>
              </div>
            )}

            {backtest && (
              <div className="mt-3 p-3 bg-gray-800 rounded">
                <p className="text-sm">
                  <span className="text-gray-500">Backtest Result:</span>{" "}
                  <span className={backtest.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                    {backtest.pnl >= 0 ? "+" : ""}{backtest.pnl.toFixed(2)}%
                  </span>{" "}
                  ({backtest.trades} trades)
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}