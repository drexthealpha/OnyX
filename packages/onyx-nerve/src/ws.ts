import { WebSocketServer } from "ws";

export function initTradingWS(server: unknown): void {
  const wss = new WebSocketServer({ server: server as any, path: "/ws/trading" });

  wss.on("connection", (ws) => {
    const token = process.env['DEFAULT_TRADING_TOKEN'] ?? "So11111111111111111111111111111111111111112";

    const interval = setInterval(async () => {
      try {
        let price: unknown;
        try {
          // @ts-ignore
          const trading = await import("@onyx/trading");
          price = await trading.fetchPrice(token);
        } catch {
          // Fallback: direct Birdeye REST
          const key = process.env['BIRDEYE_API_KEY'] ?? "";
          const res = await fetch(
            `https://public-api.birdeye.so/defi/price?address=${token}`,
            { headers: { "X-API-KEY": key } }
          );
          const json = await res.json() as { data?: { value?: number } };
          price = json?.data?.value;
        }
        ws.send(JSON.stringify({ type: "price", data: { token, price }, timestamp: Date.now() }));
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", data: String(err), timestamp: Date.now() }));
      }
    }, 5000);

    ws.on("close", () => clearInterval(interval));
  });
}