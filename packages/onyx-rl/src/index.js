import { app } from "./loop.js";
// RL_PORT is defined in kernel/constants (default 4010)
const port = Number(process.env.RL_PORT ?? 4010);
console.log(`[onyx-rl] Starting on port ${port}`);
export default {
    port,
    fetch: app.fetch,
};
//# sourceMappingURL=index.js.map