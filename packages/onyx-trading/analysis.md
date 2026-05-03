# Build Error and Simulation Analysis

## 1. The Exact Cause of the Build Error

The `TS7016: Could not find a declaration file for module '@onyx/bridge'` error you are seeing when building `@onyx/solana` is a **TypeScript module resolution conflict**.

Here is exactly why it is happening:
1. **The Downstream Package (`@onyx/solana`)** is configured as an ES Module (`"type": "module"`) and uses the strict `"moduleResolution": "NodeNext"` setting from the workspace root.
2. **The Upstream Package (`@onyx/bridge`)** is missing `"type": "module"` in its `package.json` and does not have an `"exports"` map.
3. Because of this, when `@onyx/solana` attempts to dynamically import `@onyx/bridge` (`const bridge = await import("@onyx/bridge");`), TypeScript falls back to treating `@onyx/bridge` as a legacy CommonJS module. It then fails to map the `dist/index.js` and `dist/index.d.ts` files properly under strict `NodeNext` rules, implicitly typing the entire package as `any`.

## 2. The Exact Solution (No Stubs, No Mocks, No Errors)

To fix this properly without creating runtime or compile-time errors, we must do two things simultaneously in the `@onyx/bridge` package:

1. **Add `"type": "module"` back to `packages/onyx-bridge/package.json`.** This ensures that downstream packages (like `@onyx/solana`) correctly recognize the bridge package as a modern ES module.
2. **Update `packages/onyx-bridge/tsconfig.json` to use `"moduleResolution": "Bundler"` and `"module": "ESNext"`.** 
   - *Why this is critical:* If we simply add `"type": "module"`, TypeScript's strict `NodeNext` rules will throw `TS2835` errors everywhere, demanding that every single relative import inside `@onyx/bridge` end with `.js` (e.g., `import { X } from "./file.js"`). 
   - By using the `"Bundler"` resolution, we bypass the need to rewrite every single import extension in the bridge source code, while still correctly emitting ES module types that satisfy `@onyx/solana`.

*(I was in the middle of executing this exact fix when the build was interrupted in the previous turn).*

## 3. Is it a Simulation or a Real-World Product?

Based on an exhaustive scan of the codebase, **it is actively becoming a real-world product, but it was originally scaffolded as a simulation.**

Here is what was making it a simulation, which we have been systemically ripping out:
1. **The `dryRun` Execution Bypasses:** In `onyx-trading/src/trader.ts`, there was logic that checked `if (dryRun)` and completely skipped sending the transaction to the Solana network, instead just logging "Trade executed". We removed this.
2. **The Mock Portfolio Seed:** In `onyx-trading/src/portfolio.ts`, the database was hardcoded to initialize with a fake `$10,000` starting balance rather than deriving the balance dynamically from real on-chain addresses. We removed this.
3. **The Data Hallucination Fallbacks:** In `onyx-trading/src/analysts/news.ts`, if the real intelligence source failed, it would return a mock string `mock_news_data`. We removed this, forcing the agent to rely only on actual API responses or gracefully fail.

**What Remains?**
The only true "simulation" code left in `onyx-trading` is the `packages/onyx-trading/src/backtest/engine.ts`. This file is designed to replay historical candlestick data (`OHLCV`) without making live API calls to test strategy performance. This is standard in trading systems, but it should *never* be called in the live execution pipeline.

**Conclusion & Direction:**
The architecture itself (defined in your Session Plan) is designed to be a completely sovereign, real-world product with zero operator cost. By fixing the workspace dependency linking (the exact solution above), we bridge the gap between packages and allow the `onyx-trading` orchestrator to seamlessly invoke the actual `onyx-solana` tools, completing the transition from a simulated scaffold to a live, cryptographically-grounded agent OS.
