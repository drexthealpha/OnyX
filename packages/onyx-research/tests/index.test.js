import { describe, it, expect } from "vitest";
import { createEmptyState } from "../src/types.js";
describe("types", () => {
    it("createEmptyState creates a valid empty state", () => {
        const state = createEmptyState("Test Topic");
        expect(state.topic).toBe("Test Topic");
        expect(state.subQuestions).toEqual([]);
        expect(state.retrievedContent).toEqual([]);
        expect(state.synthesis).toBe("");
        expect(state.citations).toEqual([]);
        expect(state.report).toBe("");
        expect(state.complete).toBe(false);
        expect(state.reflectionPassed).toBe(false);
        expect(state.qualityScore).toBe(0);
        expect(state.errors).toEqual([]);
    });
});
describe("createEmptyState", () => {
    it("creates empty state with topic", () => {
        const state = createEmptyState("Solana DeFi");
        expect(state.topic).toBe("Solana DeFi");
    });
    it("initializes with default values", () => {
        const state = createEmptyState("AI Research");
        expect(state.complete).toBe(false);
        expect(state.qualityScore).toBe(0);
        expect(state.reflectionPassed).toBe(false);
    });
});
//# sourceMappingURL=index.test.js.map