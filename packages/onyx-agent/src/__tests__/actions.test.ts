import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  gatewayAction,
  searchAction,
  tradeAction,
  shieldAction,
  bridgeAction,
  researchAction,
  learnAction,
  memorizeAction,
  browseAction,
  recallAction,
  allActions,
} from "../actions";

describe("Onyx Agent Actions", () => {
  describe("allActions", () => {
    it("should export all 10 actions", () => {
      expect(allActions).toHaveLength(10);
    });
  });

  describe("Action structure validation", () => {
    it("each action should have required name field", () => {
      allActions.forEach((action) => {
        expect(action).toHaveProperty("name");
        expect(typeof action.name).toBe("string");
      });
    });

    it("each action should have description field", () => {
      allActions.forEach((action) => {
        expect(action).toHaveProperty("description");
        expect(typeof action.description).toBe("string");
      });
    });

    it("each action should have handler function", () => {
      allActions.forEach((action) => {
        expect(action).toHaveProperty("handler");
        expect(typeof action.handler).toBe("function");
      });
    });

    it("each action should have validate function", () => {
      allActions.forEach((action) => {
        expect(action).toHaveProperty("validate");
        expect(typeof action.validate).toBe("function");
      });
    });
  });
});