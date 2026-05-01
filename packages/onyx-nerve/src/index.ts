import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { corsMiddleware } from "./middleware/cors.ts";
import { loggerMiddleware } from "./middleware/logger.ts";
import { authMiddleware } from "./middleware/auth.ts";
import { initSSE } from "./sse.ts";
import { initTradingWS } from "./ws.ts";
import agentsRouter from "./routes/agents.ts";
import channelsRouter from "./routes/channels.ts";
import pluginsRouter from "./routes/plugins.ts";
import tradingRouter from "./routes/trading.ts";
import researchRouter from "./routes/research.ts";
import vaultRouter from "./routes/vault.ts";
import routerRouter from "./routes/router.ts";
import rlRouter from "./routes/rl.ts";
import intelRouter from "./routes/intel.ts";
import tutorRouter from "./routes/tutor.ts";

export const NAME = 'onyx-nerve';

const NERVE_PORT = parseInt(process.env.NERVE_PORT ?? "3001", 10);

export const app = new Hono();

// Middleware
app.use("*", corsMiddleware);
app.use("*", loggerMiddleware);
app.use("*", authMiddleware);

// Health
app.get("/health", (c) =>
  c.json({ status: "ok", version: "1.0.0", port: NERVE_PORT })
);

// SSE
app.get("/events", (c) => initSSE(c));

// Routes
app.route("/api/agents", agentsRouter);
app.route("/api/channels", channelsRouter);
app.route("/api/plugins", pluginsRouter);
app.route("/api/trading", tradingRouter);
app.route("/api/research", researchRouter);
app.route("/api/vault", vaultRouter);
app.route("/api/router", routerRouter);
app.route("/api/rl", rlRouter);
app.route("/api/intel", intelRouter);
app.route("/api/tutor", tutorRouter);

// WebSocket (Node HTTP upgrade)
const server = serve({ fetch: app.fetch, port: NERVE_PORT }, () => {
  console.log(`[onyx-nerve] Listening on port ${NERVE_PORT}`);
});

initTradingWS(server);

export default app;