import { useState, useEffect } from "react";
import { get, post } from "./api.ts";

interface Balance {
  sol?: number;
  usdc?: number;
}

interface Tx {
  id: string;
  type: string;
  amount: number;
  timestamp: string;
}

export default function VaultPanel() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [history, setHistory] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [txInput, setTxInput] = useState("");

  const fetchBalance = () => {
    get<Balance>("/api/vault/balance")
      .then(setBalance)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchHistory = () => {
    get<Tx[]>("/api/vault/history")
      .then(setHistory)
      .catch(() => {});
  };

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, []);

  const signTransaction = async () => {
    if (!txInput) return;
    try {
      await post("/api/vault/sign", { transaction: txInput });
      setTxInput("");
      fetchBalance();
    } catch {}
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vault</h1>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">SOL Balance</div>
              <div className="text-2xl font-bold text-emerald-400">{balance?.sol ?? 0}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">USDC Balance</div>
              <div className="text-2xl font-bold text-blue-400">{balance?.usdc ?? 0}</div>
            </div>
          </div>

          {/* Sign Transaction */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Sign Transaction</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={txInput}
                onChange={(e) => setTxInput(e.target.value)}
                placeholder="Base64 encoded transaction..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={signTransaction}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
              >
                Sign
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase">Transaction History</h2>
            {history.length === 0 ? (
              <p className="text-gray-600 text-sm">No transactions</p>
            ) : (
              <div className="space-y-2">
                {history.map((tx) => (
                  <div key={tx.id} className="flex justify-between text-sm border-b border-gray-800 pb-2">
                    <span className="text-gray-300">{tx.type}</span>
                    <span className={tx.amount >= 0 ? "text-green-400" : "text-red-400"}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount}
                    </span>
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